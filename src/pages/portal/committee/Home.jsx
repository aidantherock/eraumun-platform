import { useOutletContext } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'

export default function CommitteeHome() {
  const { committee, userRole, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [floorState, setFloorState] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [delegates, setDelegates] = useState([])
  const [staff, setStaff] = useState([])
  const [checklist, setChecklist] = useState([])
  const [completions, setCompletions] = useState([])

  useEffect(() => {
    if (committee?.id) {
      fetchFloorState()
      fetchAnnouncements()
      fetchMembers()
      fetchChecklist()
    }
  }, [committee?.id])

  async function fetchFloorState() {
    const { data } = await supabase
      .from('floor_state')
      .select('*')
      .eq('committee_id', committee.id)
      .single()
    setFloorState(data)
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

  async function fetchMembers() {
    const { data } = await supabase
      .from('committee_roles')
      .select('*, profiles(first_name, last_name, avatar_url, school)')
      .eq('committee_id', committee.id)
    const allMembers = data ?? []
    setDelegates(allMembers.filter(m => ['delegate', 'head_delegate'].includes(m.role)))
    setStaff(allMembers.filter(m => ['chair', 'staff'].includes(m.role)))
  }

  async function fetchChecklist() {
    const { data: templates } = await supabase
      .from('checklist_templates')
      .select('*, checklist_items(*)')
      .eq('committee_id', committee.id)
      .limit(1)

    if (templates?.[0]) {
      setChecklist(templates[0].checklist_items ?? [])
      const { data: comps } = await supabase
        .from('checklist_completions')
        .select('item_id')
        .eq('user_id', profile.id)
      setCompletions(comps?.map(c => c.item_id) ?? [])
    }
  }

  async function toggleChecklist(itemId) {
    const isDone = completions.includes(itemId)
    if (isDone) {
      await supabase.from('checklist_completions')
        .delete()
        .eq('item_id', itemId)
        .eq('user_id', profile.id)
      setCompletions(prev => prev.filter(id => id !== itemId))
    } else {
      await supabase.from('checklist_completions')
        .insert({ item_id: itemId, user_id: profile.id })
      setCompletions(prev => [...prev, itemId])
    }
  }

  const MODE_COLORS = {
    open: 'bg-green-100 text-green-700',
    moderated_caucus: 'bg-blue-100 text-blue-700',
    unmoderated_caucus: 'bg-yellow-100 text-yellow-700',
    voting: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">{committee?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{committee?.topic ?? 'No topic set yet.'}</p>
      </div>

      {/* Floor status */}
      {floorState && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Floor Status</p>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${MODE_COLORS[floorState.mode] ?? 'bg-gray-100 text-gray-700'}`}>
              {floorState.mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {floorState.caucus_topic && (
              <p className="text-xs text-gray-500 mt-2">Topic: {floorState.caucus_topic}</p>
            )}
          </div>
          {floorState.speaking_time_seconds && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Speaking Time</p>
              <p className="text-lg font-bold text-[#1e3a6e]">{floorState.speaking_time_seconds}s</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Announcements */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Committee Announcements</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {announcements.length > 0 ? announcements.map(ann => (
              <div key={ann.id} className="px-6 py-4">
                {ann.is_urgent && (
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-1">Urgent</span>
                )}
                <p className="text-sm font-semibold text-gray-900">{ann.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ann.content}</p>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No announcements yet.</div>
            )}
          </div>
        </div>

        {/* Pre-conference checklist */}
        {checklist.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pre-Conference Checklist</h2>
              <p className="text-xs text-gray-400 mt-0.5">{completions.length} of {checklist.length} complete</p>
            </div>
            <div className="divide-y divide-gray-100">
              {checklist.map(item => (
                <label key={item.id} className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={completions.includes(item.id)}
                    onChange={() => toggleChecklist(item.id)}
                    className="accent-[#1e3a6e]"
                  />
                  <span className={`text-sm ${completions.includes(item.id) ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delegate list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Delegates ({delegates.length})</h2>
        </div>
        <div className="p-6">
          {delegates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {delegates.map(d => (
                <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0">
                    {d.profiles?.first_name?.charAt(0)}{d.profiles?.last_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {d.profiles?.first_name} {d.profiles?.last_name}
                    </p>
                    {d.assignment && <p className="text-xs text-gray-400 truncate">{d.assignment}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No delegates assigned yet.</p>
          )}
        </div>
      </div>

      {/* Staff list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Committee Staff ({staff.length})</h2>
        </div>
        <div className="p-6">
          {staff.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {staff.map(s => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white">
                  <div className="w-7 h-7 rounded-full bg-[#1e3a6e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.profiles?.first_name?.charAt(0)}{s.profiles?.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {s.profiles?.first_name} {s.profiles?.last_name}
                    </p>
                    <p className="text-xs text-[#b8963e] font-bold uppercase tracking-wide">{s.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No staff assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}