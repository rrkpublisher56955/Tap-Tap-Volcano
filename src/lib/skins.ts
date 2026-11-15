export interface CharacterSkin {
  id: string;
  name: string;
  subtitle: string;
  bodyColor: string;
  headBandColor: string;
  eyeColor: string;
  glowColor: string;
  trailColor: string;
  description: string;
}

export const SKINS: CharacterSkin[] = [
  {
    id: "magma",
    name: "Magma Runner",
    subtitle: "Caldera Pioneer",
    bodyColor: "#fef3c7",
    headBandColor: "#ea580c",
    eyeColor: "#18181b",
    glowColor: "rgba(249, 115, 22, 0.4)",
    trailColor: "#fb923c",
    description: "The classic resilient climber outfitted for searing volcanic environments.",
  },
  {
    id: "frost",
    name: "Cryo Sprite",
    subtitle: "Thermal Resistant",
    bodyColor: "#e0f2fe",
    headBandColor: "#0284c7",
    eyeColor: "#0c4a6e",
    glowColor: "rgba(56, 189, 248, 0.45)",
    trailColor: "#38bdf8",
    description: "Cooled with liquid nitrogen alloys that resist surrounding magma radiant heat.",
  },
  {
    id: "obsidian",
    name: "Obsidian Knight",
    subtitle: "Titanium Precision",
    bodyColor: "#27272a",
    headBandColor: "#2997ff",
    eyeColor: "#60a5fa",
    glowColor: "rgba(41, 151, 255, 0.4)",
    trailColor: "#3b82f6",
    description:
      "Sleek Apple dark glass chassis machined from volcanic obsidian and aerospace titanium.",
  },
  {
    id: "sol",
    name: "Solar Sol",
    subtitle: "Apex Luminous",
    bodyColor: "#fef08a",
    headBandColor: "#eab308",
    eyeColor: "#15803d",
    glowColor: "rgba(250, 204, 21, 0.5)",
    trailColor: "#facc15",
    description: "Harnesses raw solar core fusion to blaze effortlessly through rising magma.",
  },
];

export const SKIN_STORAGE_KEY = "ttv_selected_skin_id";

export function getSelectedSkin(): CharacterSkin {
  if (typeof window === "undefined") return SKINS[0];
  try {
    const saved = localStorage.getItem(SKIN_STORAGE_KEY);
    const found = SKINS.find((s) => s.id === saved);
    if (found) return found;
  } catch {
    /* ignore storage read error */
  }
  return SKINS[0];
}

export function setSelectedSkin(id: string): CharacterSkin {
  const skin = SKINS.find((s) => s.id === id) || SKINS[0];
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, skin.id);
  } catch {
    /* ignore storage write error */
  }
  return skin;
}
