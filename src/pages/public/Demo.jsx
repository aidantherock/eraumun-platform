import { useState, useEffect, useRef } from 'react'

const MOCK_COMMITTEE = {
  name: 'Security Council',
  type: 'crisis',
  topic: 'Escalating Tensions in the South China Sea',
}

const MOCK_DELEGATES = [
  { id: '1', name: 'Alexandra Chen', country: 'United States' },
  { id: '2', name: 'Marcus Rivera', country: 'United Kingdom' },
  { id: '3', name: 'Priya Patel', country: 'India' },
  { id: '4', name: 'Yuki Tanaka', country: 'Japan' },
  { id: '5', name: 'Omar Hassan', country: 'Egypt' },
  { id: '6', name: 'Sofia Rossi', country: 'France' },
]

const MOCK_INJECTS = [
  {
    id: '1',
    title: 'Breaking: Naval Vessels Spotted in Disputed Waters',
    content: 'Three naval vessels from an unidentified nation have been spotted approaching the disputed Spratly Islands. Regional powers are demanding an immediate UN response.',
    type: 'urgent',
  },
  {
    id: '2',
    title: 'Economic Sanctions Proposed by Major Powers',
    content: 'A coalition of western nations has proposed sweeping economic sanctions targeting maritime shipping routes. Trade partners are expressing serious concern over supply chain disruptions.',
    type: 'development',
  },
  {
    id: '3',
    title: 'Emergency Ceasefire Talks Requested',
    content: 'The Secretary-General has requested emergency ceasefire talks following reports of a minor naval incident. All parties have been summoned to an emergency session.',
    type: 'general',
  },
]

const FLOOR_MODES = [
  { id: 'open', label: 'Open Floor', color: 'bg-green-500' },
  { id: 'moderated_caucus', label: 'Moderated Caucus', color: 'bg-blue-500' },
  { id: 'unmoderated_caucus', label: 'Unmoderated Caucus', color: 'bg-yellow-500' },
  { id: 'voting', label: 'Voting Procedure', color: 'bg-red-500' },
  { id: 'closed', label: 'Closed', color: 'bg-gray-500' },
]

const INJECT_COLORS = {
  urgent: 'border-red-500 bg-red-50',
  development: 'border-yellow-500 bg-yellow-50',
  general: 'border-[#1e3a6e] bg-[#e8eef7]',
}

const INJECT_BADGES = {
  urgent: 'bg-red-100 text-red-700',
  development: 'bg-yellow-100 text-yellow-700',
  general: 'bg-[#e8eef7] text-[#1e3a6e]',
}

const DEFAULT_STATE = {
  floorMode: 'open',
  speakingTime: 60,
  timer: 60,
  timerRunning: false,
  speakers: [],
  currentSpeaker: null,
  publishedInjects: [],
  notes: [],
  motions: [],
  view: 'delegate',
}

export default function Demo() {
  const [state, setState] = useState(DEFAULT_STATE)
  const [noteInput, setNoteInput] = useState('')
  const [replyInput, setReplyInput] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [motionInput, setMotionInput] = useState('')
  const [selectedDelegate, setSelectedDelegate] = useState(MOCK_DELEGATES[0])
  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  function reset() {
    clearInterval(timerRef.current)
    setState(DEFAULT_STATE)
    setNoteInput('')
    setReplyInput('')
    setReplyingTo(null)
    setMotionInput('')
    setSelectedDelegate(MOCK_DELEGATES[0])
  }

  function setFloorMode(mode) {
    setState(prev => ({ ...prev, floorMode: mode }))
  }

  function startTimer() {
    setState(prev => ({ ...prev, timerRunning: true }))
    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.timer <= 1) {
          clearInterval(timerRef.current)
          return { ...prev, timer: 0, timerRunning: false }
        }
        return { ...prev, timer: prev.timer - 1 }
      })
    }, 1000)
  }

  function stopTimer() {
    clearInterval(timerRef.current)
    setState(prev => ({ ...prev, timerRunning: false }))
  }

  function resetTimer() {
    clearInterval(timerRef.current)
    setState(prev => ({ ...prev, timer: prev.speakingTime, timerRunning: false }))
  }

  function addSpeaker(delegate) {
    setState(prev => {
      if (prev.speakers.find(s => s.id === delegate.id)) return prev
      return { ...prev, speakers: [...prev.speakers, delegate] }
    })
  }

  function nextSpeaker() {
    clearInterval(timerRef.current)
    setState(prev => {
      const remaining = prev.speakers.slice(1)
      return {
        ...prev,
        currentSpeaker: prev.speakers[0] ?? null,
        speakers: remaining,
        timer: prev.speakingTime,
        timerRunning: false,
      }
    })
  }

  function publishInject(inject) {
    setState(prev => ({
      ...prev,
      publishedInjects: [{ ...inject, publishedAt: new Date() }, ...prev.publishedInjects],
    }))
  }

  function submitNote() {
    if (!noteInput.trim()) return
    setState(prev => ({
      ...prev,
      notes: [...prev.notes, {
        id: Date.now().toString(),
        from: selectedDelegate.name,
        country: selectedDelegate.country,
        content: noteInput.trim(),
        reply: null,
        createdAt: new Date(),
      }]
    }))
    setNoteInput('')
  }

  function submitReply(noteId) {
    if (!replyInput.trim()) return
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === noteId
        ? { ...n, reply: replyInput.trim() }
        : n
      )
    }))
    setReplyInput('')
    setReplyingTo(null)
  }

  function submitMotion() {
    if (!motionInput.trim()) return
    setState(prev => ({
      ...prev,
      motions: [...prev.motions, {
        id: Date.now().toString(),
        from: selectedDelegate.name,
        text: motionInput.trim(),
        status: 'pending',
        createdAt: new Date(),
      }]
    }))
    setMotionInput('')
  }

  function updateMotion(id, status) {
    setState(prev => ({
      ...prev,
      motions: prev.motions.map(m => m.id === id ? { ...m, status } : m)
    }))
  }

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const currentMode = FLOOR_MODES.find(m => m.id === state.floorMode)
  const isStaffView = state.view === 'staff'
  const unpublishedInjects = MOCK_INJECTS.filter(i =>
    !state.publishedInjects.find(p => p.id === i.id)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo banner */}
      <div className="bg-[#b8963e] px-6 py-2 text-center">
        <p className="text-xs font-bold text-white uppercase tracking-widest">
          ⚡ Interactive Demo — No data is saved. This simulates the ERAU-MUN conference platform.
        </p>
      </div>

      {/* Header */}
      <div className="bg-[#1e3a6e] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-0.5">
              Demo — {MOCK_COMMITTEE.name}
            </p>
            <p className="text-sm text-white/60">{MOCK_COMMITTEE.topic}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              {['delegate', 'staff'].map(v => (
                <button key={v} onClick={() => setState(prev => ({ ...prev, view: v }))}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors capitalize
                    ${state.view === v ? 'bg-white text-[#1e3a6e]' : 'text-white/60 hover:text-white'}`}>
                  {v} View
                </button>
              ))}
            </div>
            <button onClick={reset}
              className="text-xs border border-white/30 text-white/70 font-semibold px-4 py-2 rounded hover:bg-white/10 transition-colors">
              Reset Demo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-4">

            {/* Floor status */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Floor Status</h2>
                <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${currentMode?.color}`}>
                  {currentMode?.label}
                </span>
              </div>

              {isStaffView && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {FLOOR_MODES.map(mode => (
                    <button key={mode.id} onClick={() => setFloorMode(mode.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                        ${state.floorMode === mode.id
                          ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                          : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
                      {mode.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Timer */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Speaking Timer</p>
                <p className={`font-serif text-5xl font-bold mb-4 ${state.timer === 0 ? 'text-red-500' : 'text-[#1e3a6e]'}`}>
                  {formatTime(state.timer)}
                </p>
                {isStaffView && (
                  <div className="flex justify-center gap-2">
                    {!state.timerRunning ? (
                      <button onClick={startTimer} disabled={state.timer === 0}
                        className="text-xs bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50">
                        Start
                      </button>
                    ) : (
                      <button onClick={stopTimer}
                        className="text-xs bg-yellow-500 text-white font-semibold px-4 py-2 rounded hover:bg-yellow-600 transition-colors">
                        Pause
                      </button>
                    )}
                    <button onClick={resetTimer}
                      className="text-xs border border-gray-300 text-gray-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition-colors">
                      Reset
                    </button>
                    <button onClick={nextSpeaker} disabled={state.speakers.length === 0}
                      className="text-xs bg-[#1e3a6e] text-white font-semibold px-4 py-2 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                      Next Speaker
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Speakers list */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">
                Speakers List
                {state.currentSpeaker && (
                  <span className="ml-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    Now: {state.currentSpeaker.name}
                  </span>
                )}
              </h2>

              {!isStaffView && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Add yourself to the speakers list:</p>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_DELEGATES.map(d => (
                      <button key={d.id} onClick={() => addSpeaker(d)}
                        disabled={!!state.speakers.find(s => s.id === d.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                          border-gray-200 text-gray-600 hover:border-[#1e3a6e] hover:text-[#1e3a6e] disabled:opacity-40 disabled:cursor-not-allowed">
                        {d.country}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {state.speakers.length > 0 ? (
                <div className="space-y-2">
                  {state.speakers.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No speakers queued.</p>
              )}
            </div>

            {/* Motions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Motions</h2>

              {!isStaffView && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={motionInput}
                    onChange={e => setMotionInput(e.target.value)}
                    placeholder="e.g. Motion to open moderated caucus..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                  />
                  <button onClick={submitMotion}
                    className="text-xs bg-[#1e3a6e] text-white font-semibold px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
                    Submit
                  </button>
                </div>
              )}

              {state.motions.length > 0 ? (
                <div className="space-y-2">
                  {state.motions.map(motion => (
                    <div key={motion.id} className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{motion.from}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{motion.text}</p>
                        </div>
                        {isStaffView ? (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => updateMotion(motion.id, 'approved')}
                              className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded hover:bg-green-200 transition-colors">
                              Approve
                            </button>
                            <button onClick={() => updateMotion(motion.id, 'denied')}
                              className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-200 transition-colors">
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0
                            ${motion.status === 'approved' ? 'bg-green-100 text-green-700'
                              : motion.status === 'denied' ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'}`}>
                            {motion.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No motions submitted.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">

            {/* Crisis feed */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Crisis Feed</h2>

              {isStaffView && unpublishedInjects.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Publish an Update</p>
                  {unpublishedInjects.map(inject => (
                    <div key={inject.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-gray-700 truncate">{inject.title}</p>
                      <button onClick={() => publishInject(inject)}
                        className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors flex-shrink-0">
                        Publish
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {state.publishedInjects.length > 0 ? (
                <div className="space-y-3">
                  {state.publishedInjects.map(inject => (
                    <div key={inject.id} className={`border-l-4 rounded-lg p-4 ${INJECT_COLORS[inject.type]}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${INJECT_BADGES[inject.type]}`}>
                          {inject.type === 'urgent' ? '⚡ Urgent' : inject.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {inject.publishedAt?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{inject.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{inject.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-400">No crisis updates yet.</p>
                  {isStaffView && <p className="text-xs text-gray-300 mt-1">Publish an update above to see it here.</p>}
                </div>
              )}
            </div>

            {/* Crisis notes */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Crisis Notes</h2>

              {!isStaffView && (
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <select
                      value={selectedDelegate.id}
                      onChange={e => setSelectedDelegate(MOCK_DELEGATES.find(d => d.id === e.target.value))}
                      className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
                    >
                      {MOCK_DELEGATES.map(d => (
                        <option key={d.id} value={d.id}>{d.name} — {d.country}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      placeholder="Send a private note to the crisis director..."
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    />
                    <button onClick={submitNote}
                      className="text-xs bg-[#1e3a6e] text-white font-semibold px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              )}

              {state.notes.length > 0 ? (
                <div className="space-y-3">
                  {state.notes.map(note => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-bold text-gray-700">{note.from}</p>
                        <span className="text-xs text-gray-400">— {note.country}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-2">{note.content}</p>

                      {note.reply ? (
                        <div className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded px-3 py-2 mt-2">
                          <p className="text-xs font-bold text-[#1e3a6e] mb-0.5">Crisis Director</p>
                          <p className="text-sm text-gray-700">{note.reply}</p>
                        </div>
                      ) : isStaffView ? (
                        replyingTo === note.id ? (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={replyInput}
                              onChange={e => setReplyInput(e.target.value)}
                              placeholder="Reply to this note..."
                              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                            />
                            <button onClick={() => submitReply(note.id)}
                              className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors">
                              Reply
                            </button>
                            <button onClick={() => { setReplyingTo(null); setReplyInput('') }}
                              className="text-xs border border-gray-200 text-gray-500 font-semibold px-3 py-1.5 rounded hover:bg-gray-100 transition-colors">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setReplyingTo(note.id)}
                            className="text-xs text-[#1e3a6e] font-semibold border border-[#1e3a6e] px-3 py-1.5 rounded hover:bg-[#e8eef7] transition-colors mt-2">
                            Reply
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Awaiting reply</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-400">No crisis notes yet.</p>
                  {!isStaffView && <p className="text-xs text-gray-300 mt-1">Send a note above to get started.</p>}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Delegates roster */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Delegate Roster</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {MOCK_DELEGATES.map(d => (
              <div key={d.id} className="bg-gray-50 rounded-lg px-3 py-2.5 text-center">
                <div className="w-8 h-8 rounded-full bg-[#1e3a6e] flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">
                  {d.name.split(' ').map(w => w[0]).join('')}
                </div>
                <p className="text-xs font-semibold text-gray-900 truncate">{d.name}</p>
                <p className="text-xs text-gray-400 truncate">{d.country}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 bg-gradient-to-br from-[#1e3a6e] to-[#0f2040] rounded-xl p-8 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-2">Ready to experience the full platform?</p>
          <h2 className="font-serif text-2xl font-bold mb-3">Join ERAU-MUN</h2>
          <p className="text-white/60 text-sm mb-6 max-w-lg mx-auto">
            This demo shows a fraction of what the platform can do. Real conferences include real-time sync, document submissions, voting, resolutions, and more.
          </p>
          
            <a href="https://campusgroups.erau.edu/mun/club_signup"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#b8963e] text-white font-semibold px-7 py-3 rounded hover:bg-[#d4af62] transition-colors text-sm"
          >
            Join on CampusGroups
          </a>
        </div>
      </div>
    </div>
  )
}