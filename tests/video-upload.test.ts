import { execFile } from "child_process";
import { createReadStream, statSync } from "fs";
import { mkdtemp, readFile, rm, unlink } from "fs/promises";
import { createServer, type Server } from "http";
import { tmpdir } from "os";
import path from "path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { promisify } from "util";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ProductGallery } from "@/components/product/product-gallery";
import { inspectMp4 } from "@/lib/video-file";

const exec = promisify(execFile);
const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { POST as uploadPOST } from "@/app/api/upload/route";

const MEDIA_URL = /^\/media\/uploads\/([A-Za-z0-9][A-Za-z0-9._-]{0,180}\.(jpe?g|png|webp|avif|gif|mp4|webm))$/;

delete process.env.MEDIA_DIR;

let dir = "";
let lateFile = "";
let server: Server;
let port = 0;

function box(type: string, payload: Buffer) {
  const out = Buffer.alloc(8 + payload.length);
  out.writeUInt32BE(out.length, 0);
  out.write(type, 4, 4, "latin1");
  payload.copy(out, 8);
  return out;
}

function ftyp(brand: string) {
  return box(
    "ftyp",
    Buffer.concat([Buffer.from(brand), Buffer.alloc(4), Buffer.from(brand)]),
  );
}

async function makeMp4(target: string) {
  await exec("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=64x64:rate=10:duration=2",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=2",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    target,
  ]);
}

function listen(root: string) {
  const httpServer = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const file = path.join(root, decodeURIComponent(url.pathname));
    const stat = statSync(file);
    const type = file.endsWith(".mp4")
      ? "video/mp4"
      : file.endsWith(".jpg")
        ? "image/jpeg"
        : "application/octet-stream";
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", type);
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) {
        res.statusCode = 416;
        res.end();
        return;
      }
      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      res.setHeader("Content-Length", String(end - start + 1));
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Length", String(stat.size));
    createReadStream(file).pipe(res);
  });
  return new Promise<Server>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => {
      const addr = httpServer.address();
      port = typeof addr === "object" && addr ? addr.port : 0;
      resolve(httpServer);
    });
  });
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "ptt-video-"));
  lateFile = path.join(dir, "late.mp4");
  await makeMp4(lateFile);
  server = await listen(path.join(process.cwd(), "public"));
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dir, { recursive: true, force: true });
});

async function upload(filePath: string, name: string) {
  authMock.mockResolvedValue({ user: { id: "admin-test", role: "ADMIN" } });
  const bytes = await readFile(filePath);
  const body = new FormData();
  body.append("file", new File([bytes], name, { type: "video/mp4" }));
  const res = await uploadPOST(new Request("http://localhost/api/upload", { method: "POST", body }));
  const json = (await res.json()) as { url?: string; posterUrl?: string | null; error?: string; kind?: string };
  return { status: res.status, json };
}

describe("video upload", () => {
  it("rejects HEVC and ProRes before writing a file", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-test", role: "ADMIN" } });
    const hevc = Buffer.concat([ftyp("hev1"), box("moov", Buffer.alloc(0)), box("mdat", Buffer.alloc(16))]);
    const prores = Buffer.concat([
      ftyp("qt  "),
      box("moov", box("apch", Buffer.alloc(8))),
      box("mdat", Buffer.alloc(16)),
    ]);
    for (const [bytes, name] of [
      [hevc, "hevc.mp4"],
      [prores, "prores.mp4"],
    ] as const) {
      const body = new FormData();
      body.append("file", new File([bytes], name, { type: "video/mp4" }));
      const res = await uploadPOST(new Request("http://localhost/api/upload", { method: "POST", body }));
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error?: string };
      expect(json.error).toMatch(/HEVC hoặc ProRes/);
    }
  });

  it("stores /media/uploads, poster, faststart, and answers 200 plus Range 206", async () => {
    const late = await upload(lateFile, "late.mp4");
    expect(late.status, late.json.error).toBe(200);
    expect(late.json.kind).toBe("video");
    expect(late.json.url).toMatch(/^\/media\/uploads\/\d+-[a-f0-9]{8}\.mp4$/);
    expect(late.json.posterUrl).toMatch(/^\/media\/uploads\/\d+-[a-f0-9]{8}\.jpg$/);
    expect(late.json.url).toMatch(MEDIA_URL);
    expect(late.json.posterUrl).toMatch(MEDIA_URL);

    const videoPath = path.join(process.cwd(), "public", late.json.url!);
    const posterPath = path.join(process.cwd(), "public", late.json.posterUrl!);
    const stored = await readFile(videoPath);
    const inspected = inspectMp4(stored);
    expect(inspected.ok).toBe(true);
    if (inspected.ok) expect(inspected.faststart).toBe(false);
    const poster = await readFile(posterPath);
    expect(poster.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);

    const headers = await exec("curl", [
      "-sI",
      `http://127.0.0.1:${port}${late.json.url}`,
    ]);
    expect(headers.stdout).toMatch(/HTTP\/1\.1 200/);
    expect(headers.stdout.toLowerCase()).toContain("content-type: video/mp4");
    expect(headers.stdout.toLowerCase()).toContain("accept-ranges: bytes");

    const ranged = await exec("curl", [
      "-sI",
      "-H",
      "Range: bytes=0-1",
      `http://127.0.0.1:${port}${late.json.url}`,
    ]);
    expect(ranged.stdout).toMatch(/HTTP\/1\.1 206/);
    expect(ranged.stdout.toLowerCase()).toContain("content-type: video/mp4");
    expect(ranged.stdout.toLowerCase()).toContain("content-range: bytes 0-1/");

    const saved = [
      {
        url: late.json.url!,
        posterUrl: late.json.posterUrl,
        type: "video",
        alt: "Mũ bucket",
        color: "Đen",
      },
    ];
    const markup = (images: typeof saved) =>
      renderToStaticMarkup(
        createElement(ProductGallery, {
          images,
          name: "Mũ bucket",
          selectedColor: "Đen",
        }),
      );
    const first = markup(saved);
    const reloaded = markup(JSON.parse(JSON.stringify(saved)));
    expect(first).toContain('data-testid="pdp-product-video"');
    expect(first).toContain(`src="${late.json.url}"`);
    expect(first).toContain(`poster="${late.json.posterUrl}"`);
    expect(reloaded).toBe(first);

    await unlink(videoPath);
    await unlink(posterPath);
  });
});
