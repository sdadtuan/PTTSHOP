import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const outDir = path.join(root, "public", "videos");
fs.mkdirSync(outDir, { recursive: true });

const imgs = ["kem-front.jpg", "kem-back.jpg", "kem-fabric.jpg"].map((f) =>
  path.join(root, "public", "images", "ai-hoodies", f),
);

const out = path.join(outDir, "demo-hoodie-kem.mp4");
const args = [
  "-y",
  "-loop",
  "1",
  "-t",
  "2",
  "-i",
  imgs[0],
  "-loop",
  "1",
  "-t",
  "2",
  "-i",
  imgs[1],
  "-loop",
  "1",
  "-t",
  "2",
  "-i",
  imgs[2],
  "-filter_complex",
  "[0:v]scale=720:960:force_original_aspect_ratio=decrease,pad=720:960:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,format=yuv420p[v0];[1:v]scale=720:960:force_original_aspect_ratio=decrease,pad=720:960:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,format=yuv420p[v1];[2:v]scale=720:960:force_original_aspect_ratio=decrease,pad=720:960:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24,format=yuv420p[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v]",
  "-map",
  "[v]",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  "-an",
  out,
];

const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status || 1);
fs.writeFileSync(
  path.join(outDir, "README.md"),
  "demo-hoodie-kem.mp4 — slideshow local từ ai-hoodies Kem front/back/fabric ~6s H.264 (Admin upload demo; KHÔNG phải video AI).\n",
);
console.log("Wrote", out, fs.statSync(out).size, "bytes");
