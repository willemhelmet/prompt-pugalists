import { useState } from "react";
import { useLocation } from "wouter";
import { CHARACTER_PROMPT_CHAR_LIMIT } from "../types";

export function CharacterCreate() {
  const [name, setName] = useState("");
  const [textPrompt, setTextPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [, navigate] = useLocation();

  function handleGenerate() {
    if (!textPrompt.trim()) return;
    // TODO: call Decart API to generate character image
    console.log("Generating character image for:", textPrompt);
  }

  function handleSave() {
    if (!name.trim() || !textPrompt.trim()) return;
    // TODO: save character via API
    console.log("Saving character:", { name, textPrompt, imageUrl });
    navigate("/characters");
  }

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold">Create Character</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Character Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
          placeholder="Zara the Pyromancer"
          maxLength={50}
        />
      </div>

      {/* Preview */}
      <div className="w-full aspect-square bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <p className="text-gray-500">Character preview will appear here</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Describe your character</label>
        <textarea
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value.slice(0, CHARACTER_PROMPT_CHAR_LIMIT))}
          className="w-full h-28 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-indigo-500"
          placeholder="A fierce fire mage wearing crimson robes with glowing embers swirling around her hands"
        />
        <p className="text-xs text-gray-500 mt-1">
          {textPrompt.length}/{CHARACTER_PROMPT_CHAR_LIMIT}
        </p>
      </div>

      {/* TODO: reference image upload */}

      <button
        onClick={handleGenerate}
        disabled={!textPrompt.trim()}
        className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 border border-gray-700 py-3 rounded-lg font-semibold transition-colors"
      >
        Regenerate Character
      </button>

      <button
        onClick={handleSave}
        disabled={!name.trim() || !textPrompt.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        Save Character
      </button>
    </div>
  );
}
