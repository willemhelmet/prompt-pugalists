import type { Server, Socket } from "socket.io";
import type Database from "better-sqlite3";
import type { ClientEvents, ServerEvents } from "../types.js";
import { roomManager } from "../managers/RoomManager.js";

type IO = Server<ClientEvents, ServerEvents>;
type ClientSocket = Socket<ClientEvents, ServerEvents>;

export function registerSocketHandlers(io: IO, db: Database.Database): void {
  io.on("connection", (socket: ClientSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // ── Room events ──────────────────────────────────────────

    socket.on("room:create", ({ username, environment }) => {
      const room = roomManager.createRoom(socket.id, environment);
      socket.join(room.id);
      socket.emit("room:created", { roomId: room.id, room });
      console.log(`Room ${room.id} created by ${username}`);
    });

    socket.on("room:join", ({ roomId, username }) => {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit("room:error", { message: "Room not found" });
        return;
      }

      const player = roomManager.joinRoom(roomId, socket.id, username);
      if (!player) {
        socket.emit("room:error", { message: "Room is full" });
        return;
      }

      socket.join(roomId);
      const slot = roomManager.getPlayerSlot(roomId, socket.id)!;
      io.to(roomId).emit("room:player_joined", { player, playerSlot: slot });

      if (roomManager.isRoomFull(roomId)) {
        roomManager.setRoomState(roomId, "character_select");
        io.to(roomId).emit("room:full");
      }
    });

    // ── Character selection ──────────────────────────────────

    socket.on("character:select", ({ roomId, characterId }) => {
      const player = roomManager.getPlayerByConnectionId(roomId, socket.id);
      if (!player) return;

      player.characterId = characterId;

      // TODO: fetch full character from DB and broadcast
      io.to(roomId).emit("character:selected", {
        playerId: player.playerId,
        character: null as any, // placeholder — will fetch from DB
      });
    });

    socket.on("player:ready", ({ roomId }) => {
      const player = roomManager.getPlayerByConnectionId(roomId, socket.id);
      if (!player) return;

      player.ready = true;

      // Check if both players are ready
      const room = roomManager.getRoom(roomId);
      if (room?.players.player1?.ready && room?.players.player2?.ready) {
        // TODO: create battle and start
        roomManager.setRoomState(roomId, "battle");
      }
    });

    // ── Battle events ────────────────────────────────────────

    socket.on("battle:action", ({ roomId, actionText }) => {
      const room = roomManager.getRoom(roomId);
      if (!room?.battle) return;

      const slot = roomManager.getPlayerSlot(roomId, socket.id);
      if (!slot) return;

      room.battle.pendingActions[slot] = {
        actionText,
        submittedAt: new Date().toISOString(),
      };

      io.to(roomId).emit("battle:action_received", {
        playerId: roomManager.getPlayerByConnectionId(roomId, socket.id)!.playerId,
      });

      // If both actions are in, resolve the round
      if (room.battle.pendingActions.player1 && room.battle.pendingActions.player2) {
        // TODO: resolve combat via ChatGPT
        console.log("Both actions received — resolving round...");
      }
    });

    socket.on("battle:generate_action", ({ roomId }) => {
      // TODO: generate action suggestion via ChatGPT
      const player = roomManager.getPlayerByConnectionId(roomId, socket.id);
      if (!player) return;

      socket.emit("battle:action_generated", {
        playerId: player.playerId,
        suggestedAction: "TODO: AI-generated action",
      });
    });

    socket.on("battle:forfeit", ({ roomId }) => {
      // TODO: handle forfeit
      console.log(`Player ${socket.id} forfeited in room ${roomId}`);
    });

    // ── Disconnect ───────────────────────────────────────────

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      // TODO: handle disconnect grace period
    });
  });
}
