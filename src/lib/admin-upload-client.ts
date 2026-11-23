import { ADMIN_UPLOAD_PATH } from "@/lib/admin-upload-path";

export async function uploadAdminFile(file: File): Promise<{ url: string; kind: string }> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(ADMIN_UPLOAD_PATH, { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; kind?: string; error?: string };
  if (!res.ok || typeof data.url !== "string" || !data.url) {
    throw new Error(data.error || "Upload thất bại");
  }
  return { url: data.url, kind: String(data.kind || "") };
}
