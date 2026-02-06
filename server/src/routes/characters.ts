import { Router } from "express";
import { nanoid } from "nanoid";
import type Database from "better-sqlite3";

export function characterRoutes(db: Database.Database): Router {
  const router = Router();

  // List characters for a user
  router.get("/", (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.json([]);
      return;
    }

    const characters = db
      .prepare("SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId);

    res.json(characters);
  });

  // Get single character
  router.get("/:id", (req, res) => {
    const character = db.prepare("SELECT * FROM characters WHERE id = ?").get(req.params.id);

    if (!character) {
      res.status(404).json({ error: "Character not found" });
      return;
    }

    res.json(character);
  });

  // Create character
  router.post("/", (req, res) => {
    const { userId, name, imageUrl, textPrompt, referenceImageUrl } = req.body;
    const id = nanoid();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO characters (id, user_id, name, image_url, text_prompt, reference_image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, userId, name, imageUrl, textPrompt, referenceImageUrl || null, now, now);

    const character = db.prepare("SELECT * FROM characters WHERE id = ?").get(id);
    res.status(201).json(character);
  });

  // Update character
  router.put("/:id", (req, res) => {
    const { name, imageUrl, textPrompt, referenceImageUrl } = req.body;
    const now = new Date().toISOString();

    const result = db
      .prepare(
        `UPDATE characters SET name = ?, image_url = ?, text_prompt = ?, reference_image_url = ?, updated_at = ?
       WHERE id = ?`,
      )
      .run(name, imageUrl, textPrompt, referenceImageUrl || null, now, req.params.id);

    if (result.changes === 0) {
      res.status(404).json({ error: "Character not found" });
      return;
    }

    const character = db.prepare("SELECT * FROM characters WHERE id = ?").get(req.params.id);
    res.json(character);
  });

  // Delete character
  router.delete("/:id", (req, res) => {
    const result = db.prepare("DELETE FROM characters WHERE id = ?").run(req.params.id);

    if (result.changes === 0) {
      res.status(404).json({ error: "Character not found" });
      return;
    }

    res.json({ deleted: true });
  });

  return router;
}
