import { useState } from "react";
import { useParams } from "wouter";
import { ACTION_CHAR_LIMIT } from "../types";

export function Battle() {
  const { roomId } = useParams<{ roomId: string }>();
  const [action, setAction] = useState("");

  function handleSubmit() {
    if (!action.trim()) return;
    // TODO: submit action via socket
    console.log("Submitting action:", action);
  }

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4 max-w-lg mx-auto">
      {/* Status */}
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">You</p>
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
          </div>
          <p className="text-xs text-gray-400">50/50 HP</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Opponent</p>
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: "100%" }} />
          </div>
          <p className="text-xs text-gray-400">50/50 HP</p>
        </div>
      </div>

      {/* Action input */}
      <div className="flex-1 flex flex-col gap-3">
        <label className="text-sm text-gray-400">Describe your action:</label>
        <textarea
          value={action}
          onChange={(e) => setAction(e.target.value.slice(0, ACTION_CHAR_LIMIT))}
          className="flex-1 min-h-[160px] bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-indigo-500"
          placeholder="I channel all my remaining power into a desperate final inferno..."
        />
        <p className="text-xs text-gray-500">
          {action.length}/{ACTION_CHAR_LIMIT}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 py-2 rounded-lg text-sm transition-colors"
        >
          Generate Action for Me
        </button>
        <button
          onClick={handleSubmit}
          disabled={!action.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold text-lg transition-colors"
        >
          Submit Action
        </button>
      </div>
    </div>
  );
}
