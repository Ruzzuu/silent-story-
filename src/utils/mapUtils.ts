import L from 'leaflet'
import type { Mood } from '../types'
import { moodConfig } from './moodConfig'

export function createMoodIcon(mood: Mood): L.DivIcon {
  const config = moodConfig[mood]
  return L.divIcon({
    className: 'custom-mood-marker',
    html: `<div style="
      width: 14px;
      height: 14px;
      background: ${config.color};
      border: 2px solid rgba(0,0,0,0.15);
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  })
}

/** Haversine distance in km between two lat/lng points */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
