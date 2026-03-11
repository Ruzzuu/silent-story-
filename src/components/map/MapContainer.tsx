import { useEffect, useCallback } from 'react'
import L from 'leaflet'
import { MapContainer as LeafletMap, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import MapClickHandler from './MapClickHandler'
import StoryMarker from './StoryMarker'
import type { Story, MapBounds } from '../../types'

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, '')}k`
  }
  return String(n)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount()
  let size = 34
  let sizeClass = 'cluster-sm'
  if (count >= 1000) { size = 64; sizeClass = 'cluster-xl' }
  else if (count >= 100) { size = 54; sizeClass = 'cluster-lg' }
  else if (count >= 10) { size = 44; sizeClass = 'cluster-md' }

  return L.divIcon({
    html: `<div class="custom-cluster ${sizeClass}"><span>${formatCount(count)}</span></div>`,
    className: 'custom-cluster-wrapper',
    iconSize: L.point(size, size),
  })
}

interface MapContainerProps {
  stories: Story[]
  onMapClick: (lat: number, lng: number) => void
  onStoryClick: (story: Story) => void
  onBoundsChange: (bounds: MapBounds) => void
  flyToCoords?: [number, number] | null
}

function BoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds()
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    },
    zoomend: () => {
      const b = map.getBounds()
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      })
    },
  })

  useEffect(() => {
    const b = map.getBounds()
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    })
  }, [map, onBoundsChange])

  return null
}

function FlyToHandler({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 13, { duration: 1.5 })
    }
  }, [coords, map])
  return null
}

export default function MapContainerComponent({
  stories,
  onMapClick,
  onStoryClick,
  onBoundsChange,
  flyToCoords,
}: MapContainerProps) {
  const handleBoundsChange = useCallback(
    (bounds: MapBounds) => onBoundsChange(bounds),
    [onBoundsChange]
  )

  return (
    <LeafletMap
      center={[20, 0]}
      zoom={3}
      className="h-full w-full z-0"
      zoomControl={false}
      minZoom={2}
      maxZoom={18}
      worldCopyJump={true}
      maxBounds={[[-75, -Infinity], [85, Infinity]]}
      maxBoundsViscosity={1.0}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapClickHandler onClick={onMapClick} />
      <BoundsTracker onBoundsChange={handleBoundsChange} />
      <FlyToHandler coords={flyToCoords ?? null} />
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterIcon}
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {stories.map((story) => (
          <StoryMarker key={story.id} story={story} onClick={onStoryClick} />
        ))}
      </MarkerClusterGroup>
    </LeafletMap>
  )
}
