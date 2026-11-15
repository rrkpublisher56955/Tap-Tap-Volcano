import { Volume2, VolumeX, Sparkles, BrainCircuit, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { sound } from "../lib/audio";
import type { PacingModeOption } from "../lib/typesafe-director";

interface AppleNavProps {
  onOpenSkins: () => void;
  onOpenTelemetry?: () => void;
  onOpenHelp?: () => void;
  pacingMode?: PacingModeOption;
  streak?: number;
}

export function AppleNav({
  onOpenSkins,
  onOpenTelemetry,
  onOpenHelp,
  pacingMode = "measured_ascent",
  streak = 0,
}: AppleNavProps) {
  const [muted, setMuted] = useState(sound.getMuted());

  useEffect(() => {
    setMuted(sound.getMuted());
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
  };

  const getPacingBadge = () => {
    switch (pacingMode) {
      case "flow_state":
        return {
          label: "FLOW STATE",
          color: "text-amber-300 border-amber-400/30 bg-amber-500/10",
          dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
        };
      case "panic_climb":
        return {
          label: "PANIC CADENCE",
          color: "text-orange-300 border-orange-400/30 bg-orange-500/10",
          dot: "bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
        };
      case "terminal_peril":
        return {
          label: "PERIL ESCAPE",
          color: "text-rose-300 border-rose-400/30 bg-rose-500/15 animate-pulse",
          dot: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)]",
        };
      case "measured_ascent":
      default:
        return {
          label: "MEASURED",
          color: "text-sky-300 border-sky-400/30 bg-sky-500/10",
          dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
        };
    }
  };

  const badge = getPacingBadge();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#121214]/85 backdrop-blur-2xl border-b border-white/[0.08] transition-all">
      <div className="max-w-4xl mx-auto h-12 px-3 sm:px-4 flex items-center justify-between text-[13px] tracking-tight">
        {/* Left: Apple Brand Capsule */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-400 flex items-center justify-center text-white shadow-[0_0_14px_rgba(245,158,11,0.55)] shrink-0">
            <span className="text-[11px] font-black leading-none">▲</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white/95 tracking-tight font-sans text-xs sm:text-sm leading-tight">
              Tap Tap Volcano
            </span>
            <span className="text-[10px] text-white/40 tracking-wider font-mono hidden sm:inline">
              APPLE DESIGN & FLUID MOTION
            </span>
          </div>
        </div>

        {/* Center: Dynamic Island Pacing Badge (Clickable to open AI Director) */}
        {onOpenTelemetry && (
          <button
            type="button"
            onClick={onOpenTelemetry}
            className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono tracking-wider font-semibold active:scale-95 transition-all cursor-pointer ${badge.color}`}
            title="TypeSafe S1 Live Pacing State (Click to inspect)"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            <span>{streak >= 3 ? `${streak}× ${badge.label}` : badge.label}</span>
          </button>
        )}

        {/* Right: Actions (AI Director, Guide, Wardrobe, Audio) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* TypeSafe S1 AI Director Trigger */}
          {onOpenTelemetry && (
            <button
              type="button"
              onClick={onOpenTelemetry}
              className="h-8 px-2 sm:px-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 transition-all flex items-center gap-1 text-sky-300 hover:text-sky-200 text-xs font-medium border border-sky-500/20 shadow-sm"
              title="TypeSafe System One AI Director"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">AI Director</span>
            </button>
          )}

          {/* Guide / How to Play */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 transition-all flex items-center justify-center text-white/80 hover:text-white"
              title="How to Play"
            >
              <HelpCircle className="w-3.5 h-3.5 text-white/70" />
            </button>
          )}

          {/* Skins / Wardrobe */}
          <button
            type="button"
            onClick={onOpenSkins}
            className="h-8 px-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 transition-all flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium"
            title="Character Wardrobe"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Skins</span>
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={muted ? "Unmute audio" : "Mute audio"}
            className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 transition-all flex items-center justify-center text-white/80 hover:text-white"
            title={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-white/90" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
