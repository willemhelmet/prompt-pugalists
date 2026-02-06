import { nanoid } from "nanoid";
import type {
  Battle,
  BattleResolution,
  BattleState,
  Character,
} from "../types.js";
import { MAX_HP } from "../types.js";

export function createBattle(
  roomId: string,
  player1Character: Character,
  player2Character: Character,
  player1Id: string,
  player2Id: string,
  environment: string,
): Battle {
  const initialState: BattleState = {
    environmentDescription: environment,
    player1Condition: `${player1Character.name} stands ready for battle`,
    player2Condition: `${player2Character.name} stands ready for battle`,
    previousEvents: [],
  };

  return {
    id: nanoid(),
    roomId,
    player1: {
      playerId: player1Id,
      character: player1Character,
      currentHp: MAX_HP,
      maxHp: MAX_HP,
    },
    player2: {
      playerId: player2Id,
      character: player2Character,
      currentHp: MAX_HP,
      maxHp: MAX_HP,
    },
    currentState: initialState,
    pendingActions: { player1: null, player2: null },
    resolutionHistory: [],
    winnerId: null,
    winCondition: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

export function applyResolution(battle: Battle, resolution: BattleResolution): void {
  battle.player1.currentHp = Math.max(
    0,
    Math.min(battle.player1.currentHp + resolution.player1HpChange, battle.player1.maxHp),
  );
  battle.player2.currentHp = Math.max(
    0,
    Math.min(battle.player2.currentHp + resolution.player2HpChange, battle.player2.maxHp),
  );

  battle.currentState = resolution.newBattleState;
  battle.resolutionHistory.push(resolution);
}

export function checkVictory(battle: Battle): string | null {
  if (battle.player1.currentHp <= 0) return battle.player2.playerId;
  if (battle.player2.currentHp <= 0) return battle.player1.playerId;
  return null;
}
