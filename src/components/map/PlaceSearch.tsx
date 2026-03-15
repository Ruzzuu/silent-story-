import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MapPin, Search, X } from 'lucide-react'

interface GeocodeResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface DirectLocationMatch {
  lat: number
  lng: number
  label: string
}

interface PlaceSearchProps {
  onSelect: (lat: number, lng: number, label: string) => void
  onClearSearchLocation?: () => void
}

const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 80

function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function parseLatLngPair(input: string): { lat: number; lng: number } | null {
  const pairMatch = input.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/)
  if (!pairMatch) return null

  const lat = Number.parseFloat(pairMatch[1])
  const lng = Number.parseFloat(pairMatch[2])
  if (!isValidCoordinate(lat, lng)) return null

  return { lat, lng }
}

function tryParseGoogleMapsLink(input: string): { lat: number; lng: number } | null {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    try {
      url = new URL(`https://${input}`)
    } catch {
      return null
    }
  }

  if (!/google\./i.test(url.hostname)) {
    return null
  }

  const atMatch = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (atMatch) {
    const lat = Number.parseFloat(atMatch[1])
    const lng = Number.parseFloat(atMatch[2])
    if (isValidCoordinate(lat, lng)) return { lat, lng }
  }

  const candidateParams = ['q', 'll', 'query', 'center']
  for (const param of candidateParams) {
    const value = url.searchParams.get(param)
    if (!value) continue
    const parsed = parseLatLngPair(value)
    if (parsed) return parsed
  }

  return null
}

function parseDirectLocation(input: string): DirectLocationMatch | null {
  const directCoords = parseLatLngPair(input)
  if (directCoords) {
    return {
      lat: directCoords.lat,
      lng: directCoords.lng,
      label: `Coordinate: ${directCoords.lat.toFixed(6)}, ${directCoords.lng.toFixed(6)}`,
    }
  }

  const googleCoords = tryParseGoogleMapsLink(input)
  if (googleCoords) {
    return {
      lat: googleCoords.lat,
      lng: googleCoords.lng,
      label: `Google Maps: ${googleCoords.lat.toFixed(6)}, ${googleCoords.lng.toFixed(6)}`,
    }
  }

  return null
}

export default function PlaceSearch({ onSelect, onClearSearchLocation }: PlaceSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isPinnedOpen, setIsPinnedOpen] = useState(false)
  const trimmedQuery = useMemo(() => query.trim(), [query])
  const isExpanded = isHovered || isPinnedOpen || query.length > 0

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsPinnedOpen(false)
        setIsHovered(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([])
      setError(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        const sanitized = trimmedQuery.slice(0, MAX_QUERY_LENGTH)
        const directLocation = parseDirectLocation(sanitized)

        if (directLocation) {
          setResults([
            {
              place_id: -1,
              display_name: directLocation.label,
              lat: String(directLocation.lat),
              lon: String(directLocation.lng),
            },
          ])
          setError(null)
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        setError(null)

        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(sanitized)}`
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Search service unavailable')
        }

        const data = (await response.json()) as GeocodeResult[]
        setResults(Array.isArray(data) ? data : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        setResults([])
        setError('Could not search places right now')
      } finally {
        setIsLoading(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [trimmedQuery])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setError(null)
    onClearSearchLocation?.()
  }

  const handleSelect = (place: GeocodeResult) => {
    const lat = Number.parseFloat(place.lat)
    const lng = Number.parseFloat(place.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return
    }
    setQuery(place.display_name)
    setResults([])
    onSelect(lat, lng, place.display_name)
  }

  const handleSubmit = () => {
    if (results.length > 0) {
      handleSelect(results[0])
      return
    }

    const directLocation = parseDirectLocation(trimmedQuery)
    if (directLocation) {
      onSelect(directLocation.lat, directLocation.lng, directLocation.label)
      setQuery(directLocation.label)
      setResults([])
      setError(null)
    }
  }

  const handleCollapsedClick = () => {
    setIsPinnedOpen(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <div className="pointer-events-auto shrink-0">
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-250 ease-out ${
          isExpanded ? 'w-[min(90vw,28rem)]' : 'w-10'
        }`}
      >
        {!isExpanded ? (
          <button
            type="button"
            onClick={handleCollapsedClick}
            className="h-10 w-full flex items-center justify-center text-gray-500 hover:text-gray-700"
            aria-label="Open place search"
          >
            <Search size={20} />
          </button>
        ) : (
          <>
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              onFocusCapture={() => setIsPinnedOpen(true)}
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onClick={() => setIsPinnedOpen(true)}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Search places, coordinates, or Google Maps link..."
                aria-label="Search places"
                className="w-full text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-500"
                maxLength={MAX_QUERY_LENGTH}
                autoComplete="off"
              />
              {isLoading && <Loader2 size={15} className="text-gray-500 animate-spin shrink-0" />}
              {!isLoading && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  aria-label="Search now"
                >
                  <Search size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                aria-label="Clear search and remove search pin"
              >
                <X size={16} />
              </button>
            </div>

            {error && (
              <p className="px-3 pb-2 text-xs text-red-600">{error}</p>
            )}

            {!error && trimmedQuery.length >= MIN_QUERY_LENGTH && results.length > 0 && (
              <ul className="max-h-64 overflow-auto border-t border-gray-100">
                {results.map((place) => (
                  <li key={place.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(place)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition flex items-start gap-2"
                    >
                      <MapPin size={14} className="text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-800 line-clamp-2">{place.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}