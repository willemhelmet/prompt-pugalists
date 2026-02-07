import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ACTION_CHAR_LIMIT } from "../types";
import type { ActionCategory, ActionChoice, Battle as BattleType, BattleResolution } from "../types";
import { socket, connectSocket } from "../lib/socket";
import { useGameStore } from "../stores/gameStore";

export function Battle() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, navigate] = useLocation();
  const [action, setAction] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [lastResolution, setLastResolution] = useState<BattleResolution | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [generatingAction, setGeneratingAction] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [actionChoices, setActionChoices] = useState<ActionChoice[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | null>(null);

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
      // If it's not us, opponent submitted
      if (myPlayer && playerId !== myPlayer.playerId) {
        setOpponentSubmitted(true);
      }
    }

    function onResolving() {
      setResolving(true);
    }

    function onRequestActions({ actionChoices }: { timeLimit: number; actionChoices: ActionChoice[] }) {
      setActionChoices(actionChoices);
    }

    function onRoundComplete({ battle, resolution }: { battle: BattleType; resolution: BattleResolution }) {
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

    function onBattleEnd({ winnerId, battle, finalResolution }: { winnerId: string; battle: BattleType; finalResolution: BattleResolution }) {
      setBattle(battle);
      setLastResolution(finalResolution);
      setResolving(false);
      setWinner(winnerId);
    }

    function onActionGenerated({ suggestedAction }: { playerId: string; suggestedAction: string }) {
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
    socket.emit("battle:action", { roomId: roomId!, actionText: action.trim() });
  }

  function handleButtonSubmit(choice: ActionChoice) {
    if (submitted) return;
    setAction(choice.description);
    setSubmitted(true);
    setSelectedCategory(choice.category);
    socket.emit("battle:action", { roomId: roomId!, actionText: choice.description });
  }

  function handleForfeit() {
    socket.emit("battle:forfeit", { roomId: roomId! });
    setShowForfeitConfirm(false);
  }

  if (!battle || !myPlayer || !opponent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading battle...</p>
      </div>
    );
  }

  const myHpPct = (myPlayer.currentHp / myPlayer.maxHp) * 100;
  const iWon = winner === myPlayer.playerId;

  const archetypeStyle: Record<ActionCategory, { emoji: string; bg: string; border: string; selectedBorder: string }> = {
    attack: { emoji: "⚔️", bg: "bg-red-950", border: "border-red-700 hover:border-red-500", selectedBorder: "border-red-500 bg-red-950" },
    magic:  { emoji: "✨", bg: "bg-blue-950", border: "border-blue-700 hover:border-blue-500", selectedBorder: "border-blue-500 bg-blue-950" },
    defend: { emoji: "🛡️", bg: "bg-yellow-950", border: "border-yellow-700 hover:border-yellow-500", selectedBorder: "border-yellow-500 bg-yellow-950" },
    heal:   { emoji: "💚", bg: "bg-green-950", border: "border-green-700 hover:border-green-500", selectedBorder: "border-green-500 bg-green-950" },
  };

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4 max-w-lg mx-auto">
      {/* Player header: profile image + name + HP */}
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
        {myPlayer.character.imageUrl && (
          <img
            src={myPlayer.character.imageUrl}
            alt={myPlayer.character.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{myPlayer.character.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${myHpPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap font-medium">
              {myPlayer.currentHp}/{myPlayer.maxHp} HP
            </span>
          </div>
        </div>
      </div>

      {/* Winner overlay */}
      {winner ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-3xl font-bold">
            {iWon ? "You Win!" : "You Lose!"}
          </p>
          <p className="text-gray-400">
            {iWon ? opponent.character.name : myPlayer.character.name} has been defeated.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 hover:bg-indigo-500 py-3 px-8 rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </button>
        </div>
      ) : resolving ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-indigo-400 text-lg animate-pulse">Resolving round...</p>
        </div>
      ) : (
        <>
          {/* Action choices grid or freeform fallback */}
          {actionChoices.length > 0 ? (
            <div className="flex-1 flex flex-col gap-3">
              <p className="text-sm text-gray-400">Choose your action:</p>
              <div className={`grid grid-cols-2 gap-3 ${submitted ? "opacity-50 pointer-events-none" : ""}`}>
                {actionChoices.map((choice, i) => {
                  // Handle legacy plain-string choices from old server data
                  const normalized: ActionChoice = typeof choice === "string"
                    ? { label: choice as string, description: choice as string, category: (["attack", "magic", "defend", "heal"] as const)[i % 4] }
                    : choice;
                  const style = archetypeStyle[normalized.category] ?? archetypeStyle.attack;
                  const isSelected = submitted && selectedCategory === normalized.category;
                  return (
                    <button
                      key={i}
                      onClick={() => handleButtonSubmit(normalized)}
                      disabled={submitted}
                      className={`${style.bg} border-2 rounded-lg p-3 text-left transition-all active:scale-95 ${
                        isSelected ? style.selectedBorder : style.border
                      }`}
                    >
                      <span className="text-xl leading-none">{style.emoji}</span>
                      <p className="font-bold text-sm mt-1 text-white">{normalized.label}</p>
                    </button>
                  );
                })}
              </div>

              {/* Custom action card */}
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  disabled={submitted}
                  className="w-full bg-gray-900 border-2 border-gray-700 border-dashed rounded-lg p-3 text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all disabled:pointer-events-none"
                >
                  ✏️ Write a custom action...
                </button>
              ) : (
                <div className={`bg-gray-900 border-2 border-gray-700 rounded-lg p-3 ${submitted ? "opacity-50 pointer-events-none" : ""}`}>
                  <textarea
                    value={action}
                    onChange={(e) => setAction(e.target.value.slice(0, ACTION_CHAR_LIMIT))}
                    disabled={submitted}
                    rows={2}
                    className="w-full bg-transparent text-white text-sm resize-none focus:outline-none disabled:opacity-50 placeholder-gray-600"
                    placeholder="Describe your custom action..."
                    autoFocus
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={!action.trim() || submitted}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 px-5 py-1.5 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback: freeform only (no choices received yet) */
            <div className="flex-1 flex flex-col gap-3">
              <label className="text-sm text-gray-400">Describe your action:</label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value.slice(0, ACTION_CHAR_LIMIT))}
                disabled={submitted}
                className="flex-1 min-h-[120px] bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                placeholder="I channel all my remaining power into a desperate final inferno..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateAction}
                  disabled={submitted || generatingAction || !!winner}
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 py-3 px-4 rounded-lg font-semibold transition-colors whitespace-nowrap"
                >
                  {generatingAction ? "Generating..." : "✦ Generate Action"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!action.trim() || submitted}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold text-lg transition-colors"
                >
                  {submitted ? "Waiting for opponent..." : "Submit Action"}
                </button>
              </div>
            </div>
          )}

          {/* Status indicators */}
          <div className="flex gap-4 text-xs">
            <span className={submitted ? "text-green-400" : "text-gray-500"}>
              {submitted ? "Action submitted" : "Waiting for your action"}
            </span>
            <span className={opponentSubmitted ? "text-green-400" : "text-gray-500"}>
              {opponentSubmitted ? "Opponent ready" : "Opponent thinking..."}
            </span>
          </div>

          {submitted && (
            <p className="text-center text-indigo-400 animate-pulse text-sm">
              Waiting for opponent...
            </p>
          )}

          {/* Forfeit */}
          {!showForfeitConfirm ? (
            <button
              onClick={() => setShowForfeitConfirm(true)}
              className="text-gray-600 hover:text-red-400 text-xs transition-colors self-center"
            >
              Forfeit Match
            </button>
          ) : (
            <div className="flex items-center justify-center gap-3 bg-red-950/50 border border-red-800 rounded-lg p-3">
              <span className="text-red-300 text-sm">Are you sure?</span>
              <button
                onClick={handleForfeit}
                className="bg-red-600 hover:bg-red-500 text-white text-sm py-1 px-4 rounded font-semibold transition-colors"
              >
                Yes, Forfeit
              </button>
              <button
                onClick={() => setShowForfeitConfirm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-1 px-4 rounded font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
