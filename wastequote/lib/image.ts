// Browser-side image prep: hash the original bytes (so the stub can
// recognise a demo photo) and downscale to Claude's recommended long edge.
export interface PreparedImage {
  dataUrl: string;
  base64: string;
  mediaType: "image/jpeg";
  sha256: string;
  filename: string;
  width: number;
  height: number;
}

// Within Claude's recommended 1568 px, and small enough for a quick Sailsrep chat turn.
const MAX_EDGE = 1280;

async function sha256Hex(buf: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function prepareImage(file: Blob, filename: string): Promise<PreparedImage> {
  const bytes = await file.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { dataUrl, base64: dataUrl.split(",")[1], mediaType: "image/jpeg", sha256, filename, width, height };
}
