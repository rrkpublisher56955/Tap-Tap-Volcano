import { X, Flame, Shield, ArrowUp, MousePointer, Smartphone, Keyboard } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-[24px] bg-[#1d1d1f]/95 border border-white/10 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.7)] text-white max-h-[85vh] overflow-y-auto"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              How to Play Tap Tap Volcano
            </h2>
            <p className="text-xs text-white/60">The lava's rising. Build your way out.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 my-5 text-sm">
          {/* Objective */}
          <div className="rounded-[16px] bg-gradient-to-r from-amber-950/40 to-rose-950/40 border border-amber-600/20 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
              <Flame className="w-4 h-4" />
              The Pacing Curve
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Lava speed scales with climb height, turning a calm early game into a frantic finish.
              Each block crumbles after 2.6 seconds, forcing constant upward momentum!
            </p>
          </div>

          {/* Controls */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Intuitive Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-center">
                <Smartphone className="w-5 h-5 mx-auto mb-1.5 text-sky-400" />
                <div className="font-semibold text-xs text-white">Touch</div>
                <div className="text-[11px] text-white/60 mt-0.5">
                  Tap anywhere to spawn platform. On-screen arrows to steer.
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-center">
                <MousePointer className="w-5 h-5 mx-auto mb-1.5 text-emerald-400" />
                <div className="font-semibold text-xs text-white">Mouse</div>
                <div className="text-[11px] text-white/60 mt-0.5">
                  Click to place platform beneath character.
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3 text-center">
                <Keyboard className="w-5 h-5 mx-auto mb-1.5 text-violet-400" />
                <div className="font-semibold text-xs text-white">Keyboard</div>
                <div className="text-[11px] text-white/60 mt-0.5">
                  A / D or ← / → to steer. Space or W to tap block.
                </div>
              </div>
            </div>
          </div>

          {/* Platform Power-Ups */}
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Block Types & Power-ups
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                <div className="w-8 h-4 rounded bg-[#8a5a3b] border border-[#3a2418] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">Normal Basalt</div>
                  <div className="text-[11px] text-white/60">
                    Solid rock foothold. Disintegrates into dust after 2.6 seconds.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                <div className="w-8 h-4 rounded bg-[#4ade80] border border-[#166534] shadow-[0_0_8px_rgba(74,222,128,0.5)] shrink-0 flex items-center justify-center">
                  <ArrowUp className="w-2.5 h-2.5 text-black" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-300">Emerald Bounce Pad</div>
                  <div className="text-[11px] text-white/60">
                    Catapults the climber skyward with tremendous vertical momentum.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                <div className="w-8 h-4 rounded bg-[#60a5fa] border border-[#1e3a8a] shadow-[0_0_8px_rgba(96,165,250,0.5)] shrink-0 flex items-center justify-center">
                  <span className="text-[9px] font-black text-black">2×</span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-sky-300">Sapphire Double Jump</div>
                  <div className="text-[11px] text-white/60">
                    Stores an airborne extra jump. Tap in mid-air to blast higher.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                <div className="w-8 h-4 rounded bg-[#38bdf8] border border-[#0284c7] shadow-[0_0_8px_rgba(56,189,248,0.5)] shrink-0 flex items-center justify-center">
                  <Shield className="w-2.5 h-2.5 text-black" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-cyan-300">Cryo Frost Core</div>
                  <div className="text-[11px] text-white/60">
                    Instantly freezes lava rise for 3.5 seconds with cooling crystals.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 text-white font-medium text-xs transition-all shadow-[0_2px_10px_rgba(0,102,204,0.3)]"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
