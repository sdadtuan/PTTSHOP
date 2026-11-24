import { execFile } from "child_process";
import { promisify } from "util";
import { VIDEO_CODEC_ERROR } from "@/lib/video-file";

const exec = promisify(execFile);

const FORBIDDEN_CODECS = new Set(["hevc", "h265", "prores", "prores_ks"]);

async function run(args: string[]) {
  await exec("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], {
    timeout: 120_000,
  });
}

export async function videoCodecName(file: string): Promise<string | null> {
  try {
    const { stdout } = await exec(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name",
        "-of",
        "csv=p=0",
        file,
      ],
      { timeout: 30_000 },
    );
    const name = stdout.trim().toLowerCase();
    return name || null;
  } catch {
    return null;
  }
}

export function codecError(name: string | null) {
  if (name && FORBIDDEN_CODECS.has(name)) return VIDEO_CODEC_ERROR;
  return null;
}

export async function faststartMp4(input: string, output: string) {
  await run(["-y", "-i", input, "-c", "copy", "-movflags", "+faststart", output]);
}

export async function posterAtOneSecond(input: string, output: string) {
  try {
    await run(["-y", "-ss", "1", "-i", input, "-frames:v", "1", output]);
  } catch {
    await run(["-y", "-ss", "0", "-i", input, "-frames:v", "1", output]);
  }
}
