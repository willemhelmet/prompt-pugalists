import { nanoid, customAlphabet } from "nanoid";
import type { Room, PlayerConnection, RoomState } from "../types.js";
import { ROOM_CODE_LENGTH } from "../types.js";

const generateRoomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", ROOM_CODE_LENGTH);

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(hostConnectionId: string, environment: string, environmentImageUrl?: string): Room {
    const roomId = generateRoomCode();
    const now = new Date().toISOString();

    const room: Room = {
      id: roomId,
      hostConnectionId,
      players: { player1: null, player2: null },
      state: "waiting",
      environment,
      environmentImageUrl: environmentImageUrl || null,
      battle: null,
      createdAt: now,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, connectionId: string, username: string): PlayerConnection | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player: PlayerConnection = {
      connectionId,
      playerId: nanoid(),
      username,
      characterId: null,
      ready: false,
    };

    if (!room.players.player1) {
      room.players.player1 = player;
      return player;
    } else if (!room.players.player2) {
      room.players.player2 = player;
      return player;
    }

    return null; // Room full
  }

  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!(room?.players.player1 && room?.players.player2);
  }

  setRoomState(roomId: string, state: RoomState): void {
    const room = this.rooms.get(roomId);
    if (room) room.state = state;
  }

  getPlayerByConnectionId(roomId: string, connectionId: string): PlayerConnection | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.players.player1?.connectionId === connectionId) return room.players.player1;
    if (room.players.player2?.connectionId === connectionId) return room.players.player2;
    return null;
  }

  getPlayerSlot(roomId: string, connectionId: string): "player1" | "player2" | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.players.player1?.connectionId === connectionId) return "player1";
    if (room.players.player2?.connectionId === connectionId) return "player2";
    return null;
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  cleanupExpiredRooms(): void {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      if (new Date(room.expiresAt).getTime() < now) {
        this.rooms.delete(id);
      }
    }
  }
}

export const roomManager = new RoomManager();
