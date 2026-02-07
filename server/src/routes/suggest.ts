import { Router } from "express";
import {
  generateCharacterSuggestion,
  generateEnvironmentSuggestion,
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

  return router;
}
