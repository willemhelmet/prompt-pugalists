const DECART_API_KEY = process.env.DECART_API_KEY!;
const DECART_BASE = "https://api.decart.ai/v1/generate";

/**
 * Generate a character image from a text prompt (text-to-image).
 * Uses Lucy-Pro t2i endpoint.
 */
export async function generateCharacterImage(
  prompt: string,
): Promise<Buffer> {
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("resolution", "720p");

  const res = await fetch(`${DECART_BASE}/lucy-pro-t2i`, {
    method: "POST",
    headers: { "X-API-KEY": DECART_API_KEY },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Decart t2i failed (${res.status}): ${text}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  console.log(
    `[Decart] Generated character image (${buffer.length} bytes) for prompt: "${prompt.slice(0, 60)}..."`,
  );
  return buffer;
}

/**
 * Edit/transform an existing image using a text prompt (image-to-image).
 * Uses Lucy-Pro i2i endpoint.
 */
export async function editCharacterImage(
  imageBuffer: Buffer,
  prompt: string,
): Promise<Buffer> {
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" });

  const formData = new FormData();
  formData.append("data", blob, "reference.jpg");
  formData.append("prompt", prompt);
  formData.append("resolution", "720p");

  const res = await fetch(`${DECART_BASE}/lucy-pro-i2i`, {
    method: "POST",
    headers: { "X-API-KEY": DECART_API_KEY },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Decart i2i failed (${res.status}): ${text}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  console.log(
    `[Decart] Edited character image (${buffer.length} bytes) for prompt: "${prompt.slice(0, 60)}..."`,
  );
  return buffer;
}
