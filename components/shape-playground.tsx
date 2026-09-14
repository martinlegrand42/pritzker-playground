'use client'

import { useState } from 'react'
import { ShapeStudioV1 } from './shape-studio-v1'
import { ShapeStudioV2 } from './shape-studio-v2'
import type { StudioVersion } from './version-toggle'

export function ShapePlayground() {
  const [version, setVersion] = useState<StudioVersion>('v1')

  return version === 'v1' ? (
    <ShapeStudioV1 version={version} onVersionChange={setVersion} />
  ) : (
    <ShapeStudioV2 version={version} onVersionChange={setVersion} />
  )
}
