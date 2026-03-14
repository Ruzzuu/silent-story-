import { useMapEvents } from 'react-leaflet'

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void
  enabled?: boolean
}

export default function MapClickHandler({ onClick, enabled = true }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}
