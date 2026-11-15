import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppleNav } from "../components/AppleNav";
import { VolcanoGame } from "../components/VolcanoGame";
import { SkinSelectorModal } from "../components/SkinSelectorModal";
import { TelemetryDrawer } from "../components/TelemetryDrawer";
import { HelpModal } from "../components/HelpModal";
import { getSelectedSkin, type CharacterSkin } from "../lib/skins";
import type {
  TypeSafeRunEvaluation,
  ClimbSessionTelemetry,
  PacingModeOption,
} from "../lib/typesafe-director";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tap Tap Volcano — Build Your Way Out" },
      {
        name: "description",
        content:
          "The lava's rising. Tap to spawn platform blocks beneath your character in this frantic arcade climb. Designed with Apple Design System & Fluid Motion.",
      },
      { property: "og:title", content: "Tap Tap Volcano" },
      {
        property: "og:description",
        content: "The lava's rising. Tap to build your way out.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const [activeSkin, setActiveSkin] = useState<CharacterSkin>(getSelectedSkin());
  const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Latest TypeSafe S1 evaluation data
  const [liveEvaluation, setLiveEvaluation] = useState<TypeSafeRunEvaluation | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<ClimbSessionTelemetry>({
    climbHeightMeters: 0,
    runDurationSeconds: 0,
    tapFrequencyPerSec: 0,
    averageVelocityY: 0,
    distanceToLavaMeters: 10,
    crumbleStressCount: 0,
    powerUpsAcquired: 0,
    doubleJumpsTriggered: 0,
    consecutiveQuickPlacements: 0,
  });

  const [pacingMode, setPacingMode] = useState<PacingModeOption>("measured_ascent");
  const [streak, setStreak] = useState(0);

  const handleTelemetryUpdate = (evalData: TypeSafeRunEvaluation, telem: ClimbSessionTelemetry) => {
    setLiveEvaluation(evalData);
    setLiveTelemetry(telem);
  };

  const handlePacingUpdate = (mode: PacingModeOption, currentStreak: number) => {
    setPacingMode(mode);
    setStreak(currentStreak);
  };

  return (
    <div
      className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col selection:bg-amber-500 selection:text-black overflow-x-hidden"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
      }}
    >
      {/* 1. Sleek Apple Game Header with Dynamic Island */}
      <AppleNav
        onOpenSkins={() => setIsSkinModalOpen(true)}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        pacingMode={pacingMode}
        streak={streak}
      />

      {/* 2. Interactive Game Stage */}
      <main className="flex-1 w-full flex flex-col items-center justify-center px-4 py-2 sm:py-5">
        <VolcanoGame
          activeSkin={activeSkin}
          onOpenTelemetry={() => setIsTelemetryOpen(true)}
          onTelemetryUpdate={handleTelemetryUpdate}
          onPacingUpdate={handlePacingUpdate}
        />
      </main>

      {/* Skin Wardrobe Sheet */}
      <SkinSelectorModal
        isOpen={isSkinModalOpen}
        activeSkin={activeSkin}
        onSelectSkin={setActiveSkin}
        onClose={() => setIsSkinModalOpen(false)}
      />

      {/* TypeSafe System One Live Telemetry & Decision Matrix Drawer */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        evaluation={liveEvaluation}
        telemetry={liveTelemetry}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Help & Guide Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
