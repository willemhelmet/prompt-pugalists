import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { socket, connectSocket } from "../lib/socket";
import { useGameStore } from "../stores/gameStore";
import { ReactorVideoSection } from "../components/ReactorVideoSection";
import { useAnnouncer } from "../hooks/useAnnouncer";
import type {
  PlayerConnection,
  Battle,
  BattleResolution,
  Character,
  SelectedCharacter,
} from "../types";

export function HostDisplay() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const { room, player1, player2, setPlayer } = useGameStore();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [lastResolution, setLastResolution] =
    useState<BattleResolution | null>(null);
  const [resolving, setResolving] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<
    SelectedCharacter[]
  >([]);
  const arenaAnnouncedRef = useRef(false);
  const { announce, muted, toggleMute, isSpeaking, available } =
    useAnnouncer();
  const announceRef = useRef(announce);
  announceRef.current = announce;

  useEffect(() => {
    connectSocket();

    function onPlayerJoined({
      player,
      playerSlot,
    }: {
      player: PlayerConnection;
      playerSlot: "player1" | "player2";
    }) {
      setPlayer(playerSlot, player);
    }

    function onCharacterSelected({
      playerId,
      character,
    }: {
      playerId: string;
      character: Character;
    }) {
      const { player1: p1, player2: p2 } = useGameStore.getState();
      const slot =
        p1?.playerId === playerId
          ? "player1"
          : p2?.playerId === playerId
            ? "player2"
            : null;
      if (!slot) return;

      setSelectedCharacters((prev) => {
        const filtered = prev.filter((sc) => sc.playerId !== playerId);
        return [...filtered, { playerId, character, playerSlot: slot }];
      });
      announceRef.current(
        `And stepping into the arena... it's ${character.name}!`,
      );
    }

    function onBattleStart({ battle }: { battle: Battle }) {
      setBattle(battle);
      announceRef.current(
        `Ladies and gentlemen! ${battle.player1.character.name} versus ${battle.player2.character.name}! Let the battle BEGIN!`,
      );
    }

    function onResolving() {
      setResolving(true);
    }

    function onRoundComplete({
      battle,
      resolution,
    }: {
      battle: Battle;
      resolution: BattleResolution;
    }) {
      setBattle(battle);
      setLastResolution(resolution);
      setResolving(false);
    }

    function onBattleEnd({
      winnerId,
      battle,
      finalResolution,
    }: {
      winnerId: string;
      battle: Battle;
      finalResolution: BattleResolution;
    }) {
      setBattle(battle);
      setLastResolution(finalResolution);
      setResolving(false);
      setWinner(winnerId);
    }

    function onNarratorAudio({
      narratorScript,
    }: {
      narratorScript: string;
    }) {
      announceRef.current(narratorScript);
    }

    socket.on("room:player_joined", onPlayerJoined);
    socket.on("character:selected", onCharacterSelected);
    socket.on("room:full", () => {});
    socket.on("battle:start", onBattleStart);
    socket.on("battle:action_received", () => {});
    socket.on("battle:resolving", onResolving);
    socket.on("battle:round_complete", onRoundComplete);
    socket.on("battle:end", onBattleEnd);
    socket.on("battle:narrator_audio", onNarratorAudio);

    return () => {
      socket.off("room:player_joined", onPlayerJoined);
      socket.off("character:selected", onCharacterSelected);
      socket.off("room:full");
      socket.off("battle:start", onBattleStart);
      socket.off("battle:action_received");
      socket.off("battle:resolving", onResolving);
      socket.off("battle:round_complete", onRoundComplete);
      socket.off("battle:end", onBattleEnd);
      socket.off("battle:narrator_audio", onNarratorAudio);
    };
  }, [setPlayer]);

  // Announce the arena environment when it becomes available
  useEffect(() => {
    if (!room?.environment || arenaAnnouncedRef.current) return;
    arenaAnnouncedRef.current = true;
    announceRef.current(
      `Welcome, fight fans, to tonight's arena! ${room.environment}. Who will dare to step into this battlefield?`,
    );
  }, [room?.environment]);

  const p1 = battle?.player1;
  const p2 = battle?.player2;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-body">
      {/* Video base layer — fills entire viewport */}
      <ReactorVideoSection
        battle={battle}
        environment={room?.environment ?? null}
        selectedCharacters={selectedCharacters}
        lastResolution={lastResolution}
        resolving={resolving}
        winner={winner}
        roomId={roomId!}
        onBackToMenu={() => navigate("/")}
      />

      {/* ── Top bar overlay ── */}
      <div className="absolute top-4 left-5 right-5 flex justify-between items-center z-20 pointer-events-none">
        {/* Room code */}
        <div className="bg-black/50 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-2 pointer-events-auto">
          <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500 block leading-none">
            Room
          </span>
          <span className="font-display text-xl font-bold tracking-[0.15em] text-white leading-tight">
            {roomId}
          </span>
        </div>

        {/* Announcer + round */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {available && (
            <button
              onClick={toggleMute}
              className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                muted
                  ? "bg-black/50 border-white/[0.08] text-gray-500 hover:text-gray-300"
                  : isSpeaking
                    ? "bg-amber-900/40 border-amber-500/20 text-amber-400 animate-pulse"
                    : "bg-black/50 border-emerald-500/20 text-emerald-400 hover:text-emerald-300"
              }`}
            >
              {muted ? (
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                </svg>
              )}
              {muted
                ? "OFF"
                : isSpeaking
                  ? "Live"
                  : "ON"}
            </button>
          )}
          {battle && (
            <div className="bg-black/50 backdrop-blur-md border border-white/[0.08] rounded-xl px-3.5 py-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500 block leading-none">
                Round
              </span>
              <span className="font-display text-xl font-bold text-white leading-tight">
                {battle.resolutionHistory.length + 1}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── HP bars overlay (during battle) ── */}
      {battle && (
        <div className="absolute top-20 left-5 right-5 z-20 pointer-events-none">
          <div className="flex items-center gap-3">
            <HpBar
              name={p1!.character.name}
              hp={p1!.currentHp}
              maxHp={p1!.maxHp}
              side="left"
              imageUrl={p1!.character.imageUrl}
            />
            <div className="font-display text-2xl font-bold text-white/40 shrink-0 drop-shadow-lg">
              VS
            </div>
            <HpBar
              name={p2!.character.name}
              hp={p2!.currentHp}
              maxHp={p2!.maxHp}
              side="right"
              imageUrl={p2!.character.imageUrl}
            />
          </div>
        </div>
      )}

      {/* ── Pre-battle: player slot cards ── */}
      {!battle && (
        <div className="absolute bottom-8 left-5 right-5 z-20 pointer-events-none">
          <div className="flex gap-4 justify-center items-end">
            <PlayerSlot
              label="Player 1"
              player={player1}
              selectedChar={selectedCharacters.find(
                (sc) => sc.playerSlot === "player1",
              )}
            />
            <div className="font-display text-3xl font-bold text-white/30 shrink-0 pb-6 drop-shadow-lg">
              VS
            </div>
            <PlayerSlot
              label="Player 2"
              player={player2}
              selectedChar={selectedCharacters.find(
                (sc) => sc.playerSlot === "player2",
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function HpBar({
  name,
  hp,
  maxHp,
  side,
  imageUrl,
}: {
  name: string;
  hp: number;
  maxHp: number;
  side: "left" | "right";
  imageUrl: string;
}) {
  const pct = (hp / maxHp) * 100;
  const isRight = side === "right";
  const hpColor =
    pct > 50
      ? "bg-emerald-500 shadow-emerald-500/40"
      : pct > 25
        ? "bg-amber-500 shadow-amber-500/40"
        : "bg-red-500 shadow-red-500/40";

  return (
    <div
      className={`flex-1 flex items-center gap-3 ${isRight ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="relative shrink-0">
        <img
          src={imageUrl}
          alt={name}
          className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/20 shadow-lg"
        />
        {/* HP number badge */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-md px-1.5 py-0.5">
          <span className="text-[10px] font-bold text-white tabular-nums leading-none">
            {hp}
          </span>
        </div>
      </div>
      <div className={`flex-1 ${isRight ? "text-right" : ""}`}>
        <p className="font-display text-lg uppercase tracking-wide font-bold text-white drop-shadow-lg leading-tight">
          {name}
        </p>
        <div className="w-full h-3 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden mt-1.5 border border-white/[0.08]">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out shadow-md ${hpColor} ${isRight ? "ml-auto" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function PlayerSlot({
  label,
  player,
  selectedChar,
}: {
  label: string;
  player: PlayerConnection | null;
  selectedChar?: SelectedCharacter;
}) {
  return (
    <div
      className={`w-60 rounded-2xl p-4 backdrop-blur-md transition-all duration-500 ${
        player
          ? "bg-black/50 border border-white/[0.1]"
          : "bg-black/30 border border-dashed border-white/[0.08]"
      }`}
    >
      <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500 font-medium">
        {label}
      </span>
      {player ? (
        <div className="mt-1.5">
          <p className="font-display text-xl uppercase tracking-wide font-bold text-white leading-tight">
            {player.username}
          </p>
          {selectedChar && (
            <div className="flex items-center gap-2.5 mt-2.5">
              <img
                src={selectedChar.character.imageUrl}
                alt={selectedChar.character.name}
                className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/15"
              />
              <p className="text-sm text-indigo-300/80 font-medium">
                {selectedChar.character.name}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
          <p className="text-gray-600 text-sm">Waiting&hellip;</p>
        </div>
      )}
    </div>
  );
}
