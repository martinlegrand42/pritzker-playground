"use client";

import { KineticGrid } from "@/components/generators/KineticGrid";
import { palettes } from "@/lib/palette";

export function KineticGridPreview() {
  return (
    <KineticGrid
      settings={{
        palette: palettes[0],
        density: 10,
        breatheSpeed: 0.5,
        rippleStrength: 0.6,
        seed: 3.2,
      }}
    />
  );
}
