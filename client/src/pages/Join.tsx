import { useState } from "react";
import { useLocation } from "wouter";
import { ROOM_CODE_LENGTH } from "../types";

export function Join() {
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [, navigate] = useLocation();

  function handleJoin() {
    if (!roomCode.trim() || !username.trim()) return;
    // TODO: join room via socket, then navigate
    navigate(`/play/${roomCode.toUpperCase()}/select`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-bold">Join Game</h2>

      <div className="w-full">
        <label className="block text-sm text-gray-400 mb-2">Your Name</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
          placeholder="Enter your name"
          maxLength={20}
        />
      </div>

      <div className="w-full">
        <label className="block text-sm text-gray-400 mb-2">Room Code</label>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, ROOM_CODE_LENGTH))}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-indigo-500"
          placeholder="A3K9ZX"
          maxLength={ROOM_CODE_LENGTH}
        />
      </div>

      <button
        onClick={handleJoin}
        disabled={!roomCode.trim() || !username.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        Join Game
      </button>
    </div>
  );
}
