"use client";

import { OrganicBloom } from "@/components/generators/OrganicBloom";
import { palettes } from "@/lib/palette";

export function OrganicBloomPreview() {
  return (
    <OrganicBloom
      settings={{
        palette: palettes[0],
        wobbleAmount: 0.5,
        breatheSpeed: 0.5,
        grainOpacity: 0.18,
        hoverReactive: true,
        seed: 1.7,
      }}
    />
  );
}
