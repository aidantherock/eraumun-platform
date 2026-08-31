import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { useRealtime } from '../../../hooks/useRealtime'

export default function CommitteeHome() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [floorState, setFloorState] = useState(null)
  const [recentInjects, setRecentInjects] = useState([])
  const [stats, setStats] = useState({ submissions: 0, delegates: 0, motions: 0 })
  const [committeeRoster, setCommitteeRoster] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (committee?.id) fetchAll()
  }, [committee?.id])

  useRealtime({
    channel: `committee-home-${committee?.id}`,
    event: 'INSERT',
    table: 'crisis_injects',
    filter: `committee_id=eq.${committee?.id}`,
    callback: (payload) => {
      if (payload.new?.is_published) {
        setRecentInjects(prev => [payload.new, ...prev].slice(0, 3))
      }
    },
    deps: [committee?.id]
  })

  useRealtime({
    channel: `floor-home-${committee?.id}`,
    event: 'UPDATE',
    table: 'floor_state',
    filter: `committee_id=eq.${committee?.id}`,
    callback: (payload) => setFloorState(payload.new),
    deps: [committee?.id]
  })

  async function fetchAll() {
    await Promise.all([
      fetchAnnouncements(),
      fetchFloorState(),
      fetchStats(),
      fetchCommitteeRoster(),
      committee?.type === 'crisis' ? fetchRecentInjects() : Promise.resolve(),
    ])
    setLoading(false)
  }

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('committee_id', committee.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5)
    setAnnouncements(data ?? [])
  }

  async function fetchFloorState() {
    const { data } = await supabase
      .from('floor_state')
      .select('*')
      .eq('committee_id', committee.id)
      .maybeSingle()
    setFloorState(data)
  }

  async function fetchStats() {
    const [{ count: submissions }, { count: delegates }, { count: motions }] = await Promise.all([
      supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('committee_id', committee.id),
      supabase.from('committee_roles').select('*', { count: 'exact', head: true }).eq('committee_id', committee.id),
      supabase.from('motions').select('*', { count: 'exact', head: true }).eq('committee_id', committee.id).eq('status', 'pending'),
    ])
    setStats({ submissions, delegates, motions })
  }

  async function fetchCommitteeRoster() {
    const { data } = await supabase
      .from('committee_roles')
      .select('*, profiles(first_name, last_name, school)')
      .eq('committee_id', committee.id)
      .order('role')
    setCommitteeRoster(data ?? [])
  }

  async function fetchRecentInjects() {
    const { data } = await supabase
      .from('crisis_injects')
      .select('*')
      .eq('committee_id', committee.id)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)
    setRecentInjects(data ?? [])
  }

  const MODE_COLORS = {
    open: 'bg-green-100 text-green-700',
    moderated_caucus: 'bg-blue-100 text-blue-700',
    unmoderated_caucus: 'bg-yellow-100 text-yellow-700',
    voting: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-600',
  }

  const INJECT_COLORS = {
    general: 'border-[#1e3a6e]',
    urgent: 'border-red-500',
    development: 'border-yellow-500',
    resolution: 'border-green-500',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{committee?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {committee?.type === 'crisis' ? 'Crisis Committee' : 'General Assembly'}
          {committee?.topic && ` — ${committee.topic}`}
        </p>
      </div>

      {/* Floor status */}
      {floorState && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Floor Status</p>
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${MODE_COLORS[floorState.mode] ?? 'bg-gray-100 text-gray-600'}`}>
                {floorState.mode?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
            {floorState.speaking_time_seconds && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Speaking Time</p>
                <p className="text-lg font-bold text-[#1e3a6e]">{floorState.speaking_time_seconds}s</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Delegates', value: stats.delegates },
          { label: 'Submissions', value: stats.submissions },
          { label: 'Pending Motions', value: stats.motions, urgent: stats.motions > 0 && isStaff },
        ].map(stat => (
          <div key={stat.label} className={`border rounded-xl px-5 py-4 shadow-sm
            ${stat.urgent ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-2xl font-bold font-serif ${stat.urgent ? 'text-yellow-700' : 'text-[#1e3a6e]'}`}>
              {loading ? '—' : stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Committee Roster */}
      {committeeRoster.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Committee Roster</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {committeeRoster.map(member => (
              <div key={member.id} className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
                <p className="text-sm font-bold text-[#1e3a6e] leading-tight">
                  {member.assignment ?? member.role?.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {member.profiles?.first_name} {member.profiles?.last_name}
                </p>
                {member.profiles?.school && (
                  <p className="text-xs text-gray-400 truncate">{member.profiles.school}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {announcements.length > 0 ? announcements.map(ann => (
              <div key={ann.id} className="px-5 py-3">
                {ann.is_urgent && (
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-0.5">Urgent</span>
                )}
                <p className="text-sm font-semibold text-gray-900">{ann.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ann.content}</p>
              </div>
            )) : (
              <div className="px-5 py-6 text-center text-sm text-gray-400">No announcements.</div>
            )}
          </div>
        </div>

        {/* Crisis feed preview */}
        {committee?.type === 'crisis' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Latest Crisis Updates</h2>
              <Link to="crisis" className="text-xs text-[#1e3a6e] font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentInjects.length > 0 ? recentInjects.map(inject => (
                <div key={inject.id} className={`px-5 py-3 border-l-4 ${INJECT_COLORS[inject.inject_type] ?? INJECT_COLORS.general}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{inject.title}</p>
                    {inject.inject_type === 'urgent' && (
                      <span className="text-xs font-bold text-red-500 uppercase">⚡ Urgent</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{inject.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {inject.published_at ? new Date(inject.published_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : ''}
                  </p>
                </div>
              )) : (
                <div className="px-5 py-6 text-center text-sm text-gray-400">No crisis updates yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${committee?.type === 'crisis' ? 'md:col-span-2' : ''}`}>
          <h2 className="font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Submissions', to: 'submissions' },
              { label: 'Resolutions', to: 'resolutions' },
              { label: 'Floor', to: 'floor' },
              { label: 'Messages', to: 'messages' },
              { label: 'Resources', to: 'resources' },
              ...(committee?.type === 'crisis' ? [{ label: 'Crisis Feed', to: 'crisis' }] : []),
              ...(isStaff ? [{ label: 'Voting', to: 'voting' }] : []),
            ].map(link => (
              <Link key={link.to} to={link.to}
                className="text-sm font-semibold text-center border border-gray-200 text-gray-600 px-4 py-3 rounded-lg hover:border-[#1e3a6e] hover:text-[#1e3a6e] transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}