import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRealtime } from '../../hooks/useRealtime'

export default function StaffControlRoom() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [committees, setCommittees] = useState([])
  const [floorStates, setFloorStates] = useState({})
  const [speakerCounts, setSpeakerCounts] = useState({})
  const [motionCounts, setMotionCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) fetchAll()
  }, [eventId])

  useRealtime({
    channel: `control-room-floor-${eventId}`,
    event: 'UPDATE',
    table: 'floor_state',
    callback: (payload) => {
      setFloorStates(prev => ({
        ...prev,
        [payload.new.committee_id]: payload.new
      }))
    },
    deps: [eventId]
  })

  useRealtime({
    channel: `control-room-motions-${eventId}`,
    event: '*',
    table: 'motions',
    callback: () => fetchMotionCounts(),
    deps: [eventId]
  })

  useRealtime({
    channel: `control-room-speakers-${eventId}`,
    event: '*',
    table: 'speakers_list',
    callback: () => fetchSpeakerCounts(),
    deps: [eventId]
  })

  async function fetchAll() {
    await Promise.all([
      fetchEvent(),
      fetchCommittees(),
    ])
    setLoading(false)
  }

  async function fetchEvent() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    setEvent(data)
  }

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committees')
      .select('*')
      .eq('event_id', eventId)
      .order('name')
    setCommittees(data ?? [])

    if (data?.length) {
      await Promise.all([
        fetchFloorStates(data.map(c => c.id)),
        fetchSpeakerCounts(data.map(c => c.id)),
        fetchMotionCounts(data.map(c => c.id)),
      ])
    }
  }

  async function fetchFloorStates(committeeIds) {
    const { data } = await supabase
      .from('floor_state')
      .select('*')
      .in('committee_id', committeeIds)
    const map = {}
    for (const fs of data ?? []) map[fs.committee_id] = fs
    setFloorStates(map)
  }

  async function fetchSpeakerCounts(committeeIds) {
    const ids = committeeIds ?? committees.map(c => c.id)
    if (!ids.length) return
    const { data } = await supabase
      .from('speakers_list')
      .select('committee_id')
      .in('committee_id', ids)
      .in('status', ['waiting', 'speaking'])
    const map = {}
    for (const s of data ?? []) {
      map[s.committee_id] = (map[s.committee_id] ?? 0) + 1
    }
    setSpeakerCounts(map)
  }

  async function fetchMotionCounts(committeeIds) {
    const ids = committeeIds ?? committees.map(c => c.id)
    if (!ids.length) return
    const { data } = await supabase
      .from('motions')
      .select('committee_id')
      .in('committee_id', ids)
      .eq('status', 'pending')
    const map = {}
    for (const m of data ?? []) {
      map[m.committee_id] = (map[m.committee_id] ?? 0) + 1
    }
    setMotionCounts(map)
  }

  const MODE_COLORS = {
    open: 'bg-green-500/20 text-green-400 border-green-500/30',
    moderated_caucus: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    unmoderated_caucus: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    voting: 'bg-red-500/20 text-red-400 border-red-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4af62]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-8 brightness-0 invert opacity-70" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62]">Staff Control Room</p>
            <p className="text-sm font-semibold text-white">{event?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/portal/events/${eventId}`}
            className="text-xs border border-white/20 text-white/60 px-3 py-1.5 rounded hover:bg-white/10 transition-colors">
            Event Portal
          </Link>
          <Link to={`/admin/event/${eventId}`}
            className="text-xs border border-[#d4af62]/30 text-[#d4af62] px-3 py-1.5 rounded hover:bg-[#d4af62]/10 transition-colors">
            Admin Panel
          </Link>
          <button onClick={() => navigate('/portal')}
            className="text-xs border border-white/20 text-white/60 px-3 py-1.5 rounded hover:bg-white/10 transition-colors">
            Exit
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-white/10 px-6 py-3 grid grid-cols-4 gap-4">
        {[
          { label: 'Committees', value: committees.length },
          { label: 'Active Speakers', value: Object.values(speakerCounts).reduce((a, b) => a + b, 0) },
          { label: 'Pending Motions', value: Object.values(motionCounts).reduce((a, b) => a + b, 0) },
          { label: 'Event Status', value: event?.status ?? '—' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="font-serif text-2xl font-bold text-[#d4af62] capitalize">{stat.value}</p>
            <p className="text-xs text-white/40 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Committee cards */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {committees.map(committee => {
            const floor = floorStates[committee.id]
            const speakers = speakerCounts[committee.id] ?? 0
            const motions = motionCounts[committee.id] ?? 0
            const modeColor = MODE_COLORS[floor?.mode] ?? MODE_COLORS.closed

            return (
              <div key={committee.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-1">
                        {committee.type === 'crisis' ? 'Crisis' : 'GA'}
                      </p>
                      <p className="font-semibold text-white">{committee.name}</p>
                      {committee.topic && (
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{committee.topic}</p>
                      )}
                    </div>
                    {floor?.mode && (
                      <span className={`text-xs font-bold px-2 py-1 rounded border capitalize flex-shrink-0 ${modeColor}`}>
                        {floor.mode.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-white">{speakers}</p>
                    <p className="text-xs text-white/40">Speakers</p>
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-center ${motions > 0 ? 'bg-yellow-500/10' : 'bg-white/5'}`}>
                    <p className={`text-lg font-bold ${motions > 0 ? 'text-yellow-400' : 'text-white'}`}>{motions}</p>
                    <p className="text-xs text-white/40">Motions</p>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-white/10 flex gap-2">
                  <Link
                    to={`/portal/committee/${committee.id}`}
                    className="flex-1 text-xs text-center font-semibold border border-white/20 text-white/60 px-3 py-2 rounded hover:bg-white/10 transition-colors"
                  >
                    Committee
                  </Link>
                  <Link
                    to={`/portal/committee/${committee.id}/conference`}
                    className="flex-1 text-xs text-center font-semibold border border-[#d4af62]/30 text-[#d4af62] px-3 py-2 rounded hover:bg-[#d4af62]/10 transition-colors"
                  >
                    Conf Mode
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}