import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

const EXPORT_SECTIONS = [
  { key: 'attendees', label: 'Attendees', description: 'All registered and approved attendees' },
  { key: 'committees', label: 'Committees', description: 'Committee list with topics and types' },
  { key: 'committee_roster', label: 'Committee Roster', description: 'All delegate and staff assignments' },
  { key: 'guest_delegates', label: 'Guest Delegates', description: 'Externally created delegate accounts' },
  { key: 'submissions', label: 'Submissions', description: 'All documents submitted across committees' },
  { key: 'votes', label: 'Votes', description: 'All votes and results' },
  { key: 'awards', label: 'Awards', description: 'All awards given at this event' },
  { key: 'schedule', label: 'Schedule', description: 'Full event schedule' },
  { key: 'feedback', label: 'Feedback', description: 'Post-conference feedback responses' },
]

export default function EventAdminExport() {
  const { event } = useOutletContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exportData, setExportData] = useState(null)
  const [summary, setSummary] = useState(null)

  async function fetchExport() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/.netlify/functions/export-event?eventId=${event.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Export failed')
      setExportData(data.exports)
      setSummary(data.summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV(key, label) {
    if (!exportData?.[key]) return
    const blob = new Blob([exportData[key]], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event?.name?.replace(/\s+/g, '-').toLowerCase()}-${key}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadAll() {
    if (!exportData) return
    EXPORT_SECTIONS.forEach(section => {
      setTimeout(() => downloadCSV(section.key, section.label), 100)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Event Export</h1>
        <p className="text-sm text-gray-500 mt-1">
          Export all data from {event?.name} for recordkeeping.
        </p>
      </div>

      {/* Generate */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-2">Generate Export</h2>
        <p className="text-sm text-gray-500 mb-4">
          Click below to generate a full export of all event data. Each section can be downloaded individually as a CSV file.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            onClick={fetchExport}
            disabled={loading}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : exportData ? 'Regenerate' : 'Generate Export'}
          </button>
          {exportData && (
            <button
              onClick={downloadAll}
              className="border border-[#1e3a6e] text-[#1e3a6e] font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#e8eef7] transition-colors"
            >
              Download All
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
              <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{value}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{key.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Export sections */}
      {exportData && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Available Exports</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {EXPORT_SECTIONS.map(section => {
              const rows = exportData[section.key]?.split('\n').length - 1
              return (
                <div key={section.key} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{section.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                    <p className="text-xs text-[#b8963e] mt-0.5 font-medium">
                      {Math.max(0, rows - 1)} record{rows !== 2 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadCSV(section.key, section.label)}
                    className="text-xs bg-[#1e3a6e] text-white font-semibold px-4 py-2 rounded hover:bg-[#2d538f] transition-colors flex-shrink-0"
                  >
                    Download CSV
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs text-gray-500 leading-relaxed">
          Exported data contains personally identifiable information. Handle all exports in accordance with your institution's data privacy policies. Do not share exported files publicly. Per our data retention policy, closed event data is retained for 2 years before auto-anonymization.
        </p>
      </div>
    </div>
  )
}