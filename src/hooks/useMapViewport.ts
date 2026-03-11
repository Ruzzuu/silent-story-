import { useState, useCallback } from 'react'
import type { MapBounds } from '../types'

export function useMapViewport() {
  const [bounds, setBounds] = useState<MapBounds | null>(null)

  const updateBounds = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds)
  }, [])

  return { bounds, updateBounds }
}
