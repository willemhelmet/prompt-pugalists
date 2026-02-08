import { Router } from "express";
import {
  generateCharacterSuggestion,
  generateEnvironmentSuggestion,
  enhanceCharacterPrompt,
  enhanceEnvironmentPrompt,
} from "../ai/mistral.js";

export function suggestRoutes(): Router {
  const router = Router();

  router.post("/character", async (_req, res) => {
    try {
      const result = await generateCharacterSuggestion();
      res.json(result);
    } catch (err: any) {
      console.error("[Suggest] Character suggestion failed:", err);
      res.status(500).json({ error: err.message || "Suggestion failed" });
    }
  });

  router.post("/environment", async (_req, res) => {
    try {
      const prompt = await generateEnvironmentSuggestion();
      res.json({ prompt });
    } catch (err: any) {
      console.error("[Suggest] Environment suggestion failed:", err);
      res.status(500).json({ error: err.message || "Suggestion failed" });
    }
  });

  router.post("/enhance-character", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }
    try {
      const enhancedPrompt = await enhanceCharacterPrompt(prompt.trim());
      res.json({ enhancedPrompt });
    } catch (err: any) {
      console.error("[Suggest] Character enhance failed:", err);
      res.status(500).json({ error: err.message || "Enhancement failed" });
    }
  });

  router.post("/enhance-environment", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }
    try {
      const enhancedPrompt = await enhanceEnvironmentPrompt(prompt.trim());
      res.json({ enhancedPrompt });
    } catch (err: any) {
      console.error("[Suggest] Environment enhance failed:", err);
      res.status(500).json({ error: err.message || "Enhancement failed" });
    }
  });

  return router;
}
