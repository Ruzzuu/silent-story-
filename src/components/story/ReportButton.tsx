import { useMemo, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

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

  const reasons = useMemo(() => REPORT_REASONS, [])

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
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close report dialog"
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 md:inset-x-4 md:bottom-auto md:top-1/2 md:mx-auto md:max-w-2xl md:-translate-y-1/2 rounded-t-3xl md:rounded-3xl border border-stone-300 bg-stone-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-300 px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-stone-700 transition hover:bg-stone-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <h3 className="text-[1.65rem] leading-none text-stone-800" style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
            Report
          </h3>
          <span className="w-7" aria-hidden="true" />
        </div>

        <div className="border-b border-stone-300 px-6 py-5">
          <p className="text-xl font-semibold text-stone-800">Why are you reporting this post?</p>
          {submitted && <p className="mt-2 text-sm text-emerald-700">Report submitted. Thank you.</p>}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => handleReport(reason)}
              disabled={loading}
              className="flex w-full items-center justify-between border-b border-stone-300 px-6 py-5 text-left text-[1.08rem] text-stone-800 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{reason}</span>
              <ChevronRight size={20} className="text-stone-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
