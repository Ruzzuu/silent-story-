import { useState } from 'react'
import { Flag } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface ReportButtonProps {
  storyId: string
  reporterId: string
}

const reasons = ['spam', 'hate speech', 'harassment', 'inappropriate content', 'misinformation']

export default function ReportButton({ storyId, reporterId }: ReportButtonProps) {
  const [showReasons, setShowReasons] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReport = async (reason: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('reports')
      .insert({ story_id: storyId, reporter_id: reporterId, reason })

    if (!error) {
      setSubmitted(true)
    }
    setLoading(false)
    setShowReasons(false)
  }

  if (submitted) {
    return <p className="text-sm text-gray-500">Report submitted. Thank you.</p>
  }

  return (
    <div>
      {!showReasons ? (
        <button
          onClick={() => setShowReasons(true)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition"
        >
          <Flag size={14} />
          Report this story
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Select a reason:</p>
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => handleReport(reason)}
              disabled={loading}
              className="block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 hover:text-red-700 transition disabled:opacity-50"
            >
              {reason}
            </button>
          ))}
          <button
            onClick={() => setShowReasons(false)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
