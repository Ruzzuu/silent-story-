import { Marker } from 'react-leaflet'
import { createMoodIcon } from '../../utils/mapUtils'
import type { Story } from '../../types'

interface StoryMarkerProps {
  story: Story
  onClick: (story: Story) => void
}

export default function StoryMarker({ story, onClick }: StoryMarkerProps) {
  return (
    <Marker
      position={[story.latitude, story.longitude]}
      icon={createMoodIcon(story.mood)}
      eventHandlers={{
        click: () => onClick(story),
      }}
    />
  )
}
