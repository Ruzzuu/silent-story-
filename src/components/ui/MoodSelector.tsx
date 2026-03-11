import type { Mood } from '../../types'
import { moodConfig } from '../../utils/moodConfig'

interface MoodSelectorProps {
  value: Mood | ''
  onChange: (mood: Mood) => void
}

const moods: Mood[] = ['joy', 'love', 'nostalgia', 'adventure', 'loss', 'wonder']

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
                : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:scale-105'
            }`}
          >
            <span className="text-xl leading-none">{config.emoji}</span>
            <span className="text-xs">{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}
