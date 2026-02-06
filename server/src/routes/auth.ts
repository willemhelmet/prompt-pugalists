import { Router } from "express";
import { nanoid } from "nanoid";
import type Database from "better-sqlite3";

export function authRoutes(db: Database.Database): Router {
  const router = Router();

  // Create anonymous session
  router.post("/session", (_req, res) => {
    const sessionId = nanoid();
    // For Phase 1, just return a session ID — no DB persistence needed
    res.json({ sessionId });
  });

  // Get current session (placeholder)
  router.get("/session", (req, res) => {
    // TODO: validate session from header/cookie
    res.json({ valid: true });
  });

  return router;
}
