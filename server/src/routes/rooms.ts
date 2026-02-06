import { Router } from "express";
import type Database from "better-sqlite3";
import { roomManager } from "../managers/RoomManager.js";

export function roomRoutes(db: Database.Database): Router {
  const router = Router();

  // Get room info
  router.get("/:id", (req, res) => {
    const room = roomManager.getRoom(req.params.id);

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json(room);
  });

  return router;
}
