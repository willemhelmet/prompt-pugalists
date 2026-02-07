import type { Character } from "../types";

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "default-flame-sorceress",
    userId: "__default__",
    name: "Ignis the Flame Sorceress",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=FlameSorceress",
    textPrompt:
      "A fierce fire mage in flowing crimson robes, embers swirling around her outstretched hands, eyes glowing with inner flame, standing in a haze of heat and ash",
    referenceImageUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "default-frost-knight",
    userId: "__default__",
    name: "Boreas the Frost Knight",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=FrostKnight",
    textPrompt:
      "A towering armored warrior encased in glacial plate mail, wielding a massive ice-forged greatsword, frost trailing in his wake, breath visible in the cold aura surrounding him",
    referenceImageUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];
