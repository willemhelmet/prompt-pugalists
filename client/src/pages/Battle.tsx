import { useState, useEffect, type ReactNode } from "react";
import { useParams, useLocation } from "wouter";
import { ACTION_CHAR_LIMIT } from "../types";
import type {
  ActionCategory,
  ActionChoice,
  Battle as BattleType,
  BattleResolution,
} from "../types";
import { socket, connectSocket } from "../lib/socket";
import { useGameStore } from "../stores/gameStore";
import { Sword, Sparkle, Shield, Heart } from "@phosphor-icons/react";

const archetypeStyle: Record<
  ActionCategory,
  {
    icon: ReactNode;
    bg: string;
    bgActive: string;
    border: string;
    borderActive: string;
    glow: string;
  }
> = {
  attack: {
    icon: <Sword size={28} weight="duotone" />,
    bg: "bg-red-950/60",
    bgActive: "bg-red-900/80",
    border: "border-red-500/20 hover:border-red-500/50",
    borderActive: "border-red-500 ring-1 ring-red-500/30",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  },
  magic: {
    icon: <Sparkle size={28} weight="duotone" />,
    bg: "bg-blue-950/60",
    bgActive: "bg-blue-900/80",
    border: "border-blue-500/20 hover:border-blue-500/50",
    borderActive: "border-blue-500 ring-1 ring-blue-500/30",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
  },
  defend: {
    icon: <Shield size={28} weight="duotone" />,
    bg: "bg-amber-950/60",
    bgActive: "bg-amber-900/80",
    border: "border-amber-500/20 hover:border-amber-500/50",
    borderActive: "border-amber-500 ring-1 ring-amber-500/30",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  heal: {
    icon: <Heart size={28} weight="duotone" />,
    bg: "bg-emerald-950/60",
    bgActive: "bg-emerald-900/80",
    border: "border-emerald-500/20 hover:border-emerald-500/50",
    borderActive: "border-emerald-500 ring-1 ring-emerald-500/30",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
};

export function Battle() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const [action, setAction] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [lastResolution, setLastResolution] =
    useState<BattleResolution | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [generatingAction, setGeneratingAction] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [actionChoices, setActionChoices] = useState<ActionChoice[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ActionCategory | null>(null);

  const battle = useGameStore((s) => s.battle);
  const playerSlot = useGameStore((s) => s.playerSlot);
  const setBattle = useGameStore((s) => s.setBattle);

  const myPlayer = battle && playerSlot ? battle[playerSlot] : null;
  const opponentSlot = playerSlot === "player1" ? "player2" : "player1";
  const opponent = battle ? battle[opponentSlot] : null;

  useEffect(() => {
    connectSocket();

    function onBattleStart({ battle }: { battle: BattleType }) {
      setBattle(battle);
    }

    function onActionReceived({ playerId }: { playerId: string }) {
      if (myPlayer && playerId !== myPlayer.playerId) {
        setOpponentSubmitted(true);
      }
    }

    function onResolving() {
      setResolving(true);
    }

    function onRequestActions({
      actionChoices,
    }: {
      timeLimit: number;
      actionChoices: ActionChoice[];
    }) {
      setActionChoices(actionChoices);
    }

    function onRoundComplete({
      battle,
      resolution,
    }: {
      battle: BattleType;
      resolution: BattleResolution;
    }) {
      setBattle(battle);
      setLastResolution(resolution);
      setResolving(false);
      setSubmitted(false);
      setOpponentSubmitted(false);
      setAction("");
      setActionChoices([]);
      setShowCustomInput(false);
      setSelectedCategory(null);
    }

    function onBattleEnd({
      winnerId,
      battle,
      finalResolution,
    }: {
      winnerId: string;
      battle: BattleType;
      finalResolution: BattleResolution;
    }) {
      setBattle(battle);
      setLastResolution(finalResolution);
      setResolving(false);
      setWinner(winnerId);
    }

    function onActionGenerated({
      suggestedAction,
    }: {
      playerId: string;
      suggestedAction: string;
    }) {
      setAction(suggestedAction);
      setGeneratingAction(false);
    }

    socket.on("battle:start", onBattleStart);
    socket.on("battle:action_received", onActionReceived);
    socket.on("battle:resolving", onResolving);
    socket.on("battle:round_complete", onRoundComplete);
    socket.on("battle:end", onBattleEnd);
    socket.on("battle:action_generated", onActionGenerated);
    socket.on("battle:request_actions", onRequestActions);

    return () => {
      socket.off("battle:start", onBattleStart);
      socket.off("battle:action_received", onActionReceived);
      socket.off("battle:resolving", onResolving);
      socket.off("battle:round_complete", onRoundComplete);
      socket.off("battle:end", onBattleEnd);
      socket.off("battle:action_generated", onActionGenerated);
      socket.off("battle:request_actions", onRequestActions);
    };
  }, [myPlayer, setBattle]);

  function handleGenerateAction() {
    setGeneratingAction(true);
    socket.emit("battle:generate_action", { roomId: roomId! });
  }

  function handleSubmit() {
    if (!action.trim() || submitted) return;
    setSubmitted(true);
    socket.emit("battle:action", {
      roomId: roomId!,
      actionText: action.trim(),
    });
  }

  function handleButtonSubmit(choice: ActionChoice) {
    if (submitted) return;
    setAction(choice.description);
    setSubmitted(true);
    setSelectedCategory(choice.category);
    socket.emit("battle:action", {
      roomId: roomId!,
      actionText: choice.description,
    });
  }

  function handleForfeit() {
    socket.emit("battle:forfeit", { roomId: roomId! });
    setShowForfeitConfirm(false);
  }

  // Loading state
  if (!battle || !myPlayer || !opponent) {
    return (
      <div className="relative min-h-screen overflow-hidden font-body">
        <div className="fixed inset-0 bg-gray-950">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500 tracking-wide">
            Loading battle&hellip;
          </p>
        </div>
      </div>
    );
  }

  const myHpPct = (myPlayer.currentHp / myPlayer.maxHp) * 100;
  const hpColor =
    myHpPct > 50
      ? "bg-emerald-500"
      : myHpPct > 25
        ? "bg-amber-500"
        : "bg-red-500";
  const iWon = winner === myPlayer.playerId;

  return (
    <div className="relative min-h-screen overflow-hidden font-body">
      {/* ── Background atmosphere ── */}
      <div className="fixed inset-0 bg-gray-950">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 -right-32 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -left-40 w-[350px] h-[350px] bg-fuchsia-600/[0.07] rounded-full blur-[120px]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 pt-5 pb-6 gap-4 max-w-lg mx-auto">
        {/* ── Player Header ── */}
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-3.5 flex items-center gap-3 animate-fade-in">
          {myPlayer.character.imageUrl && (
            <img
              src={myPlayer.character.imageUrl}
              alt={myPlayer.character.name}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg uppercase tracking-wide font-bold truncate leading-tight">
              {myPlayer.character.name}
            </p>
            <div className="flex items-center gap-2.5 mt-1.5">
              <div className="flex-1 h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full ${hpColor} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${myHpPct}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap font-medium tabular-nums">
                {myPlayer.currentHp}/{myPlayer.maxHp}
              </span>
            </div>
          </div>
        </div>

        {/* ── Winner Overlay ── */}
        {winner ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="text-center">
              <p className="font-display text-6xl uppercase tracking-tight font-bold leading-none">
                {iWon ? "Victory" : "Defeat"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {iWon
                  ? `${opponent.character.name} has been defeated.`
                  : `${myPlayer.character.name} has fallen.`}
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="group relative overflow-hidden py-3.5 px-10 rounded-2xl font-display text-xl uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer transition-all group-hover:brightness-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer opacity-40 blur-xl" />
              <span className="relative z-10 drop-shadow-lg">
                Back to Home
              </span>
            </button>
          </div>
        ) : resolving ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-indigo-400/80 text-sm tracking-wide animate-pulse">
              Resolving round&hellip;
            </p>
          </div>
        ) : (
          <>
            {/* ── Action Choices ── */}
            {actionChoices.length > 0 ? (
              <div className="flex-1 flex flex-col gap-3 animate-slide-up">
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  <p className="text-[11px] tracking-[0.25em] uppercase text-gray-500 font-medium">
                    Choose Your Action
                  </p>
                  <span className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                </div>

                <div
                  className={`flex-1 grid grid-cols-2 grid-rows-2 gap-3 ${submitted ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {actionChoices.map((choice, i) => {
                    const normalized: ActionChoice =
                      typeof choice === "string"
                        ? {
                            label: choice as string,
                            description: choice as string,
                            category: (
                              ["attack", "magic", "defend", "heal"] as const
                            )[i % 4],
                          }
                        : choice;
                    const style =
                      archetypeStyle[normalized.category] ??
                      archetypeStyle.attack;
                    const isSelected =
                      submitted && selectedCategory === normalized.category;
                    return (
                      <button
                        key={i}
                        onClick={() => handleButtonSubmit(normalized)}
                        disabled={submitted}
                        className={`${isSelected ? `${style.bgActive} ${style.borderActive} ${style.glow}` : `${style.bg} ${style.border}`} border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all active:scale-95 cursor-pointer disabled:cursor-default`}
                      >
                        <span className="text-white/80">
                          {style.icon}
                        </span>
                        <p className="font-bold text-sm mt-2 text-white/90 leading-snug">
                          {normalized.label}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Custom action */}
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    disabled={submitted}
                    className="w-full border border-dashed border-white/[0.08] hover:border-white/[0.16] rounded-xl p-3 text-sm text-gray-500 hover:text-gray-400 transition-all disabled:pointer-events-none cursor-pointer disabled:cursor-default"
                  >
                    Write a custom action&hellip;
                  </button>
                ) : (
                  <div
                    className={`bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-3.5 ${submitted ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <textarea
                      value={action}
                      onChange={(e) =>
                        setAction(
                          e.target.value.slice(0, ACTION_CHAR_LIMIT),
                        )
                      }
                      disabled={submitted}
                      rows={2}
                      className="w-full bg-transparent text-white text-sm resize-none focus:outline-none disabled:opacity-50 placeholder:text-gray-700 leading-relaxed"
                      placeholder="Describe your custom action..."
                      autoFocus
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSubmit}
                        disabled={!action.trim() || submitted}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.04] disabled:text-gray-600 px-5 py-1.5 rounded-lg font-semibold text-sm transition-colors cursor-pointer disabled:cursor-default"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback: freeform only */
              <div className="flex-1 flex flex-col gap-3 animate-slide-up">
                <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 flex-1 flex flex-col gap-3">
                  <label className="text-[11px] tracking-[0.15em] uppercase text-gray-500 font-medium">
                    Describe Your Action
                  </label>
                  <textarea
                    value={action}
                    onChange={(e) =>
                      setAction(e.target.value.slice(0, ACTION_CHAR_LIMIT))
                    }
                    disabled={submitted}
                    className="flex-1 min-h-[100px] bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 text-white text-sm leading-relaxed resize-none focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-gray-700 disabled:opacity-50"
                    placeholder="I channel all my remaining power into a desperate final inferno..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerateAction}
                    disabled={submitted || generatingAction || !!winner}
                    className="bg-white/[0.04] hover:bg-white/[0.08] disabled:bg-white/[0.02] disabled:text-gray-700 border border-white/[0.08] hover:border-white/[0.14] py-3 px-4 rounded-xl font-semibold text-sm transition-all whitespace-nowrap cursor-pointer disabled:cursor-default"
                  >
                    {generatingAction ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                        Generating&hellip;
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2l2.09 6.26L20.18 9.27l-4.64 4.53L16.54 20 12 16.77 7.46 20l1-6.2L3.82 9.27l6.09-1.01z" />
                        </svg>
                        Generate
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!action.trim() || submitted}
                    className="group relative flex-1 overflow-hidden py-3 rounded-xl font-display text-lg uppercase tracking-wider font-bold transition-all disabled:opacity-25 disabled:cursor-default cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer transition-all group-hover:brightness-110" />
                    <span className="relative z-10 drop-shadow-lg">
                      {submitted ? "Waiting\u2026" : "Submit"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Status Indicators ── */}
            <div className="flex items-center justify-center gap-5 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${submitted ? "bg-emerald-500" : "bg-gray-600"}`}
                />
                <span
                  className={
                    submitted ? "text-emerald-400/80" : "text-gray-600"
                  }
                >
                  {submitted ? "Action sent" : "Your turn"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${opponentSubmitted ? "bg-emerald-500" : "bg-gray-600"}`}
                />
                <span
                  className={
                    opponentSubmitted
                      ? "text-emerald-400/80"
                      : "text-gray-600"
                  }
                >
                  {opponentSubmitted ? "Opponent ready" : "Opponent thinking"}
                </span>
              </span>
            </div>

            {submitted && (
              <p className="text-center text-indigo-400/60 animate-pulse text-xs tracking-wide">
                Waiting for opponent&hellip;
              </p>
            )}

            {/* ── Forfeit ── */}
            {!showForfeitConfirm ? (
              <button
                onClick={() => setShowForfeitConfirm(true)}
                className="text-gray-700 hover:text-red-400/70 text-[11px] transition-colors self-center cursor-pointer"
              >
                Forfeit Match
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3 bg-red-950/40 border border-red-500/20 rounded-xl p-3 animate-fade-in">
                <span className="text-red-300/80 text-xs">Are you sure?</span>
                <button
                  onClick={handleForfeit}
                  className="bg-red-600/80 hover:bg-red-500 text-white text-xs py-1.5 px-4 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Yes, Forfeit
                </button>
                <button
                  onClick={() => setShowForfeitConfirm(false)}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs py-1.5 px-4 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
