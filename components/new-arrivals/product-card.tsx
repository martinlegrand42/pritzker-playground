'use client'

import { useState } from 'react'
import type { Product } from './products'

export function ProductCard({ product }: { product: Product }) {
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <div className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#efeae1]">
        {product.kind === 'placeholder' && (
          <>
            <div
              className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
              style={{
                background: `linear-gradient(160deg, ${product.colors[0]}, ${product.colors[1]})`,
              }}
            />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `linear-gradient(20deg, ${product.hoverColors[0]}, ${product.hoverColors[1]})`,
              }}
            />
          </>
        )}

        {product.kind === 'photo' &&
          (product.src && !photoFailed ? (
            // Single photo, zoomed toward the top of the frame on hover
            // rather than swapped for a second image — the "face bigger"
            // effect the user asked for.
            <img
              src={product.src}
              alt={product.alt}
              onError={() => setPhotoFailed(true)}
              className="h-full w-full origin-[50%_20%] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.8]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#efeae1] text-3xl">
              🐾
            </div>
          ))}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[13px] tracking-[0.03em] text-[#1c1a17]">{product.name}</p>
        <p className="text-[13px] text-[#6b6156]">{product.price}</p>
      </div>
    </div>
  )
}
