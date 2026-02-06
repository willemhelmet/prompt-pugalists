import { Link } from "wouter";

export function CharacterGallery() {
  // TODO: fetch characters from API

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Characters</h2>
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back
        </Link>
      </div>

      <Link
        href="/characters/create"
        className="bg-indigo-600 hover:bg-indigo-500 text-center py-3 rounded-lg font-semibold transition-colors"
      >
        + Create New Character
      </Link>

      {/* Character grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* TODO: map characters */}
        <p className="col-span-2 text-center text-gray-500 py-12">
          No characters yet. Create one to get started!
        </p>
      </div>
    </div>
  );
}
