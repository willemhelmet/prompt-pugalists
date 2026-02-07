const IMGBB_API_KEY = process.env.IMGBB_API_KEY!;

export async function uploadToImgBB(imageBuffer: Buffer): Promise<string> {
  const base64 = imageBuffer.toString("base64");

  const formData = new FormData();
  formData.append("image", base64);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImgBB upload failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    success: boolean;
    data: { display_url: string };
  };

  if (!json.success) {
    throw new Error("ImgBB upload returned success=false");
  }

  console.log("[ImgBB] Image uploaded:", json.data.display_url);
  return json.data.display_url;
}
