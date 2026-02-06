import { useParams } from "wouter";

export function CharacterSelect() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold">Select Your Fighter</h2>
      <p className="text-gray-400 text-sm">Room: {roomId}</p>

      {/* TODO: fetch characters and display grid */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 aspect-square flex items-center justify-center text-gray-500">
          No characters yet
        </div>
      </div>

      <button
        disabled
        className="w-full bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold transition-colors"
      >
        Ready
      </button>
    </div>
  );
}
