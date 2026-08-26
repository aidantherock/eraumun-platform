import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const TABS = ['Overview', 'Schedule', 'Committees', 'Files', 'Delegates', 'Settings']

export default function EventDetail() {
  const { eventId } = useParams()
  const { profile, isEboard, isStaffOrAbove } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [committees, setCommittees] = useState([])
  const [schedule, setSchedule] = useState([])
  const [files, setFiles] = useState([])
  const [attendees, setAttendees] = useState([])
  const [userCommittees, setUserCommittees] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [checklist, setChecklist] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')

  useEffect(() => {
    if (eventId && profile?.id) fetchAll()
  }, [eventId, profile?.id])

  async function fetchAll() {
    await Promise.all([
      fetchEvent(),
      fetchCommittees(),
      fetchSchedule(),
      fetchFiles(),
      fetchAnnouncements(),
      fetchUserCommittees(),
      fetchChecklist(),
      isStaffOrAbove ? fetchAttendees() : Promise.resolve(),
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
  }

  async function fetchSchedule() {
    const { data } = await supabase
      .from('event_schedule')
      .select('*')
      .eq('event_id', eventId)
      .order('day')
      .order('start_time')
    setSchedule(data ?? [])
  }

  async function fetchFiles() {
    const { data } = await supabase
      .from('event_files')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
  }

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .in('visibility', ['public', 'members'])
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5)
    setAnnouncements(data ?? [])
  }

  async function fetchAttendees() {
    const { data: eventRoles } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', eventId)
    if (!eventRoles?.length) return
    const { data } = await supabase
      .from('user_event_roles')
      .select('*, profiles(id, first_name, last_name, email, school, avatar_url)')
      .in('event_role_id', eventRoles.map(r => r.id))
      .eq('approved', true)
    setAttendees(data ?? [])
  }

  async function fetchUserCommittees() {
    const { data } = await supabase
      .from('committee_roles')
      .select('committee_id')
      .eq('user_id', profile.id)
    setUserCommittees(data?.map(r => r.committee_id) ?? [])
  }

  async function fetchChecklist() {
    const { data: template } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_published', true)
      .single()

    if (!template) return
    setChecklist(template)

    const { data: items } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('template_id', template.id)
      .eq('is_active', true)
      .order('position')
    setChecklistItems(items ?? [])

    if (items?.length) {
      const { data: comp } = await supabase
        .from('checklist_completions')
        .select('item_id')
        .eq('user_id', profile.id)
        .in('item_id', items.map(i => i.id))
      setCompletions(comp?.map(c => c.item_id) ?? [])
    }
  }

  async function toggleCompletion(itemId) {
    const isCompleted = completions.includes(itemId)
    if (isCompleted) {
      await supabase.from('checklist_completions')
        .delete().eq('item_id', itemId).eq('user_id', profile.id)
      setCompletions(prev => prev.filter(id => id !== itemId))
    } else {
      await supabase.from('checklist_completions')
        .insert({ item_id: itemId, user_id: profile.id })
      setCompletions(prev => [...prev, itemId])
    }
  }

  const visibleTabs = TABS.filter(t => {
    if (t === 'Delegates') return isStaffOrAbove
    if (t === 'Settings') return isStaffOrAbove
    return true
  })

  const scheduleByDay = schedule.reduce((acc, item) => {
    const day = item.day
    if (!acc[day]) acc[day] = []
    acc[day].push(item)
    return acc
  }, {})

  const filesByCategory = files.reduce((acc, file) => {
    const cat = file.category ?? 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(file)
    return acc
  }, {})

  const completedCount = completions.length
  const totalRequired = checklistItems.filter(i => i.is_required).length
  const completedRequired = checklistItems.filter(i => i.is_required && completions.includes(i.id)).length
  const checklistProgress = checklistItems.length > 0
    ? Math.round((completedCount / checklistItems.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Event not found.</p>
          <Link to="/portal/events" className="text-sm text-[#1e3a6e] font-medium hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-8 -my-8 min-h-screen bg-gray-50">
      {/* Event Header */}
      <div className="bg-[#1e3a6e] text-white">
        <div className="px-8 py-8">
          <button
            onClick={() => navigate('/portal/events')}
            className="text-white/60 text-xs font-medium hover:text-white transition-colors mb-4 flex items-center gap-1"
          >
            &#8592; Back to Events
          </button>
          <div className="flex items-start gap-5">
            {event.logo_url ? (
              <img src={event.logo_url} alt={event.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-white/20" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#b8963e] flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {event.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded
                  ${event.status === 'live' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}>
                  {event.status}
                </span>
                {event.is_away_conference && (
                  <span className="text-xs bg-[#b8963e]/20 text-[#d4af62] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                    Away Conference
                  </span>
                )}
                {event.category && (
                  <span className="text-xs bg-white/10 text-white/60 font-bold uppercase tracking-wide px-2 py-0.5 rounded capitalize">
                    {event.category}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl font-bold text-white mb-1">{event.name}</h1>
              <div className="flex items-center gap-4 flex-wrap text-white/60 text-sm">
                {event.location && <span>{event.location}</span>}
                {event.start_date && (
                  <span>
                    {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {event.end_date && event.end_date !== event.start_date && (
                      <> — {new Date(event.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </span>
                )}
                {event.event_time && <span>{event.event_time}</span>}
              </div>
            </div>
            {isStaffOrAbove && (
              <Link to={`/admin/event/${eventId}`}
                className="text-xs border border-white/30 text-white font-semibold px-4 py-2 rounded hover:bg-white/10 transition-colors flex-shrink-0">
                Admin Panel
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-white/10">
            {visibleTabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${tab === t ? 'border-[#d4af62] text-white' : 'border-transparent text-white/50 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-8">

        {/* Overview */}
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {event.description && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="font-semibold text-gray-900 mb-3">About This Event</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              )}

              {event.is_away_conference && (event.hotel_info || event.schedule_url) && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h2 className="font-semibold text-gray-900 mb-4">Conference Details</h2>
                  <div className="space-y-3">
                    {event.hotel_info && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Hotel</p>
                        <p className="text-sm text-gray-700">{event.hotel_info}</p>
                      </div>
                    )}
                    {event.schedule_url && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Schedule</p>
                        <a href={event.schedule_url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-[#1e3a6e] font-medium hover:underline">
                          View Official Schedule
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {announcements.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Announcements</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {announcements.map(ann => (
                      <div key={ann.id} className="px-6 py-4">
                        {ann.is_urgent && (
                          <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-1">Urgent</span>
                        )}
                        <p className="text-sm font-semibold text-gray-900">{ann.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Committees', value: committees.length },
                    { label: 'Files', value: files.length },
                    { label: 'Schedule Days', value: Object.keys(scheduleByDay).length },
                    { label: 'Attendees', value: attendees.length },
                  ].map(stat => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-sm font-semibold text-[#1e3a6e]">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist progress */}
              {checklist && checklistItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Pre-Conference Checklist</h3>
                    <span className="text-xs font-bold text-[#1e3a6e]">{checklistProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div className="bg-[#1e3a6e] h-2 rounded-full transition-all"
                      style={{ width: `${checklistProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {completedCount} of {checklistItems.length} items completed
                    {totalRequired > 0 && ` · ${completedRequired}/${totalRequired} required`}
                  </p>
                  <Link to={`/portal/events/${eventId}/checklist`}
                    className="block w-full text-center text-xs font-semibold bg-[#1e3a6e] text-white px-4 py-2.5 rounded-lg hover:bg-[#2d538f] transition-colors">
                    View Checklist
                  </Link>
                </div>
              )}

              {/* Certificate */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Participation Certificate</h3>
                <p className="text-xs text-gray-500 mb-3">Download your certificate of participation for this event.</p>
                
                  <a href={`/.netlify/functions/generate-certificate?userId=${profile.id}&eventId=${eventId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-xs font-semibold border border-[#1e3a6e] text-[#1e3a6e] px-4 py-2.5 rounded-lg hover:bg-[#e8eef7] transition-colors"
                >
                  Download Certificate
                </a>
              </div>

              {/* My committees */}
              {userCommittees.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">My Committees</h3>
                  <div className="flex flex-col gap-2">
                    {committees.filter(c => userCommittees.includes(c.id)).map(c => (
                      <Link key={c.id} to={`/portal/committee/${c.id}`}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-[#1e3a6e] hover:bg-[#e8eef7] transition-all">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#1e3a6e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {c.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-[#b8963e] font-medium">
                            {c.type === 'crisis' ? 'Crisis' : 'GA'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule */}
        {tab === 'Schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Schedule</h2>
                <p className="text-sm text-gray-500 mt-0.5">Full event schedule by day.</p>
              </div>
              {event.schedule_url && (
                <a href={event.schedule_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs border border-[#1e3a6e] text-[#1e3a6e] font-semibold px-4 py-2 rounded hover:bg-[#e8eef7] transition-colors">
                  Official Schedule Link
                </a>
              )}
            </div>
            {Object.keys(scheduleByDay).length > 0 ? (
              Object.entries(scheduleByDay).map(([day, items]) => (
                <div key={day} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-[#1e3a6e] px-6 py-3">
                    <p className="text-sm font-semibold text-white">
                      {new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {items.map(item => (
                      <div key={item.id} className="px-6 py-4 flex items-start gap-4">
                        <div className="text-xs font-semibold text-gray-400 min-w-[90px] pt-0.5">
                          {item.start_time?.slice(0, 5)}
                          {item.end_time && <><br />{item.end_time?.slice(0, 5)}</>}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          {item.location && <p className="text-xs text-[#b8963e] mt-0.5">{item.location}</p>}
                          {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">No schedule posted yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Committees */}
        {tab === 'Committees' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-gray-900">Committees</h2>
              <p className="text-sm text-gray-500 mt-0.5">{committees.length} committee{committees.length !== 1 ? 's' : ''} under this event.</p>
            </div>
            {committees.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {committees.map(committee => {
                  const hasAccess = userCommittees.includes(committee.id) || isStaffOrAbove
                  return (
                    <div key={committee.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm
                      ${hasAccess ? 'border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all' : 'border-gray-200 opacity-60'}`}>
                      <div className="bg-[#1e3a6e] px-5 py-4 flex items-center gap-3">
                        {committee.logo_url ? (
                          <img src={committee.logo_url} alt={committee.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/20" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#b8963e] flex items-center justify-center text-white font-bold flex-shrink-0">
                            {committee.name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62]">
                            {committee.type === 'crisis' ? 'Crisis Committee' : 'General Assembly'}
                          </p>
                          <p className="font-semibold text-white leading-tight">{committee.name}</p>
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        {committee.topic && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{committee.topic}</p>}
                        {committee.description && <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{committee.description}</p>}
                        {hasAccess ? (
                          <Link to={`/portal/committee/${committee.id}`}
                            className="block text-center text-xs font-semibold bg-[#1e3a6e] text-white px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
                            {isStaffOrAbove ? 'Manage Committee' : 'Enter Committee'}
                          </Link>
                        ) : (
                          <div className="text-center text-xs font-semibold text-gray-400 bg-gray-100 px-4 py-2 rounded">
                            Not assigned
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">No committees created yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Files */}
        {tab === 'Files' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-gray-900">Files & Resources</h2>
              <p className="text-sm text-gray-500 mt-0.5">Documents and resources for this event.</p>
            </div>
            {Object.keys(filesByCategory).length > 0 ? (
              Object.entries(filesByCategory).map(([category, categoryFiles]) => (
                <div key={category} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 capitalize">{category}</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {categoryFiles.map(file => (
                      <a key={file.id} href={file.file_url} target="_blank" rel="noopener noreferrer"
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#e8eef7] flex items-center justify-center text-[#1e3a6e] text-xs font-bold flex-shrink-0">
                            {file.file_type?.toUpperCase().slice(0, 3) ?? 'FILE'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            {file.file_size && (
                              <p className="text-xs text-gray-400">{(file.file_size / 1024 / 1024).toFixed(1)} MB</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-[#1e3a6e] font-semibold flex-shrink-0">Download</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">No files uploaded yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Delegates */}
        {tab === 'Delegates' && isStaffOrAbove && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Delegates</h2>
                <p className="text-sm text-gray-500 mt-0.5">{attendees.length} approved attendee{attendees.length !== 1 ? 's' : ''}.</p>
              </div>
              <Link to={`/admin/event/${eventId}/attendees`}
                className="text-xs border border-[#1e3a6e] text-[#1e3a6e] font-semibold px-4 py-2 rounded hover:bg-[#e8eef7] transition-colors">
                Manage in Admin
              </Link>
            </div>
            {attendees.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {attendees.map(attendee => (
                    <div key={attendee.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0 overflow-hidden">
                        {attendee.profiles?.avatar_url ? (
                          <img src={attendee.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{attendee.profiles?.first_name?.charAt(0)}{attendee.profiles?.last_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {attendee.profiles?.first_name} {attendee.profiles?.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{attendee.profiles?.email} — {attendee.profiles?.school}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">No approved attendees yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === 'Settings' && isStaffOrAbove && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-gray-900">Event Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage this event from the admin panel.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <Link to={`/portal/control-room/${eventId}`}
                  className="flex items-center justify-center col-span-2 border border-[#1e3a6e] text-[#1e3a6e] font-semibold text-sm px-4 py-3 rounded-lg hover:bg-[#e8eef7] transition-colors">
                  ⚡ Staff Control Room
                </Link>
                {[
                  { label: 'Event Admin Panel', to: `/admin/event/${eventId}` },
                  { label: 'Manage Committees', to: `/admin/event/${eventId}/committees` },
                  { label: 'Assign Roles', to: `/admin/event/${eventId}/roles` },
                  { label: 'Manage Attendees', to: `/admin/event/${eventId}/attendees` },
                  { label: 'View Submissions', to: `/admin/event/${eventId}/submissions` },
                ].map(link => (
                  <Link key={link.to} to={link.to}
                    className="flex items-center justify-center border border-gray-200 text-gray-600 font-semibold text-sm px-4 py-3 rounded-lg hover:border-[#1e3a6e] hover:text-[#1e3a6e] transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}