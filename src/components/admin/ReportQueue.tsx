import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Check, X } from 'lucide-react'
import type { Report } from '../../types'

export default function ReportQueue() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*, stories(title)')
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReports(data as Report[])
    }
    setLoading(false)
  }

  const resolveReport = async (id: string) => {
    await supabase.from('reports').update({ resolved: true }).eq('id', id)
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <p className="text-gray-500">Loading reports...</p>

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Open Reports ({reports.length})</h3>
      {reports.length === 0 ? (
        <p className="text-sm text-gray-400">No open reports</p>
      ) : (
        reports.map((report) => (
          <div key={report.id} className="p-4 border rounded-xl flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{report.stories?.title ?? 'Unknown story'}</p>
              <p className="text-xs text-gray-500">Reason: {report.reason}</p>
              <p className="text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => resolveReport(report.id)}
                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                title="Resolve"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => resolveReport(report.id)}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
