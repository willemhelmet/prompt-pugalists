import { useParams } from "wouter";

export function HostDisplay() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="flex flex-col min-h-screen p-4 gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">
          Room Code: <span className="font-mono text-white text-lg font-bold">{roomId}</span>
        </span>
        <span className="text-sm text-gray-400">Round: —</span>
      </div>

      {/* Player HP bars */}
      <div className="flex justify-between">
        <div>
          <p className="font-semibold">Player 1</p>
          <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
          </div>
          <p className="text-xs text-gray-400">50/50 HP</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Player 2</p>
          <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} />
          </div>
          <p className="text-xs text-gray-400">50/50 HP</p>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
        <p className="text-gray-500">Reactor Video Feed</p>
      </div>

      {/* Battle log */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-32 overflow-y-auto">
        <p className="text-gray-500 text-sm">Waiting for players to join...</p>
      </div>
    </div>
  );
}
