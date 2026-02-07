import "dotenv/config";
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

const PORT = parseInt(process.env.PORT || "3000", 10);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Initialize database
const db = initDb();

// Express
const app = express();
app.use(cors({ origin: CLIENT_URL }));
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

// HTTP + WebSocket server
const httpServer = createServer(app);

const io = new Server<ClientEvents, ServerEvents>(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Socket.io handlers
registerSocketHandlers(io, db);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
