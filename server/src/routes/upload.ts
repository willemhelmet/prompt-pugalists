import { Router } from "express";
import multer from "multer";
import { generateCharacterImage, editCharacterImage } from "../ai/decart.js";
import { uploadToImgBB } from "../ai/imgbb.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function uploadRoutes(): Router {
  const router = Router();

  // Upload a user's image directly to ImgBB
  router.post("/image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const url = await uploadToImgBB(req.file.buffer);
      res.json({ url });
    } catch (err: any) {
      console.error("[Upload] Image upload failed:", err);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });

  // Generate character image via Decart t2i, host on ImgBB
  router.post("/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "prompt is required" });
        return;
      }

      const imageBuffer = await generateCharacterImage(prompt);
      const url = await uploadToImgBB(imageBuffer);
      res.json({ url });
    } catch (err: any) {
      console.error("[Upload] Generation failed:", err);
      res.status(500).json({ error: err.message || "Generation failed" });
    }
  });

  // Edit image via Decart i2i with reference image, host on ImgBB
  router.post(
    "/generate-with-reference",
    upload.single("referenceImage"),
    async (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "No reference image uploaded" });
          return;
        }

        const prompt = req.body.prompt;
        if (!prompt || typeof prompt !== "string") {
          res.status(400).json({ error: "prompt is required" });
          return;
        }

        const imageBuffer = await editCharacterImage(req.file.buffer, prompt);
        const url = await uploadToImgBB(imageBuffer);
        res.json({ url });
      } catch (err: any) {
        console.error("[Upload] Generation with reference failed:", err);
        res
          .status(500)
          .json({ error: err.message || "Generation with reference failed" });
      }
    },
  );

  return router;
}
