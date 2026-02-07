import type { Server, Socket } from "socket.io";
import type Database from "better-sqlite3";
import type { ClientEvents, ServerEvents, Character, ActionChoice } from "../types.js";
import { roomManager } from "../managers/RoomManager.js";
import { createBattle, applyResolution, checkVictory } from "../managers/BattleManager.js";
import { runEngine, generateActionSuggestion, generateInitialActionChoices } from "../ai/mistral.js";

type IO = Server<ClientEvents, ServerEvents>;
type ClientSocket = Socket<ClientEvents, ServerEvents>;

function toChar(row: any): Character {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    imageUrl: row.image_url,
    textPrompt: row.text_prompt,
    referenceImageUrl: row.reference_image_url,
    visualFingerprint: row.visual_fingerprint || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function registerSocketHandlers(io: IO, db: Database.Database): void {
  io.on("connection", (socket: ClientSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // ── Room events ──────────────────────────────────────────

    socket.on("room:create", ({ username, environment, environmentImageUrl }) => {
      const room = roomManager.createRoom(socket.id, environment, environmentImageUrl);
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

      // Fetch character from DB
      const row = db
        .prepare("SELECT * FROM characters WHERE id = ?")
        .get(characterId) as any;

      if (!row) {
        socket.emit("room:error", { message: "Character not found" });
        return;
      }

      const character = toChar(row);

      io.to(roomId).emit("character:selected", {
        playerId: player.playerId,
        character,
      });
    });

    socket.on("player:ready", async ({ roomId }) => {
      const player = roomManager.getPlayerByConnectionId(roomId, socket.id);
      if (!player) return;

      player.ready = true;

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      // Check if both players are ready with characters selected
      const p1 = room.players.player1;
      const p2 = room.players.player2;
      if (!p1?.ready || !p2?.ready || !p1.characterId || !p2.characterId) return;

      // Fetch both characters
      const c1 = db.prepare("SELECT * FROM characters WHERE id = ?").get(p1.characterId) as any;
      const c2 = db.prepare("SELECT * FROM characters WHERE id = ?").get(p2.characterId) as any;
      if (!c1 || !c2) return;

      const char1 = toChar(c1);
      const char2 = toChar(c2);
      const environment = room.environment || "A mystical arena crackling with arcane energy";

      // Create battle
      const battle = createBattle(
        roomId,
        char1,
        char2,
        p1.playerId,
        p2.playerId,
        environment,
      );

      room.battle = battle;
      roomManager.setRoomState(roomId, "battle");

      // Generate initial action choices for Round 1
      const [p1Choices, p2Choices] = await Promise.all([
        generateInitialActionChoices(char1, char2, environment),
        generateInitialActionChoices(char2, char1, environment),
      ]);

      battle.currentActionChoices = { player1: p1Choices, player2: p2Choices };

      io.to(roomId).emit("battle:start", { battle });

      // Send action choices per-player (each player only sees their own)
      io.to(p1.connectionId).emit("battle:request_actions", {
        timeLimit: 30,
        actionChoices: p1Choices,
      });
      io.to(p2.connectionId).emit("battle:request_actions", {
        timeLimit: 30,
        actionChoices: p2Choices,
      });

      console.log(`Battle started in room ${roomId}: ${c1.name} vs ${c2.name}`);
    });

    // ── Battle events ────────────────────────────────────────

    socket.on("battle:action", async ({ roomId, actionText }) => {
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
        io.to(roomId).emit("battle:resolving");

        const action1 = room.battle.pendingActions.player1.actionText;
        const action2 = room.battle.pendingActions.player2.actionText;

        const resolution = await runEngine(room.battle, action1, action2);

        applyResolution(room.battle, resolution);

        // Check victory (server HP check OR engine detection)
        const winnerId = checkVictory(room.battle);
        const engineVictory = resolution.isVictory;

        if (winnerId || engineVictory) {
          const actualWinner = winnerId || resolution.winnerId || room.battle.player1.playerId;

          room.battle.winnerId = actualWinner;
          room.battle.winCondition = "hp_depleted";
          room.battle.completedAt = new Date().toISOString();

          // Send victory narration to host
          io.to(room.hostConnectionId).emit("battle:narrator_audio", {
            narratorScript: resolution.victoryNarration || resolution.narratorScript,
          });

          io.to(roomId).emit("battle:end", {
            winnerId: actualWinner,
            battle: room.battle,
            finalResolution: resolution,
          });
          console.log(`Battle ended in room ${roomId}, winner: ${actualWinner}`);
        } else {
          // Send narrator script to host for TTS
          io.to(room.hostConnectionId).emit("battle:narrator_audio", {
            narratorScript: resolution.narratorScript,
          });

          io.to(roomId).emit("battle:round_complete", {
            battle: room.battle,
            resolution,
          });

          // Clear pending actions for next round
          room.battle.pendingActions = { player1: null, player2: null };

          // Send action choices per-player
          const p1Conn = room.players.player1?.connectionId;
          const p2Conn = room.players.player2?.connectionId;

          if (p1Conn) {
            io.to(p1Conn).emit("battle:request_actions", {
              timeLimit: 30,
              actionChoices: resolution.player1ActionChoices,
            });
          }
          if (p2Conn) {
            io.to(p2Conn).emit("battle:request_actions", {
              timeLimit: 30,
              actionChoices: resolution.player2ActionChoices,
            });
          }
        }
      }
    });

    socket.on("battle:generate_action", async ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      const player = roomManager.getPlayerByConnectionId(roomId, socket.id);
      if (!player || !room?.battle) return;

      const suggestedAction = await generateActionSuggestion(
        room.battle,
        player.playerId,
      );

      socket.emit("battle:action_generated", {
        playerId: player.playerId,
        suggestedAction,
      });
    });

    socket.on("battle:forfeit", ({ roomId }) => {
      const room = roomManager.getRoom(roomId);
      if (!room?.battle || room.battle.winnerId) return;

      const slot = roomManager.getPlayerSlot(roomId, socket.id);
      if (!slot) return;

      const forfeiter = room.battle[slot];
      const winnerSlot = slot === "player1" ? "player2" : "player1";
      const winner = room.battle[winnerSlot];

      room.battle.winnerId = winner.playerId;
      room.battle.winCondition = "forfeit";
      room.battle.completedAt = new Date().toISOString();

      // Set forfeiter HP to 0 for visual clarity
      forfeiter.currentHp = 0;

      roomManager.setRoomState(roomId, "completed");

      const forfeitNarration = `And it's all over! ${forfeiter.character.name} has thrown in the towel — ${winner.character.name} takes it without needing another blow. What a way to end it!`;

      // Send narrator script for forfeit
      io.to(room.hostConnectionId).emit("battle:narrator_audio", {
        narratorScript: forfeitNarration,
      });

      io.to(roomId).emit("battle:end", {
        winnerId: winner.playerId,
        battle: room.battle,
        finalResolution: room.battle.resolutionHistory.at(-1) ?? {
          player1Action: "",
          player2Action: "",
          interpretation: `${forfeiter.character.name} has forfeited the battle. ${winner.character.name} wins!`,
          player1HpChange: 0,
          player2HpChange: 0,
          newBattleState: room.battle.currentState,
          videoPrompt: `${winner.character.name} stands victorious as ${forfeiter.character.name} concedes defeat.`,
          narratorScript: forfeitNarration,
          battleSummaryUpdate: `${forfeiter.character.name} forfeited. ${winner.character.name} wins.`,
          player1ActionChoices: [] as ActionChoice[],
          player2ActionChoices: [] as ActionChoice[],
          isVictory: true,
          winnerId: winner.playerId,
          victoryNarration: forfeitNarration,
          diceRolls: [],
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`Player ${socket.id} (${forfeiter.character.name}) forfeited in room ${roomId}`);
    });

    // ── Disconnect ───────────────────────────────────────────

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      // TODO: handle disconnect grace period
    });
  });
}
