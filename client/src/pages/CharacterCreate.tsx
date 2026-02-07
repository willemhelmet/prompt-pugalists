import { useLocation } from "wouter";
import { useGameStore } from "../stores/gameStore";
import { api } from "../lib/api";
import { CharacterForm } from "../components/CharacterForm";

export function CharacterCreate() {
  const [, navigate] = useLocation();
  const sessionId = useGameStore((s) => s.sessionId);

  async function handleSubmit(data: {
    name: string;
    textPrompt: string;
    imageUrl: string;
    referenceImageUrl: string | null;
  }) {
    if (!sessionId) return;

    await api.createCharacter({
      userId: sessionId,
      name: data.name,
      imageUrl: data.imageUrl,
      textPrompt: data.textPrompt,
      referenceImageUrl: data.referenceImageUrl || undefined,
    });

    navigate("/characters");
  }

  return (
    <CharacterForm
      onSubmit={handleSubmit}
      submitLabel="Save Character"
      submittingLabel="Saving..."
      title="Create Character"
      backHref="/characters"
    />
  );
}
