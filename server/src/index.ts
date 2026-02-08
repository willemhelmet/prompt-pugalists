import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import type { ClientEvents, ServerEvents } from "./types.js";
import { initDb } from "./db/index.js";
import { characterRoutes } from "./routes/characters.js";
import { roomRoutes } from "./routes/rooms.js";
import { authRoutes } from "./routes/auth.js";
import { uploadRoutes } from "./routes/upload.js";
import { suggestRoutes } from "./routes/suggest.js";
import { registerSocketHandlers } from "./socket/handlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

// Initialize database
const db = initDb();

// Express
const app = express();
app.use(cors({ origin: isProduction ? true : CLIENT_URL }));
app.use(express.json());

// REST routes
app.use("/api/auth", authRoutes(db));
app.use("/api/characters", characterRoutes(db));
app.use("/api/rooms", roomRoutes(db));
app.use("/api/upload", uploadRoutes());
app.use("/api/suggest", suggestRoutes());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// In production, serve the built client
if (isProduction) {
  const clientDir = path.join(__dirname, "..", "public");
  app.use(express.static(clientDir));
  // SPA fallback — serve index.html for any non-API, non-socket route
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

// HTTP + WebSocket server
const httpServer = createServer(app);

const io = new Server<ClientEvents, ServerEvents>(httpServer, {
  cors: {
    origin: isProduction ? true : CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Socket.io handlers
registerSocketHandlers(io, db);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
