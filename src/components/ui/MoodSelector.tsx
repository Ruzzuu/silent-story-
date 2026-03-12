import type { Mood } from '../../types'
import { moodConfig } from '../../utils/moodConfig'
import { Sun, Heart, Waves, Compass, CloudRain, Sparkles } from 'lucide-react'

interface MoodSelectorProps {
  value: Mood | ''
  onChange: (mood: Mood) => void
}

const moods: Mood[] = ['joy', 'love', 'nostalgia', 'adventure', 'loss', 'wonder']

const moodIcons: Record<Mood, React.ReactNode> = {
  joy:       <Sun size={20} />,
  love:      <Heart size={20} />,
  nostalgia: <Waves size={20} />,
  adventure: <Compass size={20} />,
  loss:      <CloudRain size={20} />,
  wonder:    <Sparkles size={20} />,
}

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {moods.map((mood) => {
        const config = moodConfig[mood]
        const isSelected = value === mood
        return (
          <button
            key={mood}
            type="button"
            onClick={() => onChange(mood)}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
              isSelected
                ? `${config.bgColor} ${config.textColor} border-current scale-105 shadow-sm`
                : 'bg-amber-50 text-stone-600 border-transparent hover:bg-amber-100 hover:scale-105'
            }`}
          >
            <span className="leading-none">{moodIcons[mood]}</span>
            <span className="text-xs">{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}
