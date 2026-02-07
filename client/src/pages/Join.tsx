import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ROOM_CODE_LENGTH } from "../types";
import { socket, connectSocket } from "../lib/socket";
import { useGameStore } from "../stores/gameStore";
import { api } from "../lib/api";
import type { Character } from "../types";

export function Join() {
  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [, navigate] = useLocation();
  const sessionId = useGameStore((s) => s.sessionId);
  const { setPlayerSlot, setError, setBattle, error } = useGameStore();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingChars, setLoadingChars] = useState(true);

  // Fetch user's characters
  useEffect(() => {
    if (!sessionId) return;
    api
      .getCharacters(sessionId)
      .then(setCharacters)
      .finally(() => setLoadingChars(false));
  }, [sessionId]);

  // Socket listeners
  useEffect(() => {
    connectSocket();

    function onBattleStart({ battle }: any) {
      setBattle(battle);
      navigate(`/play/${roomCode.toUpperCase()}`);
    }

    function onError({ message }: { message: string }) {
      setError(message);
      setJoining(false);
    }

    socket.on("battle:start", onBattleStart);
    socket.on("room:error", onError);

    return () => {
      socket.off("battle:start", onBattleStart);
      socket.off("room:error", onError);
    };
  }, [roomCode, navigate, setBattle, setError]);

  const selectedCharacter = characters.find((c) => c.id === selectedId);

  function handleJoin() {
    if (!roomCode.trim() || !selectedId || !selectedCharacter || joining) return;
    setError(null);
    setJoining(true);

    const code = roomCode.toUpperCase();

    // Join room using character name as username, then select character & ready up
    socket.emit("room:join", {
      roomId: code,
      username: selectedCharacter.name,
    });

    // Once join is confirmed, select character and ready up
    socket.once("room:player_joined", ({ player, playerSlot }) => {
      if (player.connectionId === socket.id) {
        setPlayerSlot(playerSlot);
        socket.emit("character:select", {
          roomId: code,
          characterId: selectedId,
        });
        socket.emit("player:ready", { roomId: code });
      }
    });
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-bold">Join Game</h2>
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back
        </Link>
      </div>

      {error && (
        <div className="w-full bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Room code */}
      <div className="w-full">
        <label className="block text-sm text-gray-400 mb-2">Room Code</label>
        <input
          type="text"
          value={roomCode}
          onChange={(e) =>
            setRoomCode(e.target.value.toUpperCase().slice(0, ROOM_CODE_LENGTH))
          }
          disabled={joining}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-indigo-500 disabled:opacity-60"
          placeholder="A3K9ZX"
          maxLength={ROOM_CODE_LENGTH}
        />
      </div>

      {/* Character select */}
      <div className="w-full">
        <label className="block text-sm text-gray-400 mb-2">
          Choose Your Fighter
        </label>

        {loadingChars ? (
          <p className="text-center text-gray-500 py-8">
            Loading characters...
          </p>
        ) : characters.length === 0 ? (
          <div className="text-center py-8 bg-gray-900 border border-gray-700 rounded-lg">
            <p className="text-gray-500 mb-3">No characters yet!</p>
            <a
              href="/characters/create"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline text-sm"
            >
              Create one in a new tab
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                disabled={joining}
                className={`bg-gray-900 border rounded-lg overflow-hidden text-left transition-colors ${
                  selectedId === c.id
                    ? "border-indigo-500 ring-2 ring-indigo-500/50"
                    : "border-gray-700 hover:border-gray-500"
                } ${joining ? "opacity-60" : ""}`}
              >
                <div className="aspect-square bg-gray-800">
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <p className="font-semibold truncate text-sm">{c.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Join button */}
      <button
        onClick={handleJoin}
        disabled={!roomCode.trim() || !selectedId || joining}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        {joining ? "Waiting for opponent..." : "Join & Fight"}
      </button>
    </div>
  );
}
