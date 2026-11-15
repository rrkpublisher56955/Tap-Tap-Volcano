import { X, Check } from "lucide-react";
import { SKINS, type CharacterSkin, setSelectedSkin } from "../lib/skins";
import { sound } from "../lib/audio";

interface SkinSelectorModalProps {
  isOpen: boolean;
  activeSkin: CharacterSkin;
  onSelectSkin: (skin: CharacterSkin) => void;
  onClose: () => void;
}

export function SkinSelectorModal({
  isOpen,
  activeSkin,
  onSelectSkin,
  onClose,
}: SkinSelectorModalProps) {
  if (!isOpen) return null;

  const handleChoose = (skin: CharacterSkin) => {
    sound.playUiClick();
    setSelectedSkin(skin.id);
    onSelectSkin(skin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-[22px] bg-[#1d1d1f]/95 border border-white/10 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] text-white"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Climber Wardrobe</h2>
            <p className="text-xs text-white/60 mt-0.5">
              Select your thermal-insulated avatar profile
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Skins Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5 max-h-[60vh] overflow-y-auto pr-1">
          {SKINS.map((skin) => {
            const isSelected = skin.id === activeSkin.id;
            return (
              <div
                key={skin.id}
                onClick={() => handleChoose(skin)}
                className={`relative rounded-[16px] p-4 cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-white/[0.12] border-[#2997ff] shadow-[0_0_20px_rgba(41,151,255,0.25)] ring-1 ring-[#2997ff]"
                    : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]"
                }`}
              >
                {/* Preview Avatar render */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden"
                    style={{
                      backgroundColor: skin.bodyColor,
                      boxShadow: `0 0 16px ${skin.glowColor}`,
                    }}
                  >
                    {/* Headband */}
                    <div
                      className="absolute top-1.5 left-0 right-0 h-2"
                      style={{ backgroundColor: skin.headBandColor }}
                    />
                    {/* Eyes */}
                    <div className="flex gap-2 z-10 mt-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: skin.eyeColor }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: skin.eyeColor }}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white tracking-tight">{skin.name}</h3>
                    <span className="text-[11px] text-white/50 block">{skin.subtitle}</span>
                  </div>
                </div>

                <p className="text-[12px] text-white/70 leading-relaxed">{skin.description}</p>

                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0066cc] flex items-center justify-center text-white">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 text-white font-medium text-xs transition-all shadow-[0_2px_10px_rgba(0,102,204,0.3)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
