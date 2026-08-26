import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const MODES = [
  { id: 'open', label: 'Open Floor' },
  { id: 'moderated_caucus', label: 'Moderated Caucus' },
  { id: 'unmoderated_caucus', label: 'Unmoderated Caucus' },
  { id: 'voting', label: 'Voting Procedure' },
  { id: 'closed', label: 'Closed' },
]

const PRESET_MOTIONS = [
  'Motion to Open Debate',
  'Motion to Close Debate',
  'Motion to Set Speaking Time',
  'Motion for Moderated Caucus',
  'Motion for Unmoderated Caucus',
  'Motion to Table',
  'Motion to Vote',
  'Motion to Adjourn',
]

const MODE_COLORS = {
  open: 'bg-green-100 text-green-700 border-green-200',
  moderated_caucus: 'bg-blue-100 text-blue-700 border-blue-200',
  unmoderated_caucus: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  voting: 'bg-red-100 text-red-700 border-red-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function CommitteeFloor() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [floorState, setFloorState] = useState(null)
  const [speakers, setSpeakers] = useState([])
  const [motions, setMotions] = useState([])
  const [delegates, setDelegates] = useState([])
  const [timer, setTimer] = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [motionText, setMotionText] = useState('')
  const [motionType, setMotionType] = useState('')
  const [showMotionForm, setShowMotionForm] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    if (committee?.id) {
      fetchFloorState()
      fetchSpeakers()
      fetchMotions()
      fetchDelegates()
    }
    return () => clearInterval(timerRef.current)
  }, [committee?.id])

  useEffect(() => {
    if (floorState?.speaking_time_seconds) {
      setTimeLeft(floorState.speaking_time_seconds)
    }
  }, [floorState?.speaking_time_seconds])

  async function fetchFloorState() {
    const { data } = await supabase
      .from('floor_state')
      .select('*')
      .eq('committee_id', committee.id)
      .single()
    setFloorState(data)
  }

  async function fetchSpeakers() {
    const { data } = await supabase
      .from('speakers_list')
      .select('*, profiles(first_name, last_name)')
      .eq('committee_id', committee.id)
      .in('status', ['waiting', 'speaking'])
      .order('position')
    setSpeakers(data ?? [])
  }

  async function fetchMotions() {
    const { data } = await supabase
      .from('motions')
      .select('*, profiles(first_name, last_name)')
      .eq('committee_id', committee.id)
      .eq('status', 'pending')
      .order('created_at')
    setMotions(data ?? [])
  }

  async function fetchDelegates() {
    const { data } = await supabase
      .from('committee_roles')
      .select('*, profiles(id, first_name, last_name)')
      .eq('committee_id', committee.id)
      .in('role', ['delegate', 'head_delegate'])
    setDelegates(data ?? [])
  }

  async function updateFloorMode(mode) {
    await supabase.from('floor_state').update({
      mode,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }).eq('committee_id', committee.id)
    fetchFloorState()
  }

  async function updateSpeakingTime(seconds) {
    await supabase.from('floor_state').update({
      speaking_time_seconds: seconds,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }).eq('committee_id', committee.id)
    setTimeLeft(seconds)
    fetchFloorState()
  }

  async function addSpeaker(userId) {
    const maxPos = speakers.length > 0 ? Math.max(...speakers.map(s => s.position)) : 0
    await supabase.from('speakers_list').insert({
      committee_id: committee.id,
      user_id: userId,
      position: maxPos + 1,
      status: 'waiting',
    })
    fetchSpeakers()
  }

  async function markSpeaking(speakerId) {
    await supabase.from('speakers_list')
      .update({ status: 'speaking' })
      .eq('committee_id', committee.id)
      .eq('status', 'speaking')

    await supabase.from('speakers_list')
      .update({ status: 'speaking' })
      .eq('id', speakerId)

    setTimeLeft(floorState?.speaking_time_seconds ?? 60)
    fetchSpeakers()
  }

  async function markDone(speakerId) {
    await supabase.from('speakers_list').update({ status: 'done' }).eq('id', speakerId)
    stopTimer()
    fetchSpeakers()
  }

  async function clearSpeakers() {
    await supabase.from('speakers_list').delete().eq('committee_id', committee.id)
    fetchSpeakers()
  }

  async function respondMotion(motionId, status) {
    await supabase.from('motions').update({ status }).eq('id', motionId)
    fetchMotions()
  }

  async function submitMotion(e) {
    e.preventDefault()
    await supabase.from('motions').insert({
      committee_id: committee.id,
      submitted_by: profile.id,
      motion_type: motionType || null,
      custom_text: motionType === 'custom' ? motionText : null,
      status: 'pending',
    })
    setMotionText('')
    setMotionType('')
    setShowMotionForm(false)
    fetchMotions()
  }

  async function sendAnnouncement(e) {
    e.preventDefault()
    if (!announcement.trim()) return
    await supabase.from('announcements').insert({
      committee_id: committee.id,
      created_by: profile.id,
      title: 'Committee Announcement',
      content: announcement,
      visibility: 'committee',
      status: 'published',
      published_at: new Date().toISOString(),
    })
    setAnnouncement('')
  }

  async function toggleSharingPeriod() {
    await supabase.from('committees').update({
      sharing_period_active: !committee?.sharing_period_active
    }).eq('id', committee.id)
    fetchFloorState()
  }

  function startTimer() {
    setTimerRunning(true)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
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
    setTimeLeft(floorState?.speaking_time_seconds ?? 60)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!isStaff) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Floor</h1>
          <p className="text-sm text-gray-500 mt-1">Submit motions to the dais.</p>
        </div>

        {/* Floor status */}
        {floorState && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Current Floor Status</p>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${MODE_COLORS[floorState.mode]}`}>
              {floorState.mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        )}

        {/* Submit motion */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Submit a Motion</h2>
          <form onSubmit={submitMotion} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {PRESET_MOTIONS.map(motion => (
                <button
                  key={motion}
                  type="button"
                  onClick={() => setMotionType(motion)}
                  className={`text-xs px-3 py-2 rounded-lg border text-left transition-all
                    ${motionType === motion ? 'border-[#1e3a6e] bg-[#e8eef7] text-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}
                >
                  {motion}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMotionType('custom')}
                className={`text-xs px-3 py-2 rounded-lg border text-left transition-all
                  ${motionType === 'custom' ? 'border-[#1e3a6e] bg-[#e8eef7] text-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}
              >
                Custom Motion
              </button>
            </div>
            {motionType === 'custom' && (
              <textarea
                value={motionText}
                onChange={e => setMotionText(e.target.value)}
                placeholder="Describe your motion..."
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] resize-none"
              />
            )}
            <button
              type="submit"
              disabled={!motionType}
              className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50"
            >
              Submit Motion
            </button>
          </form>
        </div>

        {/* Speakers list */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Speakers List</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {speakers.length > 0 ? speakers.map((s, i) => (
              <div key={s.id} className={`px-6 py-3 flex items-center gap-3 ${s.status === 'speaking' ? 'bg-green-50' : ''}`}>
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e]">
                  {s.profiles?.first_name?.charAt(0)}{s.profiles?.last_name?.charAt(0)}
                </div>
                <p className="text-sm text-gray-900">{s.profiles?.first_name} {s.profiles?.last_name}</p>
                {s.status === 'speaking' && (
                  <span className="text-xs font-bold text-green-600 ml-auto">Speaking</span>
                )}
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Speakers list is empty.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Floor Management</h1>
        <p className="text-sm text-gray-500 mt-1">Control the committee floor, speakers list, and motions.</p>
      </div>

      {/* Floor mode */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Floor Mode</h2>
        <div className="flex flex-wrap gap-2">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => updateFloorMode(mode.id)}
              className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-all
                ${floorState?.mode === mode.id
                  ? MODE_COLORS[mode.id]
                  : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e] hover:text-[#1e3a6e]'
                }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Timer */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Speaking Timer</h2>
          <div className={`text-5xl font-bold font-serif text-center mb-4 ${timeLeft === 0 ? 'text-red-500' : 'text-[#1e3a6e]'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-2 justify-center mb-4">
            {!timerRunning ? (
              <button onClick={startTimer} className="bg-green-600 text-white font-semibold text-sm px-4 py-2 rounded hover:bg-green-700 transition-colors">
                Start
              </button>
            ) : (
              <button onClick={stopTimer} className="bg-yellow-500 text-white font-semibold text-sm px-4 py-2 rounded hover:bg-yellow-600 transition-colors">
                Pause
              </button>
            )}
            <button onClick={resetTimer} className="border border-gray-200 text-gray-600 font-semibold text-sm px-4 py-2 rounded hover:border-gray-400 transition-colors">
              Reset
            </button>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Set speaking time (seconds):</p>
            <div className="flex gap-2">
              {[30, 45, 60, 90, 120].map(s => (
                <button
                  key={s}
                  onClick={() => updateSpeakingTime(s)}
                  className={`text-xs px-2.5 py-1.5 rounded border transition-all
                    ${floorState?.speaking_time_seconds === s ? 'bg-[#e8eef7] border-[#1e3a6e] text-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Speakers list */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Speakers List</h2>
            <button onClick={clearSpeakers} className="text-xs text-red-400 hover:text-red-600 font-medium">Clear All</button>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <select
                onChange={e => { if (e.target.value) addSpeaker(e.target.value); e.target.value = '' }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
                defaultValue=""
              >
                <option value="">Add delegate to speakers list...</option>
                {delegates.map(d => (
                  <option key={d.id} value={d.profiles?.id}>
                    {d.profiles?.first_name} {d.profiles?.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-gray-100">
              {speakers.length > 0 ? speakers.map((s, i) => (
                <div key={s.id} className={`py-2.5 flex items-center gap-3 ${s.status === 'speaking' ? 'bg-green-50 rounded-lg px-2' : ''}`}>
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <p className="text-sm flex-1 text-gray-900">{s.profiles?.first_name} {s.profiles?.last_name}</p>
                  <div className="flex gap-1">
                    {s.status === 'waiting' && (
                      <button onClick={() => markSpeaking(s.id)}
                        className="text-xs text-green-600 font-semibold hover:underline">Speak</button>
                    )}
                    {s.status === 'speaking' && (
                      <button onClick={() => markDone(s.id)}
                        className="text-xs text-red-500 font-semibold hover:underline">Done</button>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">No speakers queued.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Motions queue */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Motions Queue</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {motions.length > 0 ? motions.map(motion => (
            <div key={motion.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {motion.motion_type === 'custom' ? motion.custom_text : motion.motion_type}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {motion.profiles?.first_name} {motion.profiles?.last_name}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => respondMotion(motion.id, 'approved')}
                  className="text-xs text-green-600 font-semibold border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition-colors">
                  Approve
                </button>
                <button onClick={() => respondMotion(motion.id, 'denied')}
                  className="text-xs text-red-500 font-semibold border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                  Deny
                </button>
                <button onClick={() => respondMotion(motion.id, 'tabled')}
                  className="text-xs text-gray-500 font-semibold border border-gray-200 px-3 py-1 rounded hover:bg-gray-50 transition-colors">
                  Table
                </button>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No pending motions.</div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Send Committee Announcement</h2>
        <form onSubmit={sendAnnouncement} className="flex gap-3">
          <input
            type="text"
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            placeholder="Type an announcement..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
          />
          <button
            type="submit"
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
          >
            Send
          </button>
        </form>

        {/* Sharing period toggle */}
        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Sharing Period</p>
            <p className="text-xs text-gray-500">Allow delegates to view and comment on public resolutions.</p>
          </div>
          <button
            onClick={toggleSharingPeriod}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${committee?.sharing_period_active ? 'bg-[#1e3a6e]' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${committee?.sharing_period_active ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}