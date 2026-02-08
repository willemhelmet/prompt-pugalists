import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Link } from "wouter";
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
      <div className="relative min-h-screen overflow-hidden font-body">
        <div className="fixed inset-0 bg-gray-950">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px]" />
          <div className="absolute -bottom-40 -right-32 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[140px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500 tracking-wide">
            Loading fighter&hellip;
          </p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="relative min-h-screen overflow-hidden font-body">
        <div className="fixed inset-0 bg-gray-950">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px]" />
          <div className="absolute -bottom-40 -right-32 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[140px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-5">
          <div className="bg-red-950/50 border border-red-500/20 rounded-xl px-5 py-3 text-red-300 text-sm flex items-center gap-2.5">
            <svg
              className="w-4 h-4 shrink-0 text-red-400/80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error || "Character not found"}
          </div>
          <Link
            href="/characters"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to characters
          </Link>
        </div>
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
