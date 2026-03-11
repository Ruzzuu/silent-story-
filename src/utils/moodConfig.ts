import type { Mood } from '../types'

interface MoodConfig {
  label: string
  emoji: string
  color: string
  bgColor: string
  textColor: string
  markerColor: string
  gradient: string
}

export const moodConfig: Record<Mood, MoodConfig> = {
  joy: {
    label: 'Joy',
    emoji: '☀️',
    color: '#f59e0b',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    markerColor: '#f59e0b',
    gradient: 'from-amber-400 to-orange-300',
  },
  love: {
    label: 'Love',
    emoji: '❤️',
    color: '#ef4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    markerColor: '#ef4444',
    gradient: 'from-red-400 to-rose-300',
  },
  nostalgia: {
    label: 'Nostalgia',
    emoji: '🌊',
    color: '#3b82f6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    markerColor: '#3b82f6',
    gradient: 'from-blue-400 to-indigo-300',
  },
  adventure: {
    label: 'Adventure',
    emoji: '🌿',
    color: '#22c55e',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    markerColor: '#22c55e',
    gradient: 'from-green-400 to-emerald-300',
  },
  loss: {
    label: 'Loss',
    emoji: '🌧️',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    markerColor: '#6b7280',
    gradient: 'from-gray-400 to-slate-300',
  },
  wonder: {
    label: 'Wonder',
    emoji: '✨',
    color: '#8b5cf6',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-800',
    markerColor: '#8b5cf6',
    gradient: 'from-violet-400 to-purple-300',
  },
}
