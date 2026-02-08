# Prompt Pugilists - Technical Specification v4.0

**Working Title:** Prompt Pugilists  
**Last Updated:** February 7, 2026  
**Status:** Hackathon Project — Core Loop Complete, Entering Polish & Demo Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Progress](#current-progress)
3. [Design Philosophy](#design-philosophy)
4. [System Architecture](#system-architecture)
5. [The AI Engine (Orchestration Layer)](#the-ai-engine-orchestration-layer)
6. [Visual Fingerprint Pipeline](#visual-fingerprint-pipeline)
7. [Real-Time AI Voice Narration](#real-time-ai-voice-narration)
8. [Data Models](#data-models)
9. [Client Architecture](#client-architecture)
10. [Server Architecture](#server-architecture)
11. [Combat Resolution](#combat-resolution)
12. [API Specifications](#api-specifications)
13. [Database Schema](#database-schema)
14. [Example Battle Flow](#example-battle-flow)
15. [Character System](#character-system)
16. [Demo Strategy](#demo-strategy)
17. [Development Roadmap](#development-roadmap)
18. [Technical Requirements](#technical-requirements)
19. [Cost Estimates](#cost-estimates)

---

## Executive Summary

**Prompt Pugilists** is a multiplayer real-time fighting game where players create custom characters and battle using natural language prompts. The game adopts a **Jackbox-style local multiplayer** model where a host device (laptop/desktop) displays AI-generated battle videos with live AI voice narration, while players control their characters through mobile devices.

### Core Gameplay Loop

1. **Host Setup**: Host device creates a room, selects battle environment, and displays a 6-character room code
2. **Player Join**: 2 players join via mobile devices using the room code
3. **Character Selection**: Players select from their created characters (AI-generated images with text-based visual fingerprints)
4. **Battle**: Each round, players choose from 4 AI-generated action buttons OR write a freeform prompt
5. **AI Engine Resolution**: The central AI engine interprets actions, resolves outcomes, and produces structured output for ALL downstream systems simultaneously
6. **Video Generation**: Reactor LiveCore renders real-time video using character visual fingerprints
7. **Voice Narration**: AI narrator describes the action in real-time, giving meaning to the video
8. **Repeat**: Battle continues until one player's HP reaches 0

### Key Innovations

**Natural Language Combat**: Instead of rigid spell/action menus, players describe what they want to do in plain English — or pick from 4 AI-generated tactical options for fast-paced play. The AI engine interprets intent, resolves outcomes using dice rolls, and generates coordinated output for video, voice, and game state.

**AI Character Generation + Visual Fingerprints**: Characters are created using Decart's AI image generation. Since Reactor LiveCore is text-only (no image input), each character image is processed through Mistral's vision model to produce a detailed text-based "visual fingerprint" — a rich description that gets baked into every Reactor prompt for visual consistency.

**AI Voice Narration**: A real-time AI narrator commentates the battle like a fight announcer, transforming abstract video into a comprehensible spectacle. This is the primary feedback mechanism — more immediate and engaging than reading text.

**The AI Engine**: The central orchestration layer that takes player input + character fingerprints + battle state and produces tightly structured, coordinated output for every downstream system. The quality ceiling of the game IS the quality of this engine.

---

## Current Progress

> **As of Feb 7, 2026 — Hackathon Day 1 Complete**

### ✅ Working End-to-End

- Full room creation → join → character select → battle loop
- Two players on separate mobile devices submitting prompts
- Mistral AI resolving combat and returning structured JSON
- Reactor LiveCore video stream playing on host and responding to prompts
- Decart character image generation
- WebSocket real-time communication across all clients

### 🚧 Identified Issues & Pivots

- **Reactor is text-only** — does not accept images as input. Pivoting to Visual Fingerprint Pipeline (Decart image → Mistral vision → text description)
- **Video is abstract without context** — players can't tell what's happening. Adding AI voice narration as primary feedback
- **Typing prompts on mobile is too slow** — adding button-based action selection (4 choices per round)
- **AI resolution output is inconsistent** — need to restructure engine to produce tightly coordinated output for all downstream systems

### 🎯 Remaining Hackathon Priorities

1. Restructure AI Engine as central orchestration layer
2. Implement Visual Fingerprint Pipeline
3. Add real-time AI voice narration
4. Add button-based action UI (keep freeform as secondary option)
5. Polish demo flow

---

## Design Philosophy

### Creative Freedom Over Structure

- **No Rigid Types**: Damage types, spell effects, and abilities are freeform strings, not enums
- **AI Interpretation**: Mistral AI interprets player intent through natural language alone
- **Minimal Constraints**: Players can attempt anything; success depends on stats and dice rolls
- **Single Decisive Round**: No complex multi-round state tracking; focus on dramatic moment-to-moment combat

### Guiding Principles

1. **Player Agency**: "I want to..." should always be valid input
2. **Emergent Gameplay**: Interesting interactions emerge from AI interpretation
3. **Accessibility**: No need to memorize spell lists or game mechanics
4. **Spectacle**: Every round generates a unique, cinematic video moment

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐         ┌──────────────────────────────┐         ┌─────────────┐
│   Host      │ ◄─────► │         Server               │ ◄─────► │  Reactor    │
│  (Desktop)  │  WSS    │        (Node.js)              │  WSS    │  LiveCore   │
│  Video +    │         │                              │         │ (text only) │
│  Voice Out  │         │  ┌────────────────────────┐  │         └─────────────┘
└──────┬──────┘         │  │   🧠 AI ENGINE         │  │
       │                │  │   (Orchestration Layer) │  │         ┌─────────────┐
       │  HTTP          │  │                        │  │  HTTP   │  Mistral    │
       ▼                │  │  Inputs:               │◄─┼────────►│    AI       │
┌─────────────┐         │  │  - Player actions      │  │         │ (LLM +     │
│  Neocortex  │         │  │  - Visual fingerprints │  │         │  Vision)   │
│  (Voice Gen)│         │  │  - Battle state        │  │         └─────────────┘
│  Called     │         │  │  - Environment         │  │
│  directly   │         │  │                        │  │         ┌─────────────┐
│  by host    │         │  │  Outputs:              │  │  HTTP   │  Decart     │
└─────────────┘         │  │  - Reactor prompt      │◄─┼────────►│  (Image     │
                        │  │  - Narrator script     │  │         │   Gen)      │
                        │  │  - HP changes          │  │         └─────────────┘
                        │  │  - Battle state update │  │
                        │  │  - Action choices (x4) │  │
                        │  └────────────────────────┘  │
                        │                              │
                        └──────────────────────────────┘
                              ▲           ▲
                    ┌─────────┴───┐  ┌────┴──────┐
                    │  Player 1   │  │  Player 2  │
                    │  (Mobile)   │  │  (Mobile)  │
                    │ Tap actions │  │ Tap actions│
                    └─────────────┘  └────────────┘
```

### Why This Architecture?

**Reactor Limitation**: Reactor LiveCore only supports a single video stream per session AND accepts text prompts only (no image input). This necessitates:

- A local multiplayer model where one device acts as the "host" and displays the shared video stream
- A **Visual Fingerprint Pipeline** to convert character images into rich text descriptions for Reactor
- Similar to Jackbox Games party game model

**AI Engine as Hub**: Every downstream system (video, voice, game state, player UI) consumes the same resolution output. If the engine produces inconsistent or vague output, everything breaks. The engine must produce tightly structured, coordinated output in a single pass.

### Technology Stack

#### Host Client (Desktop/Laptop)

- **Framework**: React with TypeScript
- **WebRTC**: Reactor JS SDK for video streaming
- **State**: Zustand for simple state management
- **WebSocket**: Native WebSocket or Socket.io client
- **UI**: Minimal - primarily video display + scoreboard

#### Player Client (Mobile)

- **Framework**: React with TypeScript (responsive mobile UI)
- **State**: Zustand
- **WebSocket**: Socket.io client for real-time communication
- **UI**: Tailwind CSS for mobile-optimized interface

#### Server

- **Runtime**: Node.js with TypeScript
- **WebSocket**: Socket.io (for room management)
- **HTTP**: Express for REST endpoints
- **State**: In-memory only (hackathon simplicity)
- **AI Integration**:
  - Mistral AI SDK (combat adjudication & action generation)
  - Reactor SDK (LiveCore video generation)
  - Decart API (AI image generation for characters)

#### Database

- **Database**: SQLite (via `better-sqlite3`)
- **Rationale**:
  - Zero configuration, file-based
  - Perfect for hackathon/local deployment
  - No external dependencies
  - Easy backup (just copy `game.db`)

#### AI Services

- **Mistral AI**: `mistral-large-latest` for combat resolution (the AI Engine), `mistral-medium-latest` for action choice generation, Pixtral/vision model for Visual Fingerprint generation
- **Reactor LiveCore**: Real-time video generation (text prompts only — no image input)
- **Decart**: AI image generation for characters (hackathon sponsor)
- **TTS Service**: Neocortex API for AI narrator voice generation (hackathon sponsor), with browser-native SpeechSynthesis as fallback

---

## The AI Engine (Orchestration Layer)

The AI Engine is the **single most important system** in Prompt Pugilists. It is the central brain that takes all inputs and produces all outputs for every downstream system in a single coordinated pass.

### Why This Matters

Every component in the game consumes the engine's output:

- **Reactor** needs a visually precise prompt with character fingerprints baked in
- **Voice Narrator** needs a dramatic, speakable script (not the same as the video prompt)
- **Game State** needs consistent HP changes, conditions, and event history
- **Player UI** needs the next round's 4 action choices ready immediately
- **Host Display** needs a text summary for the scoreboard

If any of these outputs are vague, inconsistent, or missing — the experience falls apart. A meandering video prompt produces abstract video. An inconsistent narrator script confuses the audience. Drifting battle state makes the whole thing feel random.

### Engine Input Contract

```typescript
interface EngineInput {
  // Battle context
  environment: string;
  battleState: BattleState;

  // Cumulative battle memory — everything that's happened so far
  // This is the engine's "memory" across stateless API calls
  battleSummary: string;

  // Player 1
  player1: {
    characterName: string;
    visualFingerprint: string; // Rich text description from Mistral vision
    currentHp: number;
    maxHp: number;
    condition: string;
    action: string; // The action they chose/typed this round
  };

  // Player 2
  player2: {
    characterName: string;
    visualFingerprint: string;
    currentHp: number;
    maxHp: number;
    condition: string;
    action: string;
  };

  // History
  previousEvents: string[];
  roundNumber: number;
}
```

### Engine Output Contract

```typescript
interface EngineOutput {
  // === FOR REACTOR (Video) ===
  videoPrompt: string;
  // MUST reference character visual fingerprints for consistency
  // MUST be 2-3 cinematic sentences focused on the KEY visual moment
  // MUST incorporate environment

  // === FOR NARRATOR (Voice) ===
  narratorScript: string;
  // Written to be SPOKEN ALOUD by a fight commentator
  // Dramatic, punchy, 3-5 sentences max
  // References characters by name
  // Describes what happened and the stakes
  // Different from videoPrompt — this is for ears, not eyes

  // === FOR GAME STATE ===
  player1HpChange: number;
  player2HpChange: number;
  newBattleState: BattleState;
  interpretation: string;

  // === FOR BATTLE MEMORY ===
  battleSummaryUpdate: string;
  // 2-3 sentence summary of THIS round's events
  // Server appends this to the running battleSummary after each round

  // === FOR DICE DRAMA ===
  diceRolls: DiceRoll[];

  // === FOR NEXT ROUND (Player UI) ===
  player1ActionChoices: string[]; // 4 tactical options for next round
  player2ActionChoices: string[]; // 4 tactical options for next round
  // Each choice: 1-2 sentences, specific to current battle state
  // Should offer variety: aggressive, defensive, creative, environmental

  // === FOR VICTORY (if applicable) ===
  isVictory: boolean;
  winnerId: string | null;
  victoryNarration: string | null; // Epic finale narrator script
}
```

### Engine System Prompt

```typescript
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

Each character has a detailed text description (their "visual fingerprint"). You MUST use specific visual details from these fingerprints in the videoPrompt so Reactor renders the characters consistently. Reference their clothing, colors, distinctive features, weapons, etc.

## VISUAL DEGRADATION

As fighters lose HP, their appearance MUST reflect the damage in the videoPrompt:
- **30-40 HP (Fresh)**: Character looks as described in fingerprint — pristine, confident, powerful
- **20-29 HP (Worn)**: Visible wear — torn clothing, sweat, dirt, scuffed armor, slightly hunched posture
- **8-19 HP (Battered)**: Serious damage — bleeding, limping, broken equipment, exhaustion visible, struggling to stand
- **1-9 HP (Desperate)**: Near collapse — barely standing, clothing in tatters, bloodied, one eye shut, using weapon as a crutch

Always layer these degradation details ON TOP of the character's visual fingerprint. The character should still be recognizable but visibly worse for wear.

## VIDEO PROMPT RULES

- 2-3 sentences, purely visual/cinematic
- ALWAYS include character visual details from fingerprints + degradation based on current HP
- Focus on the KEY dramatic moment of the clash
- Incorporate the battle environment
- Written for a video generation AI (describe what the camera SEES)

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

Generate 4 distinct tactical options for each player's NEXT round. Each choice: 1-2 sentences, specific to current battle state and character. Offer a natural spread of options:
- One aggressive/offensive move
- One defensive/protective move
- One creative/environmental move
- One high-risk high-reward gambit

Do NOT label them with categories — just write the action text. Keep them punchy and exciting.
Action choices must account for each player's current condition and HP level.

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

Return ONLY valid JSON matching the EngineOutput interface. No markdown, no preamble.
`;
```

### Engine Design Principles

1. **Single Pass, Full Output**: One LLM call produces everything. No chaining multiple calls per round.
2. **Output Tells One Story**: Every field must be narratively consistent with every other field.
3. **Fingerprints In, Consistency Out**: Character visual fingerprints go in, visually consistent video prompts come out.
4. **Visual Degradation**: Characters visually deteriorate as HP drops — pristine at full health, battered and desperate near death.
5. **Narrator ≠ Video**: The narrator script and video prompt serve different senses and must be written differently.
6. **Action Choices Are Reactive**: The 4 options for next round must reflect what just happened, not generic spell lists.
7. **Battle Summary Grows**: Each round appends to a cumulative summary, giving the engine full context on every call.

---

## Visual Fingerprint Pipeline

### The Problem

Reactor LiveCore accepts **text prompts only** — no image input. Characters are generated as images via Decart. Without a bridge, there's no way to make the video consistently represent the characters.

### The Solution

Generate a rich text-based "visual fingerprint" for each character by running their Decart image through Mistral's vision model. This fingerprint is then baked into every Reactor prompt.

### Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌────────────────┐
│  Player   │────►│  Decart  │────►│ Mistral      │────►│  Visual        │
│  Text     │     │  Image   │     │ Vision Model │     │  Fingerprint   │
│  Prompt   │     │  Gen     │     │ (Pixtral)    │     │  (stored text) │
└──────────┘     └──────────┘     └──────────────┘     └────────────────┘
                   512x512                                    │
                   image                                      ▼
                                                    Baked into every
                                                    Reactor video prompt
```

### Fingerprint Generation

```typescript
async function generateVisualFingerprint(
  characterImageUrl: string,
  characterName: string,
  originalTextPrompt: string,
): Promise<string> {
  const response = await mistral.chat.complete({
    model: "pixtral-large-latest",
    messages: [
      {
        role: "system",
        content: `You are a visual description specialist for a real-time video generation system. 
Your job is to produce an extremely detailed, specific text description of a character 
that a video AI can use to consistently render this character across many scenes.

Focus on: clothing details, colors, textures, body type, hair, distinctive features, 
weapons/accessories, magical effects, posture, and any unique visual identifiers.

Be SPECIFIC (not "wearing armor" but "wearing dark iron plate armor with gold trim 
and a wolf-head pauldron on the left shoulder").

Output: A single dense paragraph, 100-150 words. No preamble.`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            imageUrl: { url: characterImageUrl },
          },
          {
            type: "text",
            text: `Character name: ${characterName}\nOriginal description: ${originalTextPrompt}\n\nProduce a detailed visual fingerprint for this character.`,
          },
        ],
      },
    ],
    temperature: 0.3, // Low temp for precision
    maxTokens: 300,
  });

  return response.choices[0].message.content!.trim();
}
```

### Storage

The visual fingerprint is stored alongside the character and loaded into battle state at character selection time.

```typescript
interface Character {
  id: string;
  name: string;
  imageUrl: string;
  textPrompt: string;
  referenceImageUrl: string | null;
  visualFingerprint: string; // Mistral-generated description, cached on server
  createdAt: Date;
  updatedAt: Date;
}
```

### When Fingerprints Are Generated

- **On character creation**: After Decart generates the image, automatically run it through Mistral vision
- **On regeneration**: New image → new fingerprint
- **Cached**: Only regenerated when the image changes

---

## Real-Time AI Voice Narration

### The Problem

The Reactor video is visually interesting but abstract — players and spectators can't easily tell what's happening. Text on screen is too slow to read during an exciting battle. The experience needs a voice.

### The Solution

An AI fight narrator that reads the `narratorScript` from each round's engine output. This is the primary feedback mechanism — more immediate and dramatic than text, and gives meaning to the video.

### Architecture

```
Engine Output             Neocortex API          Host Speaker
─────────────             ─────────────          ────────────
narratorScript  ──────►  /audio/generate  ──────►  Audio plays
(3-5 sentences)          (binary audio)           over video
```

### Neocortex Integration

Neocortex is a hackathon sponsor offering a voice generation API. We create a "character" (the fight announcer) in the Neocortex dashboard, configure its voice, and then hit the `/audio/generate` endpoint each round with the narrator script.

**Setup**:

1. Create a Neocortex project/character for the announcer in the dashboard
2. Configure voice style (dramatic, energetic fight commentator)
3. Grab the `characterId` and API key

### Implementation

Two options — for hackathon speed, **Option A (client-side)** is recommended.

#### Option A: Host Client Calls Neocortex Directly (Recommended for Hackathon)

The server sends the narrator script text to the host client. The host client calls Neocortex and plays the audio directly. Simpler, fewer hops, no binary WebSocket complexity.

**Server** (just forwards the text):

```typescript
// In processBattleRound, after engine resolves:
io.to(hostSocketId).emit("battle:narrator_audio", {
  narratorScript: engineOutput.narratorScript,
});
```

**Host Client** (calls Neocortex + plays audio):

```typescript
// Based on confirmed working Neocortex example code
import { useState, useCallback } from "react";

// Neocortex config (safe to expose for hackathon demo)
const NEOCORTEX_API_KEY = import.meta.env.VITE_NEOCORTEX_API_KEY;
const NEOCORTEX_CHARACTER_ID = import.meta.env.VITE_NEOCORTEX_CHARACTER_ID;

function useNarrator() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const narrate = useCallback(async (script: string) => {
    setLoading(true);
    setAudioUrl(null);

    try {
      const response = await fetch(
        "https://neocortex.link/api/v2/audio/generate",
        {
          method: "POST",
          headers: {
            "x-api-key": NEOCORTEX_API_KEY,
          },
          body: JSON.stringify({
            characterId: NEOCORTEX_CHARACTER_ID,
            message: script,
          }),
        },
      );

      // Response is binary audio data
      const blob = await response.blob();
      const url = URL.createObjectURL(audioUrl);
      setAudioUrl(url);

      // Auto-play
      const audio = new Audio(url);
      await audio.play();
    } catch (err) {
      console.error("Neocortex failed, falling back to browser TTS:", err);
      // Browser SpeechSynthesis fallback
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = 1.1;
      utterance.pitch = 0.9;
      speechSynthesis.speak(utterance);
    } finally {
      setLoading(false);
    }
  }, []);

  return { narrate, audioUrl, loading };
}

// Usage in HostBattle component:
const { narrate } = useNarrator();

socket.on("battle:narrator_audio", (data) => {
  narrate(data.narratorScript);
});
```

### Timing

The narrator script plays WHILE the Reactor video is generating/playing. Ideally:

1. Engine resolves → produces narratorScript + videoPrompt
2. **Simultaneously**: Neocortex generates audio AND Reactor generates video
3. Audio begins playing on host as video renders
4. By the time narration finishes (~5-8 seconds), video is showing the action

### Narrator Voice Direction

The narrator is a **Champions League-style British sports commentator** — think Martin Tyler meets a fantasy dungeon master. Set up the Neocortex announcer character with this energy:

- British English phrasing and idioms ("What a strike!", "He's absolutely done him there")
- Builds genuine excitement, rising energy as HP gets low
- Occasionally cheeky or witty ("Well, that's one way to say hello")
- References characters by name, always
- Acknowledges clever plays with genuine appreciation
- As fights get desperate, the commentary gets more urgent and breathless
- NO cringeworthy gaming tropes — no "CRITICAL HIT!", no "COMBO BREAKER!", no anime announcer energy
- Think sports broadcast, not esports

---

## Data Models

### Character Schema

```typescript
interface Character {
  id: string;
  name: string;

  // Single character image (generated by Decart)
  imageUrl: string;

  // Inputs used for generation (can be updated and regenerated)
  textPrompt: string; // "A fire mage with red robes and glowing hands"
  referenceImageUrl: string | null; // Optional uploaded image for reference

  // Visual Fingerprint (generated by Mistral vision from Decart image)
  // Cached on server at creation time for instant battle lookups
  visualFingerprint: string;

  createdAt: Date;
  updatedAt: Date;
}
```

**Design Philosophy**: Characters belong to a **shared pool** — when anyone creates a character, it's available for all players to pick. This means:

- No user ownership — any player can select any character for battle
- Visual fingerprints are cached on the server at creation time, so battles start instantly
- The pool grows organically as people play
- Pre-made starter characters live in the same pool

All characters have the same HP (40). Combat is entirely based on player creativity and AI interpretation. The visual fingerprint bridges the gap between Decart's image output and Reactor's text-only input.

### Room Schema

```typescript
interface Room {
  id: string; // 6-char alphanumeric code (e.g., "A3K9ZX")
  hostConnectionId: string;

  players: {
    player1: PlayerConnection | null;
    player2: PlayerConnection | null;
  };

  state:
    | "waiting"
    | "environment_select"
    | "character_select"
    | "battle"
    | "completed";

  // Battle environment (set by host)
  environment: string | null; // "A volcanic arena with lava flows" or "An ancient library filled with mystical tomes"

  battle: Battle | null;

  createdAt: Date;
  expiresAt: Date; // Auto-cleanup after 2 hours
}

interface PlayerConnection {
  connectionId: string;
  playerId: string; // User ID or session ID
  username: string;
  characterId: string | null;
  ready: boolean;
}
```

### Battle Schema

```typescript
interface Battle {
  id: string;
  roomId: string;

  player1: BattlePlayer;
  player2: BattlePlayer;

  // Current state
  currentState: BattleState;

  // Action tracking
  pendingActions: {
    player1: PendingAction | null;
    player2: PendingAction | null;
  };

  // Current action choices available to each player
  // Generated by the engine at the end of each round, sent via WebSocket
  currentActionChoices: {
    player1: string[]; // 4 options for player 1
    player2: string[]; // 4 options for player 2
  };

  // Resolution history (for debugging/replay)
  resolutionHistory: BattleResolution[];

  // Victory
  winnerId: string | null;
  winCondition: "hp_depleted" | "forfeit" | null;

  createdAt: Date;
  completedAt: Date | null;
}
```

#### Battle Player

```typescript
interface BattlePlayer {
  playerId: string;
  character: Character;

  // Fixed HP for all characters
  currentHp: number; // Starts at 40
  maxHp: number; // Always 40
}
```

#### Battle State (Narrative-Driven)

```typescript
interface BattleState {
  // Freeform narrative state of the battle
  environmentDescription: string;
  // Example: "The arena is filled with smoke and crackling energy"

  player1Condition: string;
  // Example: "Zara is breathing heavily, her robes singed"

  player2Condition: string;
  // Example: "Mordak's shield shimmers, but he's wounded"

  // History of what's happened (event list)
  previousEvents: string[];
  // Example: ["Zara cast a fireball", "Mordak deflected with ice shield", ...]

  // Cumulative battle summary — grows each round
  // This is the KEY "memory" that ensures Mistral doesn't lose context
  // across stateless API calls. The engine appends to this after every round.
  battleSummary: string;
  // Example: "Round 1: Zara opened with a flame wall, Mordak countered with
  // an ice shield. Both took moderate damage. Round 2: Zara pulled lava from
  // the floor while Mordak shattered his shield into projectiles. Mordak is
  // now critically wounded and visibly exhausted."
}
```

**Battle Memory**: The `battleSummary` is the critical "memory" field. Each Mistral API call is stateless — no conversation history. This growing summary is the ONLY way the engine knows what happened in previous rounds. It's fed directly into the engine's input context, and the engine produces a `battleSummaryUpdate` each round that the server appends to the running summary.

#### Pending Action

```typescript
interface PendingAction {
  actionText: string; // Pure natural language
  submittedAt: Date;
  // No actionType, targetSpellId, etc. - AI interprets everything
}
```

#### Battle Resolution

```typescript
interface BattleResolution {
  // Player actions submitted
  player1Action: string;
  player2Action: string;

  // AI interpretation & results
  interpretation: string; // What the AI understood the players wanted

  // State changes (simple)
  player1HpChange: number; // negative = damage, positive = heal
  player2HpChange: number;

  // Updated world state
  newBattleState: BattleState;

  // === VIDEO ===
  videoPrompt: string; // The prompt sent to Reactor (includes visual fingerprints)

  // === VOICE NARRATION ===
  narratorScript: string; // Fight commentator script, spoken aloud via TTS

  // === NEXT ROUND ACTION CHOICES ===
  player1ActionChoices: string[]; // 4 tactical options for player 1's next round
  player2ActionChoices: string[]; // 4 tactical options for player 2's next round

  // === BATTLE MEMORY ===
  battleSummaryUpdate: string; // 2-3 sentence summary of this round, appended to cumulative summary

  // Dice rolls (for transparency/drama)
  diceRolls: DiceRoll[];

  // Victory
  isVictory: boolean;
  winnerId: string | null;
  victoryNarration: string | null; // Epic finale narrator script

  timestamp: Date;
}
```

#### Dice Roll

```typescript
interface DiceRoll {
  player: "player1" | "player2";
  purpose: string; // Freeform: "attack roll", "dodge check", "willpower save"
  formula: string; // "1d20+5", "3d6+3"
  result: number;
  modifier: number;
}
```

---

## Client Architecture

### 3 Client Types

#### 1. Host Client (Desktop - Video + Voice Display)

**URL**: `/host/:roomId`

```
┌─────────────────────────────────────────────────┐
│  Room Code: A3K9ZX             Round: 3         │
├────────────────┬────────────────────────────────┤
│  Zara          │          Mordak                │
│  HP: 30/40 ▓▓▓▓▓▓▓░░░                           │
│                │          HP: 22/40 ▓▓▓▓▓░░░░░ │
├────────────────┴────────────────────────────────┤
│                                                  │
│        [Reactor Video Feed - 1280x720]          │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  🎙️ "Zara's lightning bolt struck true! Mordak  │
│  staggers back, his ice shield shattered into   │
│  a thousand pieces. Can he survive another—"    │
│                                                  │
│  🎲 Zara: 18 (attack) | Mordak: 12 (defense)   │
│                                                  │
│  Waiting for players to submit actions...       │
└──────────────────────────────────────────────────┘
```

**Features**:

- Display Reactor video stream
- **AI voice narration** playing over video (fight commentator)
- Show player HP/status with character images
- Display dice rolls for drama/transparency
- Narrator transcript shown as subtitles
- Room code prominently displayed
- Minimal interaction (spectator view)

#### 2. Player Client (Mobile - Control)

**URL**: `/play/:roomId`

**Battle View (Primary)**

```
┌─────────────────────────────────────┐
│ ┌───────┐                           │
│ │ char  │ Character Name    15/20   │
│ │  img  │ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░   │
│ └───────┘                           │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────┐ ┌─────────────┐ │
│  │               │ │             │ │
│  │               │ │             │ │
│  │   Option 1    │ │  Option 2   │ │
│  │               │ │             │ │
│  │               │ │             │ │
│  └───────────────┘ └─────────────┘ │
│                                     │
│  ┌───────────────┐ ┌─────────────┐ │
│  │               │ │             │ │
│  │               │ │             │ │
│  │   Option 3    │ │  Option 4   │ │
│  │               │ │             │ │
│  │               │ │             │ │
│  └───────────────┘ └─────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  ┌──────────────────────────┐ ┌──┐ │
│  │ Type your own move...    │ │➤ │ │
│  └──────────────────────────┘ └──┘ │
└─────────────────────────────────────┘
```

**Layout Breakdown**:

- **Header bar**: Character thumbnail (small square, Decart image), character name, HP as fraction (e.g. `15/20`), HP bar beneath
- **2×2 action grid**: 4 large tappable cards filling the main screen area. Each card contains the AI-generated action text (1-2 sentences). Cards are tall enough to be easy fat-finger targets on mobile.
- **Bottom bar**: Text input field ("Type your own move...") with a send button (➤) on the right. The 4 cards above are AI-generated suggestions — this input lets the player say exactly what they want instead.

**Interaction Flow**:

1. Round starts → server sends `battle:request_actions` with 4 action choices
2. Player client renders the 4 cards from the received choices
3. Player taps one of the 4 cards → action submitted immediately (actionSource: 'button')
4. OR player types in the bottom text input → taps send → action submitted (actionSource: 'freeform')
5. Card highlights on selection, all inputs gray out after submission
6. Wait for opponent + engine resolution
7. Next round: new `battle:request_actions` event arrives → cards refresh with new choices

**Features**:

- **4 action cards** as primary input (generated by AI Engine each round)
- Cards are large, visual, and easy to tap — inspired by TV remote / game controller simplicity
- **Text input + send button** at the bottom for players who want to write their own move
- **Character thumbnail** — the Decart-generated image, keeps the player connected to their character
- **HP fraction + bar** — compact, clear health status at a glance
- Action cards are contextual: they react to what just happened in the battle
- No labels like "Aggressive/Defensive" on the cards — just the action text. Keep it clean.

### Action Choices Data Flow

The complete lifecycle of how action choices get from the engine to the player's screen:

```
Engine Output                    Server                           Player Client
─────────────                    ──────                           ─────────────
player1ActionChoices ──►  stored on battle.              ──►  battle:request_actions
player2ActionChoices      currentActionChoices                  { actionChoices: [...] }
                                                                      │
                                                                      ▼
                                                               Render 4 cards
                                                               in 2×2 grid
                                                                      │
                                                          Player taps card OR types
                                                                      │
                                                                      ▼
                                                               battle:action
                                                          { actionText, actionSource }
```

**Round 1 (Initial Choices)**: Before the first engine call, there's no previous engine output to pull choices from. Generate initial choices with a lightweight Mistral call:

```typescript
// Called once when battle starts, before Round 1
async function generateInitialActionChoices(
  character: Character,
  opponent: Character,
  environment: string,
): Promise<string[]> {
  const response = await mistral.chat.complete({
    model: "mistral-medium-latest",
    messages: [
      {
        role: "system",
        content: `Generate 4 opening battle actions for a character. Return ONLY a JSON object with an "actions" key containing an array of 4 strings, each 1-2 sentences. Include: one aggressive, one defensive, one creative, one wild gambit. No category labels.`,
      },
      {
        role: "user",
        content: `Character: ${character.name} (${character.visualFingerprint})\nOpponent: ${opponent.name} (${opponent.visualFingerprint})\nEnvironment: ${environment}`,
      },
    ],
    responseFormat: { type: "json_object" },
    temperature: 0.9,
    maxTokens: 400,
  });

  return JSON.parse(response.choices[0].message.content!).actions;
}

// On battle start:
const [p1Choices, p2Choices] = await Promise.all([
  generateInitialActionChoices(
    battle.player1.character,
    battle.player2.character,
    environment,
  ),
  generateInitialActionChoices(
    battle.player2.character,
    battle.player1.character,
    environment,
  ),
]);

battle.currentActionChoices = { player1: p1Choices, player2: p2Choices };

// Send to each player
io.to(getPlayerSocket(battle.player1.playerId)).emit("battle:request_actions", {
  timeLimit: 20,
  actionChoices: p1Choices,
});
io.to(getPlayerSocket(battle.player2.playerId)).emit("battle:request_actions", {
  timeLimit: 20,
  actionChoices: p2Choices,
});
```

**Rounds 2+**: The engine produces `player1ActionChoices` and `player2ActionChoices` as part of its standard output. These are stored on `battle.currentActionChoices` and sent automatically at the end of `processBattleRound`.

#### 3. Landing Page

**URL**: `/`

```
┌─────────────────────────────────────┐
│  MAGE BATTLE                        │
│                                     │
│  [Host Game]                        │
│                                     │
│  OR                                 │
│                                     │
│  Enter Room Code:                   │
│  ┌─────┐                            │
│  │     │  [Join Game]               │
│  └─────┘                            │
│                                     │
│  [Characters]                        │
└─────────────────────────────────────┘
```

#### 4. Host Environment Selection (`/host/environment`)

**URL**: `/host/environment` (after creating room)

```
┌─────────────────────────────────────┐
│  ⬅ Back       Set Battle Arena      │
├─────────────────────────────────────┤
│  Describe the battle environment:   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ A volcanic arena with rivers  │ │
│  │ of molten lava crisscrossing  │ │
│  │ the obsidian floor           │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│  Characters: 89/300                 │
│                                     │
│  Or choose a preset:                │
│  [🌋 Volcanic Arena]                │
│  [🏛️ Ancient Temple]                │
│  [🌲 Enchanted Forest]              │
│  [🏰 Ruined Castle]                 │
│  [⚡ Storm Peak]                    │
│  [🌊 Floating Islands]              │
│                                     │
│  [Continue to Room Code]            │
└─────────────────────────────────────┘
```

**Features**:

- **Freeform text input** for custom environments (300 char limit)
- **Preset options** for quick selection
- Environment is used as context for all battle descriptions

### Character Management UI

#### Gallery View (`/characters`)

```
┌─────────────────────────────────────┐
│  ⬅ Back       Character Pool        │
├─────────────────────────────────────┤
│  [+ Create New Character]           │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ [IMG]   │  │ [IMG]   │          │
│  │ Zara    │  │ Mordak  │          │
│  │ Fire    │  │ Ice     │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ [IMG]   │  │ [IMG]   │          │
│  │ Luna    │  │ Gorath  │          │
│  │ Healing │  │ Necro   │          │
│  └─────────┘  └─────────┘          │
│                                     │
└─────────────────────────────────────┘
```

#### Character Creation (`/characters/create`)

```
┌─────────────────────────────────────┐
│  ⬅ Cancel      Create Character     │
├─────────────────────────────────────┤
│  Character Name:                    │
│  ┌───────────────────────────────┐ │
│  │ Zara the Pyromancer           │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  Character Preview                  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │     [Character Image]         │ │
│  │      (512x512)                │ │
│  │                               │ │
│  │  [Generated by Decart AI]     │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  Describe your character:           │
│  ┌───────────────────────────────┐ │
│  │ A fierce fire mage wearing    │ │
│  │ crimson robes with glowing    │ │
│  │ embers swirling around her    │ │
│  │ hands                         │ │
│  └───────────────────────────────┘ │
│  Characters: 87/500                 │
│                                     │
│  Reference Image (optional):        │
│  [📎 Upload Image] or drag here     │
│  [No image uploaded]                │
│                                     │
│  💡 Combine text + image for best   │
│  results!                           │
│                                     │
│  [🔄 Regenerate Character]          │
│                                     │
├─────────────────────────────────────┤
│  [Save Character]                   │
└─────────────────────────────────────┘
```

**Character Creation Features:**

- **Name input**: Character's display name
- **Single character image**: Generated by Decart AI
- **Text prompt**: 500 character description
- **Reference image upload**: Optional image input for Decart
- **Regenerate button**: Uses same inputs to generate a new variation
- **No stats, no equipment slots, no tags**: Pure simplicity!

**Workflow**:

1. User enters name
2. User writes text description and/or uploads reference image
3. User clicks "Regenerate Character"
4. Decart API generates character image
5. Image displays in preview
6. User can regenerate for variations or save when satisfied

**Technical Notes**:

- Decart API accepts: text prompt + optional reference image
- Store both inputs so user can regenerate later
- Each regeneration creates a new image URL

### Navigation Flow

```
Landing (/)
  │
  ├─> [Host Game] → Environment Selection (/host/environment)
  │                   │
  │                   └─> Host Setup (/host)
  │                         │
  │                         └─> Host Display (/host/:roomId)
  │
  ├─> [Join Game] → Enter Code (/join)
  │                   │
  │                   └─> Character Select (/play/:roomId/select)
  │                         │  (browse shared character pool)
  │                         │
  │                         └─> Battle UI (/play/:roomId)
  │
  └─> [Characters] → Character Pool (/characters)
                        │
                        └─> Create Character (/characters/create)
                              (adds to shared pool, fingerprint cached)
```

---

## Server Architecture

### Core Modules

#### 1. Room Manager

```typescript
class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(hostConnectionId: string): Room {
    const roomId = generateRoomCode(); // 6-char alphanumeric
    const room: Room = {
      id: roomId,
      hostConnectionId,
      players: { player1: null, player2: null },
      state: "waiting",
      battle: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, connectionId: string, username: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (!room.players.player1) {
      room.players.player1 = {
        connectionId,
        playerId: generateId(),
        username,
        characterId: null,
        ready: false,
      };
    } else if (!room.players.player2) {
      room.players.player2 = {
        connectionId,
        playerId: generateId(),
        username,
        characterId: null,
        ready: false,
      };
    } else {
      return false; // Room full
    }

    return true;
  }

  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!(room?.players.player1 && room?.players.player2);
  }
}
```

#### 2. Reactor Manager

```typescript
class ReactorManager {
  private reactor: Reactor;
  private roomId: string;
  private currentFrame: number = 0;

  async initialize(jwtToken: string) {
    this.reactor = new Reactor({ modelName: "livecore" });

    // Listen for state updates
    this.reactor.on("newMessage", (msg) => {
      if (msg.type === "state") {
        this.currentFrame = msg.data.current_frame;
        // Broadcast to host client
        io.to(this.roomId).emit("reactor:state", {
          currentFrame: this.currentFrame,
          currentPrompt: msg.data.current_prompt,
          paused: msg.data.paused,
        });
      }

      if (msg.type === "event") {
        console.log("Reactor event:", msg.data);
      }
    });

    await this.reactor.connect(jwtToken);
  }

  async scheduleRound(prompt: string, timestamp: number) {
    await this.reactor.sendCommand("schedule_prompt", {
      new_prompt: prompt,
      timestamp,
    });
  }

  async start() {
    await this.reactor.sendCommand("start", {});
  }

  async reset() {
    await this.reactor.sendCommand("reset", {});
    this.currentFrame = 0;
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.reactor.getVideoTrack();
  }
}
```

#### 3. Decart Character Generator + Visual Fingerprint

```typescript
class DecartManager {
  private apiKey: string;

  async generateCharacter(
    textPrompt: string,
    referenceImageUrl?: string,
  ): Promise<{ imageUrl: string; visualFingerprint: string }> {
    // Step 1: Generate image via Decart
    const formData = new FormData();
    formData.append("prompt", textPrompt);

    if (referenceImageUrl) {
      const imageResponse = await fetch(referenceImageUrl);
      const imageBlob = await imageResponse.blob();
      formData.append("reference_image", imageBlob);
    }

    const response = await fetch("https://api.decart.ai/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    const result = await response.json();
    const imageUrl = result.image_url;

    // Step 2: Generate visual fingerprint via Mistral vision
    const visualFingerprint = await generateVisualFingerprint(
      imageUrl,
      "", // characterName not known yet at this point
      textPrompt,
    );

    return { imageUrl, visualFingerprint };
  }

  async regenerateCharacter(
    character: Character,
  ): Promise<{ imageUrl: string; visualFingerprint: string }> {
    return this.generateCharacter(
      character.textPrompt,
      character.referenceImageUrl || undefined,
    );
  }
}
```

#### 4. Battle Manager

Handles battle lifecycle, action submission, and victory conditions.

```typescript
async function processBattleRound(
  roomId: string,
  battle: Battle,
  action1: string,
  action2: string,
) {
  // 1. Notify resolving
  io.to(roomId).emit("battle:resolving", {});

  // 2. Build engine input with visual fingerprints + battle memory
  const engineInput: EngineInput = {
    environment: battle.currentState.environmentDescription,
    battleState: battle.currentState,
    battleSummary: battle.currentState.battleSummary || "",
    player1: {
      characterName: battle.player1.character.name,
      visualFingerprint: battle.player1.character.visualFingerprint,
      currentHp: battle.player1.currentHp,
      maxHp: battle.player1.maxHp,
      condition: battle.currentState.player1Condition,
      action: action1,
    },
    player2: {
      characterName: battle.player2.character.name,
      visualFingerprint: battle.player2.character.visualFingerprint,
      currentHp: battle.player2.currentHp,
      maxHp: battle.player2.maxHp,
      condition: battle.currentState.player2Condition,
      action: action2,
    },
    previousEvents: battle.currentState.previousEvents,
    roundNumber: battle.resolutionHistory.length + 1,
  };

  // 3. Single AI Engine call — produces ALL outputs
  const engineOutput = await runEngine(engineInput);

  // 4. Apply HP changes
  battle.player1.currentHp = Math.max(
    0,
    Math.min(
      battle.player1.currentHp + engineOutput.player1HpChange,
      battle.player1.maxHp,
    ),
  );
  battle.player2.currentHp = Math.max(
    0,
    Math.min(
      battle.player2.currentHp + engineOutput.player2HpChange,
      battle.player2.maxHp,
    ),
  );

  // 5. Update battle state + grow battle memory
  battle.currentState = engineOutput.newBattleState;
  const roundLabel = `Round ${battle.resolutionHistory.length + 1}`;
  battle.currentState.battleSummary =
    (battle.currentState.battleSummary || "") +
    `\n${roundLabel}: ${engineOutput.battleSummaryUpdate}`;

  // Build full resolution record
  const resolution: BattleResolution = {
    player1Action: action1,
    player2Action: action2,
    ...engineOutput,
    timestamp: new Date(),
  };
  battle.resolutionHistory.push(resolution);

  // 6. Check victory
  if (
    engineOutput.isVictory ||
    battle.player1.currentHp <= 0 ||
    battle.player2.currentHp <= 0
  ) {
    const winnerId =
      battle.player1.currentHp <= 0
        ? battle.player2.playerId
        : battle.player1.playerId;

    battle.winnerId = winnerId;
    battle.winCondition = "hp_depleted";
    battle.completedAt = new Date();

    await saveBattle(battle);

    // Narrate the victory (host will call Neocortex)
    const victoryScript =
      engineOutput.victoryNarration || engineOutput.narratorScript;

    io.to(hostSocketId).emit("battle:narrator_audio", {
      narratorScript: victoryScript,
    });

    io.to(roomId).emit("battle:end", {
      winnerId,
      battle,
      finalResolution: resolution,
    });

    return;
  }

  // 7. PARALLEL: Schedule Reactor video + Send narrator script to host
  // (Host client calls Neocortex directly for audio generation)
  const reactorManager = getReactorManager(roomId);

  await reactorManager.scheduleRound(
    engineOutput.videoPrompt,
    reactorManager.currentFrame,
  );

  // 8. Send narrator script to host (host will call Neocortex + play audio)
  io.to(hostSocketId).emit("battle:narrator_audio", {
    narratorScript: engineOutput.narratorScript,
  });

  // 9. Broadcast resolution
  io.to(roomId).emit("battle:round_complete", {
    battle,
    resolution,
  });

  // 10. Clear pending actions
  battle.pendingActions = { player1: null, player2: null };

  // 11. Store action choices on battle + send to each player individually
  battle.currentActionChoices = {
    player1: engineOutput.player1ActionChoices,
    player2: engineOutput.player2ActionChoices,
  };

  // Each player only sees THEIR OWN choices
  io.to(getPlayerSocket(battle.player1.playerId)).emit(
    "battle:request_actions",
    {
      timeLimit: 20,
      actionChoices: engineOutput.player1ActionChoices,
    },
  );

  io.to(getPlayerSocket(battle.player2.playerId)).emit(
    "battle:request_actions",
    {
      timeLimit: 20,
      actionChoices: engineOutput.player2ActionChoices,
    },
  );
}

function checkVictory(battle: Battle): string | null {
  if (battle.player1.currentHp <= 0) return battle.player2.playerId;
  if (battle.player2.currentHp <= 0) return battle.player1.playerId;
  return null;
}

// Action choices: generated by the AI Engine as part of every round.
// For Round 1 initial choices, see "Action Choices Data Flow" in Client Architecture.
```

---

## Combat Resolution

### AI Engine Integration

The `runEngine` function is the single LLM call that produces all outputs per round.

```typescript
async function runEngine(input: EngineInput): Promise<EngineOutput> {
  const prompt = buildEnginePrompt(input);

  const response = await mistral.chat.complete({
    model: "mistral-large-latest",
    messages: [
      {
        role: "system",
        content: ENGINE_SYSTEM_PROMPT, // Defined in AI Engine section above
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    responseFormat: { type: "json_object" },
    temperature: 0.8,
  });

  const output: EngineOutput = JSON.parse(response.choices[0].message.content!);

  return output;
}
```

### System Prompt

> The ENGINE_SYSTEM_PROMPT is defined in the [AI Engine section](#the-ai-engine-orchestration-layer) above. It produces ALL outputs (video prompt, narrator script, HP changes, action choices) in a single coordinated pass.

### Context Prompt Builder

```typescript
function buildEnginePrompt(input: EngineInput): string {
  return `
## Current Battle State — Round ${input.roundNumber}

**Environment:** ${input.environment}

### Battle Summary So Far
${input.battleSummary || "This is the opening round. No previous events."}

### Player 1: ${input.player1.characterName}
- HP: ${input.player1.currentHp}/${input.player1.maxHp}
- Visual Fingerprint: ${input.player1.visualFingerprint}
- Condition: ${input.player1.condition}

### Player 2: ${input.player2.characterName}
- HP: ${input.player2.currentHp}/${input.player2.maxHp}
- Visual Fingerprint: ${input.player2.visualFingerprint}
- Condition: ${input.player2.condition}

### Previous Events
${input.previousEvents.map((e, i) => \`\${i + 1}. \${e}\`).join("\\n")}

## This Round's Actions

**${input.player1.characterName} declares:** "${input.player1.action}"

**${input.player2.characterName} declares:** "${input.player2.action}"

---

Resolve these actions simultaneously. Use the visual fingerprints to write a visually specific videoPrompt — remember, as fighters lose HP they should visually show it (torn clothing, exhaustion, injuries). Write the narratorScript as an excited British Champions League-style commentator. Generate 4 action choices per player for the next round. Include a battleSummaryUpdate (2-3 sentences summarizing this round).

Return your response as JSON matching the EngineOutput interface.
`;
}
```

---

## API Specifications

### REST Endpoints

```
// Character pool (shared across all players)
POST   /api/characters                    - Create character (adds to shared pool)
GET    /api/characters                    - List all characters in pool
GET    /api/characters/:id                - Get character details (includes cached fingerprint)
DELETE /api/characters/:id                - Remove character from pool

// Room/Battle
POST   /api/rooms                         - Create room
GET    /api/rooms/:id                     - Get room info
GET    /api/battles/:id                   - Get battle data
```

### WebSocket Events

#### Client → Server

```typescript
// Room management
{
  type: 'room:create',
  username: string,
  environment: string  // Battle arena description
}

{
  type: 'room:join',
  roomId: string,
  username: string
}

// Character selection (from shared pool — characters created via REST)
{
  type: 'character:select',
  roomId: string,
  characterId: string
}

{
  type: 'player:ready',
  roomId: string
}

// Battle
{
  type: 'battle:action',
  roomId: string,
  actionText: string,  // Either a button choice or freeform text (500 char max)
  actionSource: 'button' | 'freeform'  // Track how players are playing
}

{
  type: 'battle:forfeit',
  roomId: string
}
```

#### Server → Client

```typescript
// Room events
{
  type: 'room:created',
  roomId: string,
  room: Room
}

{
  type: 'room:player_joined',
  player: PlayerConnection,
  playerSlot: 'player1' | 'player2'
}

{
  type: 'room:full'
}

{
  type: 'character:selected',
  playerId: string,
  character: Character
}

// Battle events
{
  type: 'battle:start',
  battle: Battle
}

{
  type: 'reactor:track',
  track: MediaStreamTrack  // To host only
}

{
  type: 'battle:request_actions',
  timeLimit: number,
  // 4 AI-generated action choices for THIS player only
  // Sent individually per player — player 1 and player 2 get different choices
  actionChoices: string[]  // Array of 4 action strings
}

{
  type: 'battle:action_received',
  playerId: string
}

{
  type: 'battle:resolving'
}

{
  type: 'battle:round_complete',
  battle: Battle,
  resolution: BattleResolution
}

{
  type: 'battle:narrator_audio',
  narratorScript: string  // Host client calls Neocortex API directly to generate audio
}

{
  type: 'reactor:state',
  currentFrame: number,
  currentPrompt: string | null,
  paused: boolean
}

{
  type: 'battle:end',
  winnerId: string,
  battle: Battle,
  finalResolution: BattleResolution
}
```

---

## Database Schema

### SQLite Schema

```sql
-- Characters (shared pool — no user ownership)
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,

  -- Single generated image
  image_url TEXT NOT NULL,

  -- Generation inputs (for regeneration)
  text_prompt TEXT NOT NULL,           -- 500 char description
  reference_image_url TEXT,            -- Optional reference image

  -- Visual Fingerprint (Mistral vision output from Decart image)
  -- Cached at creation time for instant battle lookups
  visual_fingerprint TEXT NOT NULL DEFAULT '',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Room history
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  player1_id TEXT,
  player2_id TEXT,
  winner_id TEXT,
  win_condition TEXT,  -- 'hp_depleted' or 'forfeit'
  environment TEXT,    -- Battle arena description
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Battles (full serialized state)
CREATE TABLE battles (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  battle_data TEXT NOT NULL,  -- JSON serialized Battle object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Indexes
CREATE INDEX idx_rooms_created_at ON rooms(created_at);
CREATE INDEX idx_battles_room_id ON battles(room_id);
```

---

## Example Battle Flow

### Setup

**Characters:**

- **Player 1 (Zara)**: Fire mage, 40 HP (visual fingerprint: "A fierce woman with flowing crimson robes, embers orbiting her outstretched hands, amber eyes glowing with inner fire, copper-red hair swept back in braids interwoven with glowing threads...")
- **Player 2 (Mordak)**: Ice mage, 40 HP (visual fingerprint: "A tall gaunt man in frost-blue layered robes with crystalline shoulder guards, wielding a gnarled staff topped with a pulsing ice crystal, pale skin with blue veins visible at the temples...")

**Initial State:**

```json
{
  "environmentDescription": "A mystical arena crackling with arcane energy",
  "player1Condition": "Zara stands ready, flames dancing on her fingertips",
  "player2Condition": "Mordak grips his staff, frost spreading at his feet",
  "previousEvents": []
}
```

### Round 1

**Player 1 Input:**

```
"I summon a massive wall of flames between us and advance forward, using it as cover!"
```

**Player 2 Input:**

```
"I create a shield of ice around myself and launch icicle shards through their fire wall!"
```

**Mistral AI Resolution:**

```json
{
  "interpretation": "Player 1 creates fire barrier and advances. Player 2 uses ice shield and launches counter-attack through flames.",

  "player1HpChange": -8,
  "player2HpChange": -5,

  "newBattleState": {
    "environmentDescription": "A towering wall of flames divides the arena, steam billowing where ice meets fire",
    "player1Condition": "Zara advances confidently behind her fire wall, but icicles have pierced her left shoulder",
    "player2Condition": "Mordak is encased in a shimmering ice barrier, but the heat is making it crack",
    "previousEvents": [
      "Zara erected flame wall",
      "Mordak cast ice shield",
      "Mordak launched icicle barrage",
      "Several icicles penetrated flame wall, striking Zara"
    ]
  },

  "videoPrompt": "A towering wall of roaring flames erupts across the arena as Zara steps forward. Mordak raises his hands and a crystalline ice shield materializes around him, reflecting the firelight. He thrusts his palms forward and a volley of razor-sharp icicles shoots through the flames, several finding their mark and striking Zara's shoulder.",

  "diceRolls": [
    {
      "player": "player1",
      "purpose": "flame wall creation",
      "formula": "1d20+6",
      "result": 16,
      "modifier": 6
    },
    {
      "player": "player2",
      "purpose": "ice shield defense",
      "formula": "1d20+5",
      "result": 14,
      "modifier": 5
    },
    {
      "player": "player2",
      "purpose": "icicle attack",
      "formula": "1d20+4",
      "result": 17,
      "modifier": 4
    },
    {
      "player": "player2",
      "purpose": "icicle damage",
      "formula": "2d6+3",
      "result": 11,
      "modifier": 3
    }
  ]
}
```

**Updated State:**

- Player 1 (Zara): 60 → 52 HP
- Player 2 (Mordak): 80 → 75 HP

**Reactor Scheduled:**

```
Frame 0: "A towering wall of roaring flames erupts across the arena as Zara steps forward. Mordak raises his hands and a crystalline ice shield materializes around him, reflecting the firelight. He thrusts his palms forward and a volley of razor-sharp icicles shoots through the flames, several finding their mark and striking Zara's shoulder."
```

### Round 2

**Player 1 Input:**

```
"I drink my health potion and launch a concentrated fireball directly at Mordak!"
```

**Player 2 Input:**

```
"I shatter my ice shield into a thousand shards and send them all flying at Zara!"
```

**Mistral AI Resolution:**

```json
{
  "interpretation": "Player 1 heals and launches fireball. Player 2 weaponizes defensive shield into offensive attack.",

  "player1HpChange": -15, // Net: +20 heal, -35 damage
  "player2HpChange": -18,

  "newBattleState": {
    "environmentDescription": "The arena is filled with steam, melting ice, and the acrid smell of scorched stone",
    "player1Condition": "Zara is bloodied and breathing hard, ice shards embedded in her armor",
    "player2Condition": "Mordak staggers, his robes smoking, badly burned",
    "previousEvents": [
      "Zara drank health potion",
      "Zara launched fireball",
      "Mordak shattered ice shield into projectiles",
      "Ice shards tore into Zara",
      "Fireball struck Mordak directly"
    ]
  },

  "videoPrompt": "Zara quickly downs a glowing potion as Mordak shatters his icy barrier into a thousand gleaming shards. The shards streak toward her like a crystal storm, many finding their mark. Simultaneously, Zara hurls a massive fireball that crashes into the unprotected Mordak, engulfing him in flames.",

  "diceRolls": [
    {
      "player": "player1",
      "purpose": "potion healing",
      "formula": "2d4+2",
      "result": 9,
      "modifier": 2
    },
    {
      "player": "player1",
      "purpose": "fireball attack",
      "formula": "1d20+6",
      "result": 19,
      "modifier": 6
    },
    {
      "player": "player1",
      "purpose": "fireball damage",
      "formula": "3d6+4",
      "result": 18,
      "modifier": 4
    },
    {
      "player": "player2",
      "purpose": "ice shard attack",
      "formula": "1d20+4",
      "result": 20,
      "modifier": 4
    },
    {
      "player": "player2",
      "purpose": "ice shard damage (critical!)",
      "formula": "4d6+3",
      "result": 22,
      "modifier": 3
    }
  ]
}
```

**Updated State:**

- Player 1 (Zara): 52 → 57 HP (healed) → 37 HP (damaged)
- Player 2 (Mordak): 75 → 57 HP

**Battle continues until one player reaches 0 HP...**

---

## Character System

### Character Design Philosophy

Characters live in a **shared pool** — anyone can create one, anyone can pick one. All gameplay emerges from:

1. **Player creativity** in describing actions
2. **AI interpretation** of those actions
3. **Narrative context** from battle state and environment
4. **Dice rolls** for dramatic tension

### Generation System

**Inputs**:

- **Text Prompt** (required): Up to 500 character description
  - Example: "A fierce fire mage with crimson robes and flames swirling around glowing hands"
- **Reference Image** (optional): Upload an image for Decart to use as reference
  - Can be a photo, artwork, or combination

**Process**:

1. User provides text description and/or reference image
2. Click "Generate Character" to call Decart API
3. Decart generates 512x512px character image
4. Mistral vision auto-generates visual fingerprint (cached on server)
5. Character added to shared pool — available to all players immediately
6. Can regenerate for variations (new image → new fingerprint cached)

**Key Features**:

- All characters have **40 HP** (standardized)
- No stats, abilities, or items
- **Shared pool** — create once, available to all
- **Visual fingerprint cached** at creation time for instant battle starts
- Pure visual representation

### Default Characters (Starter Set)

For quick play, provide 3-5 pre-generated characters:

1. **Flame Sorceress** - Fire mage in red robes
2. **Frost Knight** - Armored warrior with ice powers
3. **Shadow Rogue** - Dark assassin aesthetic
4. **Nature Shaman** - Druid with wooden staff
5. **Lightning Warrior** - Warrior-mage with electric effects

These serve as examples and starting points for new players.

## Demo Strategy

### Demo Setup

**Hardware**: 1 laptop (host display projected/screenshared), 2 phones (player controllers)

**Pre-Demo Prep**:

- 4-6 pre-created characters with visual fingerprints already generated
- 3-4 preset environments ready to go
- Neocortex announcer character configured and voice tested
- Reactor connection verified

### Demo Flow (5 minutes)

1. **[30s] Hook**: Show the host screen — "What if you could fight anyone, with any power, using just your words?"
2. **[30s] Setup**: Create room, show room code, two players join on phones
3. **[30s] Character Select**: Players pick from pre-made characters, show the Decart images
4. **[2min] Battle — 2-3 rounds**: Players tap action buttons. Reactor video plays on the big screen with AI narrator commentating. Dice rolls visible. HP bars updating. Crowd watches the spectacle.
5. **[30s] Finale**: Someone wins. Victory narration plays. Show the tech stack: "Mistral AI brain, Reactor video, Decart characters, Neocortex voice — all coordinated by a single AI engine."
6. **[30s] Technical callout**: "Every round, one AI call produces the video script, narrator voice, game state, AND your next round's choices. The engine IS the game."

### Demo Failure Modes & Fallbacks

| Failure              | Fallback                                                  |
| -------------------- | --------------------------------------------------------- |
| Reactor video down   | Show static character images + narrator voice still works |
| Neocortex voice down | Browser SpeechSynthesis fallback                          |
| Mistral slow (>10s)  | Pre-cached "epic clash" resolution as timeout fallback    |
| WiFi issues          | Hotspot from phone, or pre-recorded demo video            |
| Player disconnects   | 30s grace period, or demo with one player + AI opponent   |

### What Judges Will See

- **Multiple sponsor tech**: Reactor, Decart, Mistral, Neocortex — all working together
- **Novel gameplay**: Natural language combat is genuinely new
- **AI as game engine**: Not just a chatbot wrapper — AI is the core game loop
- **Real-time spectacle**: Video + voice + game state, all coordinated
- **Accessible**: Tap a button to play, no learning curve

---

## Development Roadmap

### ✅ DONE — Day 1 (Complete)

- [x] Project setup (monorepo: client-host, client-player, server)
- [x] SQLite database + character storage
- [x] Decart character image generation
- [x] Character creation UI
- [x] WebSocket server (Socket.io)
- [x] Room creation + join flow (room codes, 2 players)
- [x] Character selection UI
- [x] Mistral AI combat resolution (JSON output)
- [x] Action submission UI (freeform text)
- [x] HP tracking & victory conditions
- [x] Reactor LiveCore integration (video streaming to host)
- [x] Full end-to-end battle loop working

### 🚧 IN PROGRESS — Day 2 Sprint

#### Priority 1: AI Engine Restructure (Critical Path)

- [ ] Refactor `resolveCombat` → `runEngine` with new EngineOutput contract
- [ ] Add `narratorScript` to engine output
- [ ] Add `player1ActionChoices` / `player2ActionChoices` to engine output
- [ ] Add `visualFingerprint` to engine input context
- [ ] Add `isVictory` / `victoryNarration` to engine output
- [ ] Update ENGINE_SYSTEM_PROMPT with narrator + action choice instructions
- [ ] Test engine output consistency (video prompt ↔ narrator ↔ HP)

#### Priority 2: Visual Fingerprint Pipeline

- [ ] Integrate Mistral vision model (Pixtral)
- [ ] `generateVisualFingerprint()` function
- [ ] Add `visual_fingerprint` column to characters table
- [ ] Auto-generate fingerprint on character creation/regeneration
- [ ] Bake fingerprints into engine prompts
- [ ] Generate fingerprints for existing pre-made characters

#### Priority 3: Button-Based Action UI

- [ ] Update player client with 4-button action layout
- [ ] Wire action choices from engine output → player WebSocket
- [x] ~~Add freeform text as secondary toggle option~~ (cut — buttons-only is cleaner)
- [x] Generate initial action choices for Round 1 (before first engine call)
- [x] ~~Add 20-second timer per round~~ (cut — not needed for demo)
- [x] ~~Track `actionSource: 'button' | 'freeform'`~~ (cut — no freeform input)

#### Priority 4: AI Voice Narration (Neocortex)

- [ ] Create announcer character in Neocortex dashboard (configure voice style)
- [ ] Implement `useNarrator` hook on host client with Neocortex `/audio/generate` endpoint
- [ ] Send binary audio to host client via WebSocket
- [ ] Play audio on host while Reactor video renders
- [ ] Implement browser SpeechSynthesis fallback
- [ ] Display narrator transcript as subtitles on host
- [ ] Handle victory narration

### 🎯 Day 2-3: Polish & Demo Prep

- [ ] Demo flow rehearsal (5-minute walkthrough)
- [ ] Pre-create 4-6 demo characters with fingerprints
- [ ] Pre-create 3-4 demo environments
- [ ] Fallback paths tested (Reactor down, Neocortex down, slow AI)
- [ ] Mobile UI polish (button sizing, animations, timer UX)
- [ ] Host display polish (HP bars, dice roll animations, subtitles)
- [ ] Bug fixes from playtesting

### Future (Post-Hackathon)

- [ ] Character marketplace / public gallery
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] Voice input for actions
- [ ] 2v2 team battles
- [ ] Replay system with shareable links

---

## Technical Requirements

### Performance Targets (Hackathon Scope)

- **WebSocket latency**: <200ms (acceptable for local play)
- **Action submission to resolution**: <20s
  - Mistral AI response: 3-7s
  - Reactor video generation: 10-15s (per 240 frames)
- **Video playback**: Smooth 30fps, 720p minimum
- **Concurrent battles**: Support 10+ simultaneously (sufficient for demo)

### Simplicity Over Scaling

**Hackathon Priorities**:

- In-memory state only (no Redis, no caching layers)
- Single server instance
- SQLite for persistence
- Focus on working demo, not production scale

**What We're NOT Building**:

- Horizontal scaling
- Load balancers
- Database replication
- CDN integration
- Advanced monitoring

### Error Handling

**Client-Side**:

- Auto-reconnect on WebSocket disconnect (exponential backoff, 3 attempts max)
- Show friendly error messages
- Graceful degradation (if video fails, show static image)

**Server-Side**:

- Mistral AI timeout: 10s, then return generic "epic clash" result
- Decart timeout: 15s, then use placeholder image
- Reactor failure: Show error to host, allow manual retry
- Player disconnect: 30s grace period, then forfeit
- Room cleanup: Auto-delete rooms after 2 hours inactive

### Security

**Authentication**:

- No authentication needed (shared character pool, room codes handle access control)
- WebSocket connections tracked by socket ID only

**Input Validation**:

- Sanitize all action text (prevent injection)
- Rate limit action submissions (1 per round)
- Validate character name length on creation

**Anti-Cheat**:

- Server authoritative (all combat calculations server-side)
- Action timestamp validation
- Detect spam/flooding

---

## Cost Estimates

### AI API Costs (per battle, ~3 rounds avg for 40 HP)

**Mistral AI** (mistral-large-latest — AI Engine):

- Engine call: ~2500 input + ~800 output tokens/round × 4 rounds (includes fingerprints, narrator, action choices)
- Estimated **total per battle: ~$0.15-0.25**

**Mistral Vision** (Pixtral — Visual Fingerprint):

- One-time per character: ~500 input + ~300 output tokens
- **Per character: ~$0.01**

**Neocortex** (Voice Narration — hackathon sponsor):

- Per narration call: TBD (check sponsor pricing/credits)
- Likely free or heavily discounted for hackathon participants
- ~4 narration calls per battle + 1 victory narration
- Estimate: **~$0.00-0.10 per battle** (sponsor credits)
- Browser SpeechSynthesis fallback: **$0**

**Reactor LiveCore**:

- Pricing: TBD (need to check Reactor pricing)
- Estimate: ~$0.05-0.25 per battle (based on similar services)

**Decart** (Character Generation):

- Per image generation: ~$0.01-0.05 (estimate)
- Most cost during character creation, not battle

### Total per battle

| Component                    | Cost           |
| ---------------------------- | -------------- |
| Mistral AI Engine (4 rounds) | $0.15-0.25     |
| Neocortex Narration          | $0.00-0.10     |
| Reactor LiveCore             | $0.05-0.25     |
| **Total**                    | **$0.20-0.60** |

### Hackathon Budget (3 days, ~30 battles)

- **AI Engine**: 30 × $0.20 = **$6.00**
- **Neocortex Voice**: Likely free (sponsor credits)
- **Reactor**: 30 × $0.15 = **$4.50**
- **Character gen + fingerprints**: 20 chars × $0.05 = **$1.00**
- **Total hackathon cost**: **~$12-15** (likely less with sponsor credits)

---

## Monitoring & Analytics

### Key Metrics

**Performance**:

- Average round resolution time
- Mistral AI API latency
- Reactor video generation time
- WebSocket message latency

**Engagement**:

- Daily/monthly active users
- Average battle duration
- Characters created per user
- Battle completion rate
- Round count distribution

**Business**:

- AI API costs per battle
- Server costs per user
- Conversion funnel (signup → first character → first battle)

### Logging

```typescript
interface BattleLog {
  battleId: string;
  roomId: string;
  timestamp: Date;
  player1Action: string;
  player2Action: string;
  mistralPrompt: string;
  mistralResponse: string;
  mistralLatency: number;
  reactorPrompt: string;
  reactorLatency: number;
  resolution: BattleResolution;
}
```

---

## Testing Strategy

### Unit Tests

- Character stat calculations
- HP modifier logic
- Dice roll simulation
- Room code generation
- Victory condition checks

### Integration Tests

- WebSocket message flow
- Room creation/joining
- Mistral AI API mocking
- SQLite operations
- Character CRUD operations

### E2E Tests (Playwright)

- Full character creation flow
- Host + 2 players battle (mocked)
- Action submission
- Battle completion
- Error scenarios (disconnect, timeout)

### Manual Testing

- 3 devices (1 laptop, 2 phones)
- Test latency on local network
- Video quality check
- Mobile UI on various screen sizes

---

## Deployment

### Local Development

```bash
# Server
cd server
npm install
npm run dev

# Host client
cd client-host
npm install
npm run dev

# Player client
cd client-player
npm install
npm run dev
```

### Production (Future)

**Server**: Railway, Render, or Fly.io
**Clients**: Vercel or Netlify
**Database**: SQLite file on server (Litestream for backups)
**Environment Variables**:

```
# Server
MISTRAL_API_KEY=...
REACTOR_API_KEY=...
DECART_API_KEY=...
DATABASE_PATH=./game.db
PORT=3000

# Host Client (for direct Neocortex calls)
VITE_NEOCORTEX_API_KEY=...
VITE_NEOCORTEX_CHARACTER_ID=...   # Announcer character ID from Neocortex dashboard
```

---

## Future Enhancements

### Gameplay

- Character progression/XP system
- Equipment slots (armor, weapons, accessories)
- Multiple character classes (warrior, rogue, cleric)
- Environmental effects (weather, terrain)
- Team battles (2v2, 3v3)
- Tournament mode

### Technical

- Mobile apps (React Native)
- Voice input for actions
- Real-time video with reduced latency
- Spectator mode
- Replay system with annotations

### Social

- Friend system
- Guilds/clans
- Global leaderboards
- Character marketplace
- Battle replay sharing
- Community-created characters (curated)

---

## Appendix

### Reactor LiveCore Notes

**Key Constraints**:

- **240 frames per cycle** (0-239)
- **Must schedule prompt at frame 0** before calling `start`
- **Single stream per session** (can't broadcast to multiple clients)
- **Resets to black screen** after frame 239

**Workflow**:

1. Connect to Reactor
2. Schedule initial prompt at frame 0
3. Call `start` command
4. During generation, schedule additional prompts dynamically
5. Listen for state updates (`current_frame`)
6. After 240 frames, reset or schedule new prompts

**State Messages**:

```typescript
{
  type: "state",
  data: {
    current_frame: number,
    current_prompt: string | null,
    paused: boolean,
    scheduled_prompts: { [frame: number]: string }
  }
}
```

**Event Messages**:

```typescript
{
  type: "event",
  data: {
    event: "generation_started" | "prompt_switched" | "error",
    // Additional fields depending on event
  }
}
```

---

## Conclusion

This specification provides a comprehensive blueprint for **Prompt Pugilists** — a real-time AI battle game where the AI engine IS the game. By centralizing all game logic through a single coordinated AI engine that feeds Reactor video, voice narration, game state, and player choices simultaneously, the experience is as good as the engine's output.

**Key Features**:

- **AI Engine as Orchestration Layer**: Single LLM call produces video, voice, state, and choices — everything tells one story
- **Visual Fingerprint Pipeline**: Decart images → Mistral vision → rich text descriptions → visually consistent Reactor video
- **Neocortex Voice Narration**: Neocortex (hackathon sponsor) generates the announcer voice, with browser SpeechSynthesis as fallback
- **Button-Based Actions**: Tap one of 4 AI-generated choices, or write your own
- **Pure Creativity**: No stats, no mana — just imagination and dice
- **Cinematic Video**: Real-time AI-generated battle footage via Reactor

**Hackathon Advantages**:

- Multiple sponsor technologies (Reactor, Decart, Mistral, Neocortex)
- Novel gameplay mechanic (natural language combat with AI video + voice)
- Great demo potential (visual, auditory, exciting, easy to understand)
- Technically ambitious but achievable — core loop already working
- Clear story: "The AI engine IS the game"

---

**Project:** Prompt Pugilists  
**Document Version**: 4.0  
**Last Updated**: February 7, 2026  
**Hackathon**: AI × Games (Day 1 complete, core loop working)  
**Sponsors**: Reactor, Decart, Mistral, Neocortex
