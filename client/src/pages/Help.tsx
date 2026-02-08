import { Link } from "wouter";

export function Help() {
  return (
    <div className="relative min-h-screen overflow-hidden font-body">
      {/* ── Background atmosphere ── */}
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
        <div className="absolute top-1/2 -left-40 w-[350px] h-[350px] bg-fuchsia-600/[0.07] rounded-full blur-[120px]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center px-5 pt-8 pb-14 gap-7 max-w-xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="self-start flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors animate-fade-in"
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
          Back
        </Link>

        {/* Header */}
        <header className="text-center animate-fade-in -mt-2">
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-indigo-500/50" />
            <p className="text-[11px] tracking-[0.3em] uppercase text-indigo-400/60 font-medium">
              Guide
            </p>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-indigo-500/50" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight uppercase leading-none">
            How to Play
          </h1>
        </header>

        {/* ── What is Prompt Pugilists? ── */}
        <section
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 animate-slide-up"
          style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}
        >
          <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3">
            What is Prompt Pugilists?
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Prompt Pugilists is a Jackbox-style multiplayer AI fighting game.
            One player hosts the battle on a shared screen while others join
            from their phones as fighters. Every action, resolution, and visual
            is driven by AI — making each match completely unique.
          </p>
        </section>

        {/* ── Getting Started ── */}
        <section
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 animate-slide-up"
          style={{ animationDelay: "0.15s", animationFillMode: "backwards" }}
        >
          <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3">
            Getting Started
          </h2>
          <ol className="text-gray-400 text-sm leading-relaxed space-y-2 list-decimal list-inside">
            <li>
              The <span className="text-white font-medium">host</span> creates a
              room and picks a battle environment.
            </li>
            <li>
              Share the <span className="text-white font-medium">6-character room code</span> with
              your opponent.
            </li>
            <li>
              Players join on their phone, pick a character, and ready up.
            </li>
            <li>The battle begins automatically once both players are ready.</li>
          </ol>
        </section>

        {/* ── Battle Mechanics ── */}
        <section
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 animate-slide-up"
          style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
        >
          <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3">
            Battle Mechanics
          </h2>
          <ul className="text-gray-400 text-sm leading-relaxed space-y-2">
            <li>
              Each round you choose from <span className="text-white font-medium">4 AI-generated actions</span> — or
              write your own freeform prompt to try anything you can imagine.
            </li>
            <li>
              Both players submit simultaneously. The AI resolves the outcome
              with dice rolls, calculates damage, and generates a battle video
              with narration.
            </li>
            <li>
              The fight continues until one player's HP hits{" "}
              <span className="text-white font-medium">0</span>. Max HP is 40.
            </li>
          </ul>
        </section>

        {/* ── Characters ── */}
        <section
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 animate-slide-up"
          style={{ animationDelay: "0.25s", animationFillMode: "backwards" }}
        >
          <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3">
            Characters
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Create custom characters with a name, text description, and image.
            Each character gets a "visual fingerprint" — an AI-generated
            description of their appearance that keeps them looking consistent
            throughout the battle video. You can use the default roster or
            create your own fighters from scratch.
          </p>
        </section>

        {/* ── Tips ── */}
        <section
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 animate-slide-up"
          style={{ animationDelay: "0.3s", animationFillMode: "backwards" }}
        >
          <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3">
            Tips
          </h2>
          <ul className="text-gray-400 text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li>
              Freeform prompts can be wildly creative — the AI will try to
              resolve whatever you describe.
            </li>
            <li>
              Some actions heal you instead of dealing damage. Keep an eye on
              the action descriptions.
            </li>
            <li>
              Watch the HP bars! Playing defensively when you're low can turn the
              tide.
            </li>
            <li>
              The host screen shows the battle video and narration — gather
              around for the best experience.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
