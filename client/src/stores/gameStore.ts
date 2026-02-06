import { create } from "zustand";
import type { Room, Battle, Character, BattleResolution } from "../types";

interface GameState {
  // Session
  sessionId: string | null;
  username: string | null;

  // Room
  room: Room | null;
  playerSlot: "player1" | "player2" | null;

  // Battle
  battle: Battle | null;
  lastResolution: BattleResolution | null;
  isResolving: boolean;
  actionSubmitted: boolean;
  opponentReady: boolean;

  // Characters
  characters: Character[];
  selectedCharacterId: string | null;

  // Actions
  setSession: (sessionId: string, username: string) => void;
  setRoom: (room: Room) => void;
  setPlayerSlot: (slot: "player1" | "player2") => void;
  setBattle: (battle: Battle) => void;
  setLastResolution: (resolution: BattleResolution) => void;
  setIsResolving: (resolving: boolean) => void;
  setActionSubmitted: (submitted: boolean) => void;
  setOpponentReady: (ready: boolean) => void;
  setCharacters: (characters: Character[]) => void;
  setSelectedCharacterId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  username: null,
  room: null,
  playerSlot: null,
  battle: null,
  lastResolution: null,
  isResolving: false,
  actionSubmitted: false,
  opponentReady: false,
  characters: [],
  selectedCharacterId: null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setSession: (sessionId, username) => set({ sessionId, username }),
  setRoom: (room) => set({ room }),
  setPlayerSlot: (playerSlot) => set({ playerSlot }),
  setBattle: (battle) => set({ battle }),
  setLastResolution: (lastResolution) => set({ lastResolution }),
  setIsResolving: (isResolving) => set({ isResolving }),
  setActionSubmitted: (actionSubmitted) => set({ actionSubmitted }),
  setOpponentReady: (opponentReady) => set({ opponentReady }),
  setCharacters: (characters) => set({ characters }),
  setSelectedCharacterId: (selectedCharacterId) => set({ selectedCharacterId }),
  reset: () => set(initialState),
}));
