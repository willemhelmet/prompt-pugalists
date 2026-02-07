import { Link } from "wouter";

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-8">
      <h1 className="text-5xl font-bold tracking-tight">Prompt Pugilists</h1>
      <p className="text-gray-400 text-lg text-center max-w-md">
        Create characters. Battle with words. Let AI decide the rest.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/host/environment"
          className="bg-indigo-600 hover:bg-indigo-500 text-center py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
        >
          Host Game
        </Link>

        <div className="text-center text-gray-500">or</div>

        <Link
          href="/join"
          className="bg-gray-800 hover:bg-gray-700 text-center py-3 px-6 rounded-lg font-semibold text-lg transition-colors border border-gray-700"
        >
          Join Game
        </Link>

        <Link
          href="/characters"
          className="bg-gray-800 hover:bg-gray-700 text-center py-3 px-6 rounded-lg font-semibold text-lg transition-colors border border-gray-700"
        >
          Browse Characters
        </Link>
      </div>
    </div>
  );
}
