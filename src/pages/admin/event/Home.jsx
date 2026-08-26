import { useOutletContext } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function EventAdminHome() {
  const { event } = useOutletContext()
  const [stats, setStats] = useState({ committees: 0, delegates: 0, submissions: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (event?.id) fetchStats()
  }, [event?.id])

  async function fetchStats() {
    const [
      { count: committees },
      { count: submissions },
    ] = await Promise.all([
      supabase.from('committees').select('*', { count: 'exact', head: true }).eq('event_id', event.id),
      supabase.from('submissions').select('*, committees!inner(event_id)', { count: 'exact', head: true }).eq('committees.event_id', event.id),
    ])
    setStats({ committees, submissions })
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{event?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Event overview and management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Committees', value: stats.committees },
          { label: 'Total Submissions', value: stats.submissions },
          { label: 'Status', value: event?.status ?? '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{loading ? '—' : stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Event Details</h2>
        <div className="space-y-3">
          {[
            ['Location', event?.location],
            ['Start Date', event?.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null],
            ['End Date', event?.end_date ? new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null],
            ['Hotel', event?.hotel_info],
            ['Schedule', event?.schedule_url],
            ['Type', event?.is_away_conference ? 'Away Conference' : 'Hosted Event'],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</p>
              <p className="text-sm text-gray-700">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}