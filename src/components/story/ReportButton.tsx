import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../ui/Modal'

interface ReportButtonProps {
  isOpen: boolean
  onClose: () => void
  storyId: string
  reporterId: string
}

const REPORT_REASONS = [
  'I just don\'t like it',
  'Bullying or unwanted contact',
  'Suicide, self-injury or eating disorders',
  'Violence, hate or exploitation',
  'Selling or promoting restricted items',
  'Nudity or sexual activity',
  'Scam, fraud or spam',
  'False information',
]

export default function ReportButton({ isOpen, onClose, storyId, reporterId }: ReportButtonProps) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReport = async (reason: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('reports')
      .insert({ story_id: storyId, reporter_id: reporterId, reason })

    if (!error) {
      setSubmitted(true)
      window.setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 900)
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report">
      <div className="space-y-4">
        <div className="border-b border-stone-200 pb-3">
          <p className="text-lg font-semibold text-stone-800">Why are you reporting this post?</p>
          {submitted && <p className="mt-2 text-sm text-emerald-700">Report submitted. Thank you.</p>}
        </div>

        <div className="max-h-[52vh] overflow-y-auto rounded-xl border border-stone-200">
          {REPORT_REASONS.map((reason, index) => (
            <button
              key={reason}
              type="button"
              onClick={() => handleReport(reason)}
              disabled={loading}
              className={`flex w-full items-center justify-between px-4 py-4 text-left text-base text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 ${index !== REPORT_REASONS.length - 1 ? 'border-b border-stone-200' : ''}`}
            >
              <span>{reason}</span>
              <ChevronRight size={20} className="text-stone-400" />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
