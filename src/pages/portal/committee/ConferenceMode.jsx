import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { useRealtime } from '../../../hooks/useRealtime'

export default function ConferenceMode() {
  const { committeeId } = useParams()
  const { profile, isStaffOrAbove } = useAuth()
  const navigate = useNavigate()
  const [committee, setCommittee] = useState(null)
  const [floorState, setFloorState] = useState(null)
  const [speakers, setSpeakers] = useState([])
  const [injects, setInjects] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [motions, setMotions] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    if (committeeId && profile?.id) fetchAll()
    return () => clearInterval(timerRef.current)
  }, [committeeId, profile?.id])

  useEffect(() => {
    if (floorState?.speaking_time_seconds) {
      setTimer(floorState.speaking_time_seconds)
    }
  }, [floorState?.speaking_time_seconds])

  useRealtime({
    channel: `conf-floor-${committeeId}`,
    event: 'UPDATE',
    table: 'floor_state',
    filter: `committee_id=eq.${committeeId}`,
    callback: (payload) => setFloorState(payload.new),
    deps: [committeeId]
  })

  useRealtime({
    channel: `conf-speakers-${committeeId}`,
    event: '*',
    table: 'speakers_list',
    filter: `committee_id=eq.${committeeId}`,
    callback: () => fetchSpeakers(),
    deps: [committeeId]
  })

  useRealtime({
    channel: `conf-injects-${committeeId}`,
    event: 'INSERT',
    table: 'crisis_injects',
    filter: `committee_id=eq.${committeeId}`,
    callback: (payload) => {
      if (payload.new?.is_published) {
        setInjects(prev => [payload.new, ...prev].slice(0, 5))
      }
    },
    deps: [committeeId]
  })

  useRealtime({
    channel: `conf-motions-${committeeId}`,
    event: '*',
    table: 'motions',
    filter: `committee_id=eq.${committeeId}`,
    callback: () => fetchMotions(),
    deps: [committeeId]
  })

  async function fetchAll() {
    await Promise.all([
      fetchCommittee(),
      fetchFloorState(),
      fetchSpeakers(),
      fetchMotions(),
      fetchAnnouncements(),
      fetchUserRole(),
      fetchInjects(),
    ])
    setLoading(false)
  }

  async function fetchCommittee() {
    const { data } = await supabase
      .from('committees')
      .select('*, events(id, name)')
      .eq('id', committeeId)
      .single()
    setCommittee(data)
  }

  async function fetchFloorState() {
    const { data } = await supabase
      .from('floor_state')
      .select('*')
      .eq('committee_id', committeeId)
      .single()
    setFloorState(data)
    if (data?.speaking_time_seconds) setTimer(data.speaking_time_seconds)
  }

  async function fetchSpeakers() {
    const { data } = await supabase
      .from('speakers_list')
      .select('*, profiles(first_name, last_name)')
      .eq('committee_id', committeeId)
      .in('status', ['waiting', 'speaking'])
      .order('position')
    setSpeakers(data ?? [])
  }

  async function fetchMotions() {
    const { data } = await supabase
      .from('motions')
      .select('*, profiles(first_name, last_name)')
      .eq('committee_id', committeeId)
      .eq('status', 'pending')
      .order('created_at')
    setMotions(data ?? [])
  }

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('committee_id', committeeId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)
    setAnnouncements(data ?? [])
  }

  async function fetchInjects() {
    const { data } = await supabase
      .from('crisis_injects')
      .select('*')
      .eq('committee_id', committeeId)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(5)
    setInjects(data ?? [])
  }

  async function fetchUserRole() {
    const { data } = await supabase
      .from('committee_roles')
      .select('role')
      .eq('committee_id', committeeId)
      .eq('user_id', profile.id)
      .single()
    setUserRole(data?.role ?? null)
  }

  const isStaff = isStaffOrAbove || userRole === 'chair' || userRole === 'staff'

  function startTimer() {
    setTimerRunning(true)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopTimer() {
    clearInterval(timerRef.current)
    setTimerRunning(false)
  }

  function resetTimer() {
    stopTimer()
    setTimer(floorState?.speaking_time_seconds ?? 60)
  }

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const MODE_COLORS = {
    open: 'text-green-400',
    moderated_caucus: 'text-blue-400',
    unmoderated_caucus: 'text-yellow-400',
    voting: 'text-red-400',
    closed: 'text-gray-400',
  }

  const currentSpeaker = speakers.find(s => s.status === 'speaking')
  const queue = speakers.filter(s => s.status === 'waiting')

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
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62]">Conference Mode</p>
            <p className="text-sm font-semibold text-white">{committee?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {committee?.events?.name && (
            <span className="text-xs text-white/40">{committee.events.name}</span>
          )}
          <button
            onClick={() => navigate(`/portal/committee/${committeeId}`)}
            className="text-xs border border-white/20 text-white/60 px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">

        {/* Left — Floor status & timer */}
        <div className="col-span-3 flex flex-col gap-4">

          {/* Floor mode */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Floor</p>
            <p className={`text-lg font-bold capitalize ${MODE_COLORS[floorState?.mode] ?? 'text-white'}`}>
              {floorState?.mode?.replace(/_/g, ' ') ?? 'Unknown'}
            </p>
          </div>

          {/* Timer */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Timer</p>
            <p className={`font-serif text-5xl font-bold text-center mb-4 ${timer === 0 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(timer)}
            </p>
            {isStaff && (
              <div className="flex gap-2 justify-center">
                {!timerRunning ? (
                  <button onClick={startTimer}
                    className="text-xs bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700 transition-colors">
                    Start
                  </button>
                ) : (
                  <button onClick={stopTimer}
                    className="text-xs bg-yellow-500 text-white font-semibold px-4 py-2 rounded hover:bg-yellow-600 transition-colors">
                    Pause
                  </button>
                )}
                <button onClick={resetTimer}
                  className="text-xs border border-white/20 text-white/60 font-semibold px-4 py-2 rounded hover:bg-white/10 transition-colors">
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Pending motions */}
          {motions.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                Pending Motions ({motions.length})
              </p>
              <div className="space-y-2">
                {motions.slice(0, 3).map(motion => (
                  <div key={motion.id} className="text-xs text-white/70 bg-white/5 rounded-lg px-3 py-2">
                    <p className="font-medium">{motion.profiles?.first_name} {motion.profiles?.last_name}</p>
                    <p className="text-white/40 mt-0.5">
                      {motion.motion_type === 'custom' ? motion.custom_text : motion.motion_type}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center — Current speaker & queue */}
        <div className="col-span-6 flex flex-col gap-4">

          {/* Current speaker */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex-shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Now Speaking</p>
            {currentSpeaker ? (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#1e3a6e] border-4 border-[#d4af62] flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {currentSpeaker.profiles?.first_name?.charAt(0)}{currentSpeaker.profiles?.last_name?.charAt(0)}
                </div>
                <p className="font-serif text-2xl font-bold text-white">
                  {currentSpeaker.profiles?.first_name} {currentSpeaker.profiles?.last_name}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-white/30 text-sm">No one currently speaking</p>
              </div>
            )}
          </div>

          {/* Speakers queue */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
              Speakers List ({queue.length})
            </p>
            {queue.length > 0 ? (
              <div className="space-y-2">
                {queue.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                    <span className="text-xs font-bold text-white/30 w-5">{i + 1}</span>
                    <p className="text-sm text-white/80">
                      {s.profiles?.first_name} {s.profiles?.last_name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/30 text-sm text-center py-4">Speakers list is empty.</p>
            )}
          </div>
        </div>

        {/* Right — Announcements & crisis feed */}
        <div className="col-span-3 flex flex-col gap-4">

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Announcements</p>
              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="text-xs">
                    {ann.is_urgent && (
                      <span className="text-red-400 font-bold uppercase text-[10px] tracking-widest block mb-0.5">Urgent</span>
                    )}
                    <p className="font-semibold text-white/80">{ann.title}</p>
                    <p className="text-white/40 mt-0.5 leading-relaxed line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crisis feed */}
          {committee?.type === 'crisis' && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                Crisis Updates
              </p>
              {injects.length > 0 ? (
                <div className="space-y-3">
                  {injects.map(inject => (
                    <div key={inject.id} className={`text-xs border-l-2 pl-3
                      ${inject.inject_type === 'urgent' ? 'border-red-500' :
                        inject.inject_type === 'development' ? 'border-yellow-500' :
                        inject.inject_type === 'resolution' ? 'border-green-500' :
                        'border-[#1e3a6e]'}`}>
                      {inject.inject_type === 'urgent' && (
                        <span className="text-red-400 font-bold text-[10px] uppercase tracking-widest block mb-0.5">⚡ Urgent</span>
                      )}
                      <p className="font-semibold text-white/80">{inject.title}</p>
                      <p className="text-white/40 mt-0.5 leading-relaxed line-clamp-3">{inject.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-sm text-center py-4">No crisis updates yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}