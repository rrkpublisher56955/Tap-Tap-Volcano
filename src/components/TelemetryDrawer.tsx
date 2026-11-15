import { X, BrainCircuit, Activity, ShieldAlert, Award, Compass, Zap } from "lucide-react";
import type { TypeSafeRunEvaluation, ClimbSessionTelemetry } from "../lib/typesafe-director";

interface TelemetryDrawerProps {
  isOpen: boolean;
  evaluation: TypeSafeRunEvaluation | null;
  telemetry: ClimbSessionTelemetry;
  onClose: () => void;
}

export function TelemetryDrawer({ isOpen, evaluation, telemetry, onClose }: TelemetryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-[24px] bg-[#1d1d1f]/95 border border-white/10 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-white max-h-[90vh] overflow-y-auto"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                TypeSafe System One Director
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                  JEV-S1
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Programmable common sense & atomic typed judgments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Input Telemetry Matrix */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Live Telemetry State
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              LIVE SAMPLING
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5">
              <div className="text-[10px] text-white/50 uppercase">Lava Distance</div>
              <div className="text-base font-bold text-amber-300 tabular-nums">
                {telemetry.distanceToLavaMeters.toFixed(1)}m
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5">
              <div className="text-[10px] text-white/50 uppercase">Tap Cadence</div>
              <div className="text-base font-bold text-sky-300 tabular-nums">
                {telemetry.tapFrequencyPerSec.toFixed(1)} /s
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5">
              <div className="text-[10px] text-white/50 uppercase">Chain Streak</div>
              <div className="text-base font-bold text-violet-300 tabular-nums">
                {telemetry.consecutiveQuickPlacements}×
              </div>
            </div>
          </div>
        </div>

        {/* 3 TypeSafe System One Primitives */}
        {evaluation && (
          <div className="space-y-3.5 my-5">
            {/* 1. Choice Primitive: Dynamic Pacing Route */}
            <div className="rounded-[16px] bg-white/[0.04] border border-white/[0.08] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-white">
                    Primitive: Choice (Pacing Mode)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full uppercase">
                  {evaluation.pacingMode.selected.replace("_", " ")}
                </span>
              </div>
              <p className="text-[11px] text-white/60 mb-3">{evaluation.pacingMode.rationale}</p>
              {/* Distribution bars */}
              <div className="space-y-1.5">
                {Object.entries(evaluation.pacingMode.distribution).map(([mode, prob]) => (
                  <div key={mode} className="text-[11px]">
                    <div className="flex justify-between text-white/70 mb-0.5">
                      <span className="capitalize">{mode.replace("_", " ")}</span>
                      <span className="font-mono text-white/90">{(prob * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          mode === evaluation.pacingMode.selected ? "bg-sky-400" : "bg-white/20"
                        }`}
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Noul Primitive: Imminent Hazard Probability */}
            <div className="rounded-[16px] bg-white/[0.04] border border-white/[0.08] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-semibold text-white">
                    Primitive: Noul (Imminent Hazard P(yes))
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    evaluation.imminentHazard.isAffirmative
                      ? "text-rose-300 bg-rose-500/20"
                      : "text-emerald-300 bg-emerald-500/20"
                  }`}
                >
                  P(yes) = {(evaluation.imminentHazard.probability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-300 rounded-full"
                  style={{ width: `${evaluation.imminentHazard.probability * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-white/60">
                Condition:{" "}
                <code className="text-white/80">{evaluation.imminentHazard.condition}</code>. When
                P(yes) &gt; 70%, director escalates clutch bounce-pad probability.
              </p>
            </div>

            {/* 3. Score Primitive: Agility Mastery Grade */}
            <div className="rounded-[16px] bg-white/[0.04] border border-white/[0.08] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white">
                    Primitive: Score (Reflex Mastery)
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        lvl <= evaluation.climberMastery.level
                          ? "bg-amber-400 text-black"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      {lvl}
                    </div>
                  ))}
                </div>
              </div>
              <div className="font-semibold text-sm text-amber-200 mb-0.5">
                Level {evaluation.climberMastery.level}: {evaluation.climberMastery.levelName}
              </div>
              <p className="text-[11px] text-white/70">{evaluation.climberMastery.description}</p>
            </div>

            {/* 4. TypeSafe Tactical Debrief Routing */}
            <div className="rounded-[16px] bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-400/20 p-4">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-1">
                <Zap className="w-3.5 h-3.5" />
                Routed Tactical Coaching: {evaluation.coachingRecommendation.badge}
              </div>
              <div className="text-sm font-semibold text-white mb-1">
                {evaluation.coachingRecommendation.headline}
              </div>
              <p className="text-[12px] text-white/80 leading-relaxed">
                {evaluation.coachingRecommendation.tacticalTip}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 text-white font-medium text-xs transition-all shadow-[0_2px_10px_rgba(0,102,204,0.3)]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
