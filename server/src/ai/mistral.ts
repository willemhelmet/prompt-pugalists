import { Mistral } from "@mistralai/mistralai";
import type { ActionChoice, Battle, BattleResolution, Character } from "../types.js";
import { placeholderResolve } from "../managers/BattleManager.js";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

// ── AI Engine System Prompt ─────────────────────────────────────

const ENGINE_SYSTEM_PROMPT = `
You are the AI Engine for Prompt Pugilists — a real-time AI battle game. You are the SOLE AUTHORITY on what happens in this battle. Your output drives the video generation, voice narration, game state, and player choices simultaneously.

## YOUR RESPONSIBILITIES

1. **Interpret** both players' chosen actions
2. **Resolve** the clash using dice mechanics and creative narrative
3. **Produce coordinated output** for ALL downstream systems in one pass
4. **Maintain battle memory** by summarizing this round's events

## CRITICAL: OUTPUT COORDINATION

Every field you produce must tell the SAME STORY:
- If the narrator says "Zara was engulfed in flames" then the video prompt MUST show flames hitting Zara
- If HP drops by 15, the narrator and video must reflect serious damage
- If a player's condition changes to "frozen solid", the next round's action choices must account for that
- The 4 action choices for each player must react to what JUST happened

## CHARACTER VISUAL FINGERPRINTS

Each character has a detailed text description (their "visual fingerprint"). You MUST use specific visual details from these fingerprints in the videoPrompt so the video renders the characters consistently. Reference their clothing, colors, distinctive features, weapons, etc.

## VISUAL DEGRADATION

As fighters lose HP, their appearance MUST reflect the damage in the videoPrompt:
- **30-40 HP (Fresh)**: Character looks as described in fingerprint — pristine, confident, powerful
- **20-29 HP (Worn)**: Visible wear — torn clothing, sweat, dirt, scuffed armor, slightly hunched posture
- **10-19 HP (Battered)**: Serious damage — bleeding, limping, broken equipment, exhaustion visible, struggling to stand
- **1-9 HP (Desperate)**: Near collapse — barely standing, clothing in tatters, bloodied, one eye shut, using weapon as a crutch

Always layer these degradation details ON TOP of the character's visual fingerprint. The character should still be recognizable but visibly worse for wear.

## VIDEO PROMPT RULES

### STYLE LOCK — CRITICAL FOR VISUAL CONSISTENCY

Every videoPrompt you write MUST end with this exact style suffix:

"AAA video game, Unreal Engine 5, global illumination, volumetric lighting, stylized 3D characters, vibrant saturated colors, dramatic rim lighting, shallow depth of field, cinematic camera."

This is NON-NEGOTIABLE. The video generation AI has no memory between rounds — if you change artistic style descriptors, the entire visual look shifts jarringly. By anchoring every prompt to the same rendering style, the video feed maintains a consistent aesthetic throughout the battle.

### CONTENT RULES

- 2-3 sentences of CONTENT describing the action, THEN the style suffix above
- ALWAYS include character visual details from fingerprints + degradation based on current HP
- Focus on the KEY dramatic moment of the clash
- Incorporate the battle environment
- Written for a video generation AI (describe what the camera SEES)
- NEVER include style words like "watercolor", "anime", "pixel art", "oil painting", "photorealistic", "2D", "sketch", "cartoon" — these override the style lock and break visual consistency
- ALWAYS describe the same camera perspective: medium-wide shot, slightly low angle, both fighters visible

## NARRATOR SCRIPT RULES

You are a **Champions League-style British sports commentator**. Think Martin Tyler calling a last-minute winner.

- 3-5 sentences, written to be SPOKEN ALOUD by a British commentator
- Genuinely excited, building energy as the fight intensifies
- Occasionally cheeky or witty — dry humor, understatement
- Reference characters BY NAME, always
- Describe what happened, who got hurt, what's at stake
- End with tension or a question: "Can Mordak survive another round?" / "The momentum has shifted!"
- As HP gets low, the commentary should get more urgent and breathless
- Do NOT use cringeworthy gaming tropes — no "CRITICAL HIT!", no "COMBO BREAKER!", no anime announcer energy
- Do NOT duplicate the video prompt — this is for ears, video is for eyes

Example tone: "Oh, that is BRILLIANT from Zara! She's pulled the lava right from the arena floor and Mordak has absolutely no answer for it. He's staggering, he's hurt — and with only fifteen hit points remaining, you have to wonder if he can possibly come back from this."

## ACTION CHOICES (4 per player)

Generate 4 distinct tactical options for each player's NEXT round. Each choice is an object with:
- "label": Short punchy name (2-10 words max)
- "description": Full action description (1-2 sentences)
- "category": exactly one of "attack", "magic", "defend", "heal"

Include exactly one action per category. Make them specific to the current battle state, character abilities, and HP level.

## BATTLE MEMORY

You are given a cumulative "Battle Summary" of everything that has happened so far. Use this to maintain continuity — reference earlier events, callback to previous moves, build on the narrative arc.

You MUST produce a "battleSummaryUpdate" — a 2-3 sentence summary of THIS round's key events. The server will append it to the running summary for the next round's context.

## DICE MECHANICS

- Roll 1d20 for attack/defense (10+ success, with creativity modifiers)
- Damage: 8-15 HP typical, exceptional moments can go higher
- Both actions resolve SIMULTANEOUSLY
- Show your rolls for transparency

## HP SYSTEM

- Both players: 40 HP max
- Healing: 5-10 HP (rare, requires narrative justification)
- If HP reaches 0: set isVictory=true, provide victoryNarration

## RESPONSE FORMAT

Return ONLY valid JSON with these exact fields:

{
  "interpretation": "What you understood both players wanted to do",
  "player1HpChange": -10,
  "player2HpChange": -8,
  "newBattleState": {
    "environmentDescription": "Updated environment",
    "player1Condition": "Updated condition for player 1",
    "player2Condition": "Updated condition for player 2",
    "previousEvents": ["Event 1", "Event 2", "Event 3"],
    "battleSummary": ""
  },
  "videoPrompt": "2-3 cinematic sentences with character fingerprint details and degradation",
  "narratorScript": "3-5 sentences of British sports commentary",
  "battleSummaryUpdate": "2-3 sentence recap of this round",
  "player1ActionChoices": [
    { "label": "Flame Slash", "description": "Swing a blazing sword at the opponent", "category": "attack" },
    { "label": "Arcane Volley", "description": "Launch a barrage of magical projectiles", "category": "magic" },
    { "label": "Iron Guard", "description": "Raise a protective barrier of hardened earth", "category": "defend" },
    { "label": "Second Wind", "description": "Channel healing energy to recover from wounds", "category": "heal" }
  ],
  "player2ActionChoices": [
    { "label": "Crushing Blow", "description": "Deliver a devastating overhead strike", "category": "attack" },
    { "label": "Shadow Bolt", "description": "Hurl a bolt of dark energy at the foe", "category": "magic" },
    { "label": "Evasive Roll", "description": "Dodge sideways and prepare a counter-attack", "category": "defend" },
    { "label": "Drain Life", "description": "Siphon the opponent's vitality to heal yourself", "category": "heal" }
  ],
  "isVictory": false,
  "winnerId": null,
  "victoryNarration": null,
  "diceRolls": [
    { "player": "player1", "purpose": "attack roll", "formula": "1d20+3", "result": 18, "modifier": 3 }
  ]
}
`;

// ── Build the per-round context prompt ─────────────────────────

function buildEnginePrompt(
  battle: Battle,
  action1: string,
  action2: string,
): string {
  const p1 = battle.player1;
  const p2 = battle.player2;
  const state = battle.currentState;
  const roundNumber = battle.resolutionHistory.length + 1;

  const p1Appearance = p1.character.visualFingerprint || p1.character.textPrompt;
  const p2Appearance = p2.character.visualFingerprint || p2.character.textPrompt;

  return `
## Current Battle State — Round ${roundNumber}

**Environment:** ${state.environmentDescription}

### Battle Summary So Far
${state.battleSummary || "This is the opening round. No previous events."}

### Player 1: ${p1.character.name}
- HP: ${p1.currentHp}/${p1.maxHp}
- Visual Fingerprint: ${p1Appearance}
- Condition: ${state.player1Condition}

### Player 2: ${p2.character.name}
- HP: ${p2.currentHp}/${p2.maxHp}
- Visual Fingerprint: ${p2Appearance}
- Condition: ${state.player2Condition}

### Previous Events
${state.previousEvents.length > 0 ? state.previousEvents.map((e, i) => `${i + 1}. ${e}`).join("\n") : "None yet."}

## This Round's Actions

**${p1.character.name} declares:** "${action1}"

**${p2.character.name} declares:** "${action2}"

---

Resolve these actions simultaneously. Use the visual fingerprints to write a visually specific videoPrompt — remember, as fighters lose HP they should visually show it (torn clothing, exhaustion, injuries). Write the narratorScript as an excited British Champions League-style commentator. Generate 4 action choices per player for the next round. Include a battleSummaryUpdate (2-3 sentences summarizing this round).

Return your response as JSON matching the expected format.
`;
}

function parseActionChoices(raw: unknown): ActionChoice[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 4).map((a: any) => ({
    label: String(a.label || "Unknown Action"),
    description: String(a.description || a.label || "Attack!"),
    category: (["attack", "magic", "defend", "heal"].includes(a.category) ? a.category : "attack") as ActionChoice["category"],
  }));
}

// ── AI Engine: single-pass combat resolution (mistral-large) ───

export async function runEngine(
  battle: Battle,
  action1: string,
  action2: string,
): Promise<BattleResolution> {
  const prompt = buildEnginePrompt(battle, action1, action2);

  try {
    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: ENGINE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Empty response from Mistral");
    }

    const parsed = JSON.parse(content);

    // Defensive parsing — provide defaults for any missing fields
    const resolution: BattleResolution = {
      player1Action: action1,
      player2Action: action2,
      interpretation: parsed.interpretation ?? "The fighters clash!",
      player1HpChange: parsed.player1HpChange ?? 0,
      player2HpChange: parsed.player2HpChange ?? 0,
      newBattleState: {
        environmentDescription: parsed.newBattleState?.environmentDescription ?? battle.currentState.environmentDescription,
        player1Condition: parsed.newBattleState?.player1Condition ?? battle.currentState.player1Condition,
        player2Condition: parsed.newBattleState?.player2Condition ?? battle.currentState.player2Condition,
        previousEvents: parsed.newBattleState?.previousEvents ?? battle.currentState.previousEvents,
        battleSummary: battle.currentState.battleSummary ?? "",
      },
      videoPrompt: parsed.videoPrompt ?? `${battle.player1.character.name} and ${battle.player2.character.name} clash in the arena.`,
      narratorScript: parsed.narratorScript ?? parsed.interpretation ?? "The fighters exchange blows!",
      battleSummaryUpdate: parsed.battleSummaryUpdate ?? "",
      player1ActionChoices: parseActionChoices(parsed.player1ActionChoices),
      player2ActionChoices: parseActionChoices(parsed.player2ActionChoices),
      isVictory: parsed.isVictory ?? false,
      winnerId: parsed.winnerId ?? null,
      victoryNarration: parsed.victoryNarration ?? null,
      diceRolls: Array.isArray(parsed.diceRolls) ? parsed.diceRolls : [],
      timestamp: new Date().toISOString(),
    };

    console.log(`[Engine] Round resolved — P1: ${resolution.player1HpChange} HP, P2: ${resolution.player2HpChange} HP, victory: ${resolution.isVictory}`);
    return resolution;
  } catch (err) {
    console.error("[Engine] Resolution FAILED, using placeholder:", err);
    return placeholderResolve(battle, action1, action2);
  }
}

// ── Generate initial action choices for Round 1 (mistral-medium) ─

export async function generateInitialActionChoices(
  character: Character,
  opponent: Character,
  environment: string,
): Promise<ActionChoice[]> {
  const appearance = character.visualFingerprint || character.textPrompt;
  const opponentAppearance = opponent.visualFingerprint || opponent.textPrompt;

  try {
    const response = await client.chat.complete({
      model: "mistral-medium-latest",
      messages: [
        {
          role: "system",
          content: `Generate 4 opening battle actions for a character. Return ONLY a JSON object with an "actions" key containing an array of 4 objects. Each object must have:
- "label": Short punchy name (2-10 words max)
- "description": Full action description (1-2 sentences)
- "category": exactly one of "attack", "magic", "defend", "heal"

Include exactly one action per category. Make them specific to the character and opponent.`,
        },
        {
          role: "user",
          content: `Character: ${character.name} (${appearance})\nOpponent: ${opponent.name} (${opponentAppearance})\nEnvironment: ${environment}`,
        },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.9,
      maxTokens: 600,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Empty response from Mistral");
    }

    const parsed = JSON.parse(content);
    const actions = parsed.actions;
    if (Array.isArray(actions) && actions.length >= 4) {
      const validated = actions.slice(0, 4).map((a: any) => ({
        label: String(a.label || "Unknown Action"),
        description: String(a.description || a.label || "Attack!"),
        category: (["attack", "magic", "defend", "heal"].includes(a.category) ? a.category : "attack") as ActionChoice["category"],
      }));
      console.log(`[Engine] Initial action choices generated for ${character.name}`);
      return validated;
    }
    throw new Error("Invalid actions array");
  } catch (err) {
    console.error(`[Engine] Initial action choices FAILED for ${character.name}, using fallback:`, err);
    return [
      { label: "Opening Strike", description: `Launch a powerful opening strike against ${opponent.name}!`, category: "attack" },
      { label: "Arcane Blast", description: `Channel magical energy into a devastating spell aimed at ${opponent.name}.`, category: "magic" },
      { label: "Defensive Stance", description: `Take a defensive stance and study ${opponent.name}'s movements carefully.`, category: "defend" },
      { label: "Restorative Focus", description: `Channel inner energy to strengthen yourself before the battle intensifies.`, category: "heal" },
    ];
  }
}

// ── Action suggestion (mistral-medium) ─────────────────────────

export async function generateActionSuggestion(
  battle: Battle,
  playerId: string,
): Promise<string> {
  const player =
    battle.player1.playerId === playerId ? battle.player1 : battle.player2;
  const opponent =
    battle.player1.playerId === playerId ? battle.player2 : battle.player1;

  const isPlayer1 = battle.player1.playerId === playerId;

  const prompt = `
You are helping a player in a magical battle come up with a creative action.

## Battle Context
Environment: ${battle.currentState.environmentDescription}
Your Character: ${player.character.name} (${player.currentHp}/${player.maxHp} HP)
Your Condition: ${isPlayer1 ? battle.currentState.player1Condition : battle.currentState.player2Condition}
Opponent: ${opponent.character.name} (${opponent.currentHp}/${opponent.maxHp} HP)
Opponent Condition: ${isPlayer1 ? battle.currentState.player2Condition : battle.currentState.player1Condition}

## Previous Events
${battle.currentState.previousEvents.slice(-3).join("\n")}

## Task
Generate ONE creative action (2-3 sentences) that this player could take.
Be specific, dramatic, and use the environment.
Make it interesting and different from what they've done before.

Return ONLY the action text, no preamble.
`;

  try {
    const response = await client.chat.complete({
      model: "mistral-medium-latest",
      messages: [
        {
          role: "system",
          content: "You are a creative dungeon master assistant.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      maxTokens: 150,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Empty response from Mistral");
    }

    console.log(`[Mistral] Action suggested via mistral-medium for ${player.character.name}`);
    return content.trim();
  } catch (err) {
    console.error("[Mistral] Action suggestion FAILED, using fallback:", err);
    return `${player.character.name} channels their energy and launches a powerful attack!`;
  }
}

// ── Surprise Me helpers ──────────────────────────────────────

const INSPIRATION_THEMES = [
  "cosmic horror", "steampunk", "deep sea", "volcanic", "cyberpunk",
  "underwater", "celestial", "fungal", "crystalline", "desert",
  "arctic", "bioluminescent", "clockwork", "tribal", "noir",
  "solarpunk", "eldritch", "insectoid", "samurai", "aztec",
  "baroque", "post-apocalyptic", "ethereal", "biomechanical", "voodoo",
  "quantum", "mythological", "carnival", "radioactive", "origami",
  "gothic", "prehistoric", "alchemical", "astral", "swamp",
];

function pickRandomThemes(count: number): string[] {
  const shuffled = [...INSPIRATION_THEMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Surprise Me: character prompt ─────────────────────────────

export async function generateCharacterSuggestion(): Promise<{
  name: string;
  prompt: string;
}> {
  try {
    const response = await client.chat.complete({
      model: "mistral-medium-latest",
      messages: [
        {
          role: "system",
          content:
            "You are a creative fantasy character designer. Generate unique, visually striking fighters for a magical combat game.",
        },
        {
          role: "user",
          content: `Invent a unique fighting game character. Return ONLY valid JSON with two fields:
- "name": a dramatic character name (2-4 words)
- "prompt": a vivid visual description for AI image generation (60-100 words). Describe their appearance, clothing, weapons, magical effects, and mood. Use cinematic, visual language.

Be wildly creative — mix genres, cultures, and fantasy elements. No generic wizards or knights.

Inspiration themes: [${pickRandomThemes(3).join(", ")}]`,
        },
      ],
      responseFormat: { type: "json_object" },
      temperature: 1.0,
      randomSeed: Math.floor(Math.random() * 2 ** 31),
      maxTokens: 200,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("Empty response");

    const parsed = JSON.parse(content);
    console.log(`[Mistral] Character suggestion: ${parsed.name}`);
    return { name: parsed.name, prompt: parsed.prompt };
  } catch (err) {
    console.error("[Mistral] Character suggestion FAILED:", err);
    return {
      name: "Ember Wraith",
      prompt:
        "A spectral warrior wreathed in flickering green flame, wearing tattered samurai armor fused with crystalline growths, dual-wielding curved blades that trail ghostly afterimages, hollow glowing eyes peering from beneath a cracked oni mask",
    };
  }
}

// ── Visual Fingerprint (Pixtral vision) ───────────────────────

export async function generateVisualFingerprint(
  imageUrl: string,
  characterName: string,
  originalTextPrompt: string,
): Promise<string> {
  try {
    const response = await client.chat.complete({
      model: "pixtral-large-2411",
      messages: [
        {
          role: "system",
          content: `You are a visual description specialist. Given an image of a fighting game character, produce a dense 100-150 word description that captures EVERY visual detail needed for a video AI to render this character consistently across frames. Include: clothing (materials, colors, patterns), body type and proportions, hair (style, color, length), skin tone, weapons or tools, accessories (jewelry, belts, masks), posture and stance, distinctive features (scars, tattoos, glowing effects), color palette. Be extremely specific — say "cobalt-blue leather pauldrons with brass rivets" not "blue armor". The character's name is "${characterName}" and the original creation prompt was: "${originalTextPrompt}". Use only visual descriptors — no narrative, no backstory.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              imageUrl: imageUrl,
            },
            {
              type: "text",
              text: `Describe this character's complete visual appearance in 100-150 words. Be extremely specific about colors, materials, and distinctive features.`,
            },
          ],
        },
      ],
      temperature: 0.3,
      maxTokens: 300,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Empty response from Pixtral");
    }

    console.log(`[Pixtral] Visual fingerprint generated for ${characterName}`);
    return content.trim();
  } catch (err) {
    console.error(`[Pixtral] Visual fingerprint FAILED for ${characterName}:`, err);
    return "";
  }
}

// ── Prompt Enhancement ────────────────────────────────────────

const CHARACTER_ENHANCE_SYSTEM_PROMPT = `You are a prompt enhancement specialist for a fighting game character creator. The user will give you a rough character description. Rewrite it with vivid, specific visual details optimized for AI image generation.

Add specifics about:
- Clothing materials, colors, and textures (e.g. "weathered bronze chainmail" not "armor")
- Weapons with distinctive features (e.g. "jagged obsidian greatsword crackling with violet lightning")
- Magical effects, auras, or elemental emanations
- Stance, posture, and expression
- Distinctive accessories (scars, tattoos, jewelry, masks)

Keep the core concept the user intended. Output ONLY the enhanced description — no preamble, no quotes, no explanation. Stay under 500 characters.`;

const ENVIRONMENT_ENHANCE_SYSTEM_PROMPT = `You are a prompt enhancement specialist for a fighting game battle arena. The user will give you a rough arena description. Rewrite it with vivid, cinematic detail optimized for AI image/video generation.

Add specifics about:
- Atmosphere and lighting (time of day, weather, volumetric effects)
- Dramatic environmental features (hazards, moving elements, scale)
- Color palette and mood
- Textures and materials of the terrain

Keep the core concept the user intended. Output ONLY the enhanced description — no preamble, no quotes, no explanation. Stay under 300 characters.`;

export async function enhanceCharacterPrompt(prompt: string): Promise<string> {
  const response = await client.chat.complete({
    model: "mistral-medium-latest",
    messages: [
      { role: "system", content: CHARACTER_ENHANCE_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 250,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Empty response from Mistral");
  }

  console.log("[Mistral] Character prompt enhanced");
  return content.trim().slice(0, 500);
}

export async function enhanceEnvironmentPrompt(prompt: string): Promise<string> {
  const response = await client.chat.complete({
    model: "mistral-medium-latest",
    messages: [
      { role: "system", content: ENVIRONMENT_ENHANCE_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 200,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Empty response from Mistral");
  }

  console.log("[Mistral] Environment prompt enhanced");
  return content.trim().slice(0, 300);
}

// ── Surprise Me: environment prompt ───────────────────────────

export async function generateEnvironmentSuggestion(): Promise<string> {
  try {
    const response = await client.chat.complete({
      model: "mistral-medium-latest",
      messages: [
        {
          role: "system",
          content:
            "You are a creative fantasy environment designer for a magical combat game.",
        },
        {
          role: "user",
          content: `Invent a unique battle arena for a fantasy fighting game. Return ONLY the description text (60-100 words, no JSON wrapping). Describe the landscape, lighting, atmosphere, and any dramatic environmental features. Use vivid, cinematic visual language. Be wildly creative — mix unexpected themes.

Inspiration themes: [${pickRandomThemes(3).join(", ")}]`,
        },
      ],
      temperature: 1.0,
      randomSeed: Math.floor(Math.random() * 2 ** 31),
      maxTokens: 150,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("Empty response");

    console.log("[Mistral] Environment suggestion generated");
    return content.trim();
  } catch (err) {
    console.error("[Mistral] Environment suggestion FAILED:", err);
    return "A shattered clockwork cathedral suspended in a violet nebula, massive gears grinding slowly overhead, stained glass windows projecting kaleidoscopic light beams across floating stone platforms connected by chains of pure energy";
  }
}
