import { Link } from "wouter";

export function Landing() {
  return (
    <div className="relative flex flex-col items-center min-h-screen p-6 overflow-hidden">
      {/* Background video — full width, edge to edge */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/whp-web.webm"
      />
      {/* Spacer to push buttons to bottom */}
      <div className="flex-1" />

      {/* Buttons pinned to bottom */}
      <div className="relative z-10 flex flex-col gap-3 w-full max-w-lg pb-4 font-body animate-slide-up">
        {/* Primary CTA */}
        <Link
          href="/host/environment"
          className="group relative w-full block overflow-hidden py-4 rounded-2xl font-display text-2xl uppercase tracking-wider font-bold text-center transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer transition-all group-hover:brightness-110" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer opacity-40 blur-xl" />
          <span className="relative z-10 drop-shadow-lg">Host Game</span>
        </Link>

        {/* Secondary row */}
        <div className="flex gap-3">
          <Link
            href="/join"
            className="flex-1 bg-gray-950/80 backdrop-blur-md hover:bg-gray-900/90 border border-white/15 hover:border-white/25 text-center py-3.5 px-4 rounded-xl font-display text-lg uppercase tracking-wide font-bold transition-all"
          >
            Join Game
          </Link>
          <Link
            href="/characters"
            className="flex-1 bg-gray-950/80 backdrop-blur-md hover:bg-gray-900/90 border border-white/15 hover:border-white/25 text-center py-3.5 px-4 rounded-xl font-display text-lg uppercase tracking-wide font-bold transition-all"
          >
            Characters
          </Link>
        </div>
      </div>
    </div>
  );
}
