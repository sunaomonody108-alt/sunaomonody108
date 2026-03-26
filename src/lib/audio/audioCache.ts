import fs from "fs";
import path from "path";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

export async function saveAudioLocally(
  lineId: string,
  audioBase64: string
): Promise<string> {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const filename = `${lineId}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(audioBase64, "base64"));

  return `/audio/${filename}`;
}

export function getLocalAudioUrl(lineId: string): string | null {
  const filepath = path.join(AUDIO_DIR, `${lineId}.mp3`);
  if (fs.existsSync(filepath)) {
    return `/audio/${lineId}.mp3`;
  }
  return null;
}

export async function saveAudio(
  lineId: string,
  audioBase64: string
): Promise<string> {
  if (process.env.NODE_ENV === "production" && process.env.BLOB_READ_WRITE_TOKEN) {
    // Production: use Vercel Blob
    const { put } = await import("@vercel/blob");
    const buffer = Buffer.from(audioBase64, "base64");
    const blob = await put(`audio/${lineId}.mp3`, buffer, {
      access: "public",
      contentType: "audio/mpeg",
    });
    return blob.url;
  }

  // Development: save locally
  return saveAudioLocally(lineId, audioBase64);
}

export function getCachedAudioUrl(lineId: string, existingUrl: string | null): string | null {
  if (existingUrl) return existingUrl;
  if (process.env.NODE_ENV !== "production") {
    return getLocalAudioUrl(lineId);
  }
  return null;
}
