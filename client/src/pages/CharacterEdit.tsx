import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { CharacterForm } from "../components/CharacterForm";
import type { Character } from "../types";

export function CharacterEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCharacter(id!)
      .then(setCharacter)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(data: {
    name: string;
    textPrompt: string;
    imageUrl: string;
    referenceImageUrl: string | null;
  }) {
    await api.updateCharacter(id!, {
      name: data.name,
      imageUrl: data.imageUrl,
      textPrompt: data.textPrompt,
      referenceImageUrl: data.referenceImageUrl || undefined,
    });

    navigate("/characters");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading character...</p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-400">{error || "Character not found"}</p>
        <a
          href="/characters"
          className="text-indigo-400 hover:text-indigo-300 text-sm"
        >
          Back to characters
        </a>
      </div>
    );
  }

  return (
    <CharacterForm
      initialName={character.name}
      initialTextPrompt={character.textPrompt}
      initialImageUrl={character.imageUrl}
      initialReferenceImageUrl={character.referenceImageUrl}
      onSubmit={handleSubmit}
      submitLabel="Update Character"
      submittingLabel="Updating..."
      title="Edit Character"
      backHref="/characters"
    />
  );
}
