export type Palette = {
  id: string;
  label: string;
  /** ordered from deep core to soft edge */
  stops: string[];
  background: string;
};

export const palettes: Palette[] = [
  {
    id: "pritzker-blue",
    label: "Pritzker Blue",
    stops: ["#050818", "#131e6b", "#2a45d6", "#6f95ff", "#d6e6ff"],
    background: "#050510",
  },
  {
    id: "ember",
    label: "Ember",
    stops: ["#1a0500", "#7a1a00", "#e0480a", "#ff9d3d", "#ffe9c2"],
    background: "#0d0300",
  },
  {
    id: "verdant",
    label: "Verdant",
    stops: ["#04140c", "#0d4a2e", "#1f9e63", "#7fe0ab", "#e6fff2"],
    background: "#020a06",
  },
  {
    id: "orchid",
    label: "Orchid",
    stops: ["#160318", "#530b6b", "#a520c9", "#e07dff", "#fbe6ff"],
    background: "#0a020c",
  },
];

export function getPalette(id: string): Palette {
  return palettes.find((p) => p.id === id) ?? palettes[0];
}
