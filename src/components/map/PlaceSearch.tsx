import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MapPin, Search, X } from 'lucide-react'

interface GeocodeResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface PlaceSearchProps {
  onSelect: (lat: number, lng: number, label: string) => void
}

const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 80

export default function PlaceSearch({ onSelect }: PlaceSearchProps) {
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
        setIsLoading(true)
        setError(null)

        const sanitized = trimmedQuery.slice(0, MAX_QUERY_LENGTH)
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
              <Search size={16} className="text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onClick={() => setIsPinnedOpen(true)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places: market, school, cafe..."
                aria-label="Search places"
                className="w-full text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-500"
                maxLength={MAX_QUERY_LENGTH}
                autoComplete="off"
              />
              {isLoading && <Loader2 size={15} className="text-gray-500 animate-spin shrink-0" />}
              {query.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
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