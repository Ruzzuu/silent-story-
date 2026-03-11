import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MapContainerComponent from '../components/map/MapContainer'
import StoryForm from '../components/story/StoryForm'
import StoryCard from '../components/story/StoryCard'
import StoryFeed from '../components/story/StoryFeed'
import UserMenu from '../components/auth/UserMenu'
import AuthModal from '../components/auth/AuthModal'
import Modal from '../components/ui/Modal'
import { useStories } from '../hooks/useStories'
import { useAuth } from '../hooks/useAuth'
import { BookOpen, Plus, Locate, Menu, X, MousePointerClick, Shuffle } from 'lucide-react'
import type { Story, MapBounds, Mood } from '../types'

export default function MapPage() {
  const { user, profile } = useAuth()
  const { stories, fetchStoriesInBounds, createStory, incrementViews, fetchRandomStory } = useStories()
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showFeed, setShowFeed] = useState(false)
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null)
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 20, lng: 0 })
  const [showToolbar, setShowToolbar] = useState(false)
  const [hasClickedMap, setHasClickedMap] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalHint, setAuthModalHint] = useState('')
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')
  const [pendingWelcome, setPendingWelcome] = useState(false)
  const [shuffling, setShuffling] = useState(false)

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setCurrentBounds(bounds)
    setMapCenter({
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    })
  }, [])

  useEffect(() => {
    if (currentBounds) {
      fetchStoriesInBounds(currentBounds)
    }
  }, [currentBounds, fetchStoriesInBounds])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!user) {
      setAuthModalHint('Sign in to leave a memory here 📍')
      setShowAuthModal(true)
      return
    }
    setHasClickedMap(true)
    setClickedLocation({ lat, lng })
    setShowForm(true)
    setSelectedStory(null)
  }, [user])

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false)
    setPendingWelcome(true)
  }, [])

  useEffect(() => {
    if (!pendingWelcome || !user) return
    setPendingWelcome(false)
    setWelcomeName(profile?.username ?? user.email?.split('@')[0] ?? '')
    setShowWelcomeBanner(true)
    const t = setTimeout(() => setShowWelcomeBanner(false), 4000)
    return () => clearTimeout(t)
  }, [pendingWelcome, user, profile])

  const handleShuffle = useCallback(async () => {
    if (shuffling) return
    setShuffling(true)
    const story = await fetchRandomStory()
    setShuffling(false)
    if (!story) return
    setFlyToCoords([story.latitude, story.longitude])
    setSelectedStory(story)
    setShowForm(false)
    setShowFeed(false)
    incrementViews(story.id)
  }, [fetchRandomStory, incrementViews, shuffling])

  const handleStoryClick = useCallback((story: Story) => {
    setSelectedStory(story)
    setShowForm(false)
    setShowFeed(false)
    incrementViews(story.id)
  }, [incrementViews])

  const handleSubmitStory = async (data: { title: string; content: string; mood: Mood; latitude: number; longitude: number; image_url: string | null; is_anonymous: boolean }) => {
    if (!user) return
    await createStory({
      ...data,
      user_id: user.id,
    })
    setShowForm(false)
    setClickedLocation(null)
    if (currentBounds) {
      fetchStoriesInBounds(currentBounds)
    }
  }

  const handleFindMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setFlyToCoords([pos.coords.latitude, pos.coords.longitude]),
      () => alert('Could not get your location'),
    )
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <MapContainerComponent
        stories={stories}
        onMapClick={handleMapClick}
        onStoryClick={handleStoryClick}
        onBoundsChange={handleBoundsChange}
        flyToCoords={flyToCoords}
      />

      {/* Top bar */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        {!showToolbar ? (
          <button
            onClick={() => setShowToolbar(true)}
            className="p-2.5 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition"
            title="Open menu"
          >
            <Menu size={20} />
          </button>
        ) : (
          <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg shadow-lg px-1.5 py-1.5">
            <button
              onClick={() => setShowToolbar(false)}
              className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 transition"
              title="Close"
            >
              <X size={18} />
            </button>
            <div className="w-px h-5 bg-gray-600 mx-0.5" />
            <button
              onClick={() => { setShowFeed(!showFeed); setSelectedStory(null); setShowToolbar(false) }}
              className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 transition"
              title="Discover stories"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => { handleShuffle(); setShowToolbar(false) }}
              className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 transition"
              title="Random story"
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={() => { handleFindMe(); setShowToolbar(false) }}
              className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 transition"
              title="Find my location"
            >
              <Locate size={18} />
            </button>
            <button
              onClick={() => {
                if (!user) {
                  setAuthModalHint('Sign in to share a memory 📍')
                  setShowAuthModal(true)
                  setShowToolbar(false)
                } else {
                  setClickedLocation(mapCenter)
                  setShowForm(true)
                  setShowToolbar(false)
                }
              }}
              className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 transition"
              title="New story"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <UserMenu onRequestAuth={() => { setAuthModalHint('Sign in to your account'); setShowAuthModal(true) }} />
      </div>

      {/* Onboarding hints */}
      <AnimatePresence>
        {!user && !selectedStory && !showWelcomeBanner && (
          <motion.div
            key="guest-hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-900/80 text-white text-sm rounded-full shadow-xl backdrop-blur-sm">
              <BookOpen size={16} className="text-indigo-300 shrink-0" />
              Tap any pin to read a memory
            </div>
          </motion.div>
        )}
        {user && !hasClickedMap && !showForm && !selectedStory && (
          <motion.div
            key="user-hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-900/80 text-white text-sm rounded-full shadow-xl backdrop-blur-sm">
              <MousePointerClick size={16} className="text-violet-300 shrink-0" />
              Click anywhere on the map to leave a memory
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Surprise me button — visible to everyone, no login required */}
      <div className="absolute bottom-28 right-4 z-20 pointer-events-auto">
        <motion.button
          onClick={handleShuffle}
          disabled={shuffling}
          whileTap={{ scale: 0.93 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 text-white text-sm font-medium rounded-full shadow-xl backdrop-blur-sm border border-white/10 hover:bg-gray-800 transition disabled:opacity-60"
          title="Show a random memory"
        >
          <Shuffle size={15} className={shuffling ? 'animate-spin' : ''} />
          {shuffling ? 'Finding…' : 'Surprise me'}
        </motion.button>
      </div>

      {/* Story Card Panel */}
      <AnimatePresence>
        {selectedStory && (
          <StoryCard
            story={selectedStory}
            onClose={() => setSelectedStory(null)}
            userId={user?.id}
          />
        )}
      </AnimatePresence>

      {/* Story Feed Panel */}
      <AnimatePresence>
        {showFeed && (
          <StoryFeed
            stories={stories}
            mapCenter={mapCenter}
            onStoryClick={handleStoryClick}
            onClose={() => setShowFeed(false)}
          />
        )}
      </AnimatePresence>

      {/* Story Form Modal */}
      <Modal
        isOpen={showForm && !!clickedLocation}
        onClose={() => { setShowForm(false); setClickedLocation(null) }}
        title="Share a Memory"
      >
        {clickedLocation && (
          <StoryForm
            latitude={clickedLocation.lat}
            longitude={clickedLocation.lng}
            onSubmit={handleSubmitStory}
            onCancel={() => { setShowForm(false); setClickedLocation(null) }}
          />
        )}
      </Modal>

      {/* Welcome banner — shown briefly after login */}
      <AnimatePresence>
        {showWelcomeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white text-sm rounded-full shadow-xl">
              ✨ Welcome{welcomeName ? `, ${welcomeName}` : ''}! Tap anywhere on the map to leave your memory.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth modal — shown when guest tries a write action */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        contextHint={authModalHint}
        storyCount={stories.length}
      />
    </div>
  )
}
