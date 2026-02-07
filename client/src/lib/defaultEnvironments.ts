export interface EnvironmentPreset {
  id: string;
  label: string;
  description: string;
  imageUrl: string;
}

export const DEFAULT_ENVIRONMENTS: EnvironmentPreset[] = [
  {
    id: "volcanic-arena",
    label: "Volcanic Arena",
    description:
      "A volcanic arena with rivers of molten lava crisscrossing the obsidian floor, geysers of flame erupting from cracks in the scorched earth",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=VolcanicArena",
  },
  {
    id: "ancient-temple",
    label: "Ancient Temple",
    description:
      "A crumbling ancient temple with pillars of light streaming through broken ceilings, floating rune stones humming with arcane energy",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=AncientTemple",
  },
  {
    id: "enchanted-forest",
    label: "Enchanted Forest",
    description:
      "A dark enchanted forest with bioluminescent plants casting eerie glows, whispering trees with gnarled roots and a misty canopy above",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=EnchantedForest",
  },
  {
    id: "ruined-castle",
    label: "Ruined Castle",
    description:
      "A ruined castle courtyard under a stormy sky, lightning strikes illuminating crumbling towers and scattered suits of armor",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=RuinedCastle",
  },
  {
    id: "storm-peak",
    label: "Storm Peak",
    description:
      "A jagged mountain peak above the clouds, lashed by howling wind and crackling lightning, the air thick with static energy",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=StormPeak",
  },
  {
    id: "floating-islands",
    label: "Floating Islands",
    description:
      "Floating islands connected by ancient chains suspended over a bottomless void, waterfalls cascading into the abyss below",
    imageUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=FloatingIslands",
  },
];
