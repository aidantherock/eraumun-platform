import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function expandRecurringEvents(events) {
  const expanded = []
  for (const event of events) {
    if (event.is_cancelled) continue
    if (!event.is_recurring) {
      expanded.push(event)
      continue
    }
    const start = new Date(event.start_date)
    const end = event.recurrence_end_date ? new Date(event.recurrence_end_date) : new Date(start.getFullYear(), 11, 31)
    const rule = event.recurrence_rule
    let current = new Date(start)
    while (current <= end) {
      expanded.push({ ...event, start_date: current.toISOString().split('T')[0], _isOccurrence: true })
      if (rule === 'daily') current.setDate(current.getDate() + 1)
      else if (rule === 'weekly') current.setDate(current.getDate() + 7)
      else if (rule === 'biweekly') current.setDate(current.getDate() + 14)
      else if (rule === 'monthly') current.setMonth(current.getMonth() + 1)
      else break
    }
  }
  return expanded
}

export default function PortalEvents() {
  const { profile, isEboard, isStaffOrAbove } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [signedUp, setSignedUp] = useState([])

  useEffect(() => {
    fetchEvents()
    fetchSignups()
  }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*, event_roles(*), committees(id, name, type, description, logo_url)')
      .not('status', 'eq', 'draft')
      .eq('is_cancelled', false)
      .order('start_date', { ascending: true })
    setEvents(expandRecurringEvents(data ?? []))
    setLoading(false)
  }

  async function fetchSignups() {
    const { data } = await supabase
      .from('user_event_roles')
      .select('*, event_roles(event_id)')
      .eq('user_id', profile.id)
    setSignedUp(data?.map(d => d.event_roles?.event_id).filter(Boolean) ?? [])
  }

  async function handleSignUp(eventRoleId, eventId) {
    const { error } = await supabase
      .from('user_event_roles')
      .insert({ user_id: profile.id, event_role_id: eventRoleId, approved: false })
    if (!error) setSignedUp(prev => [...prev, eventId])
  }

  const isSignedUp = (eventId) => signedUp.includes(eventId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500 mt-1">View and register for ERAU-MUN events and conferences.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />)}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((event, idx) => {
            const signed = isSignedUp(event.id)
            const isLive = event.status === 'live'
            const isAway = event.is_away_conference

            return (
              <div key={`${event.id}-${idx}`} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="bg-[#1e3a6e] px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded
                          ${isLive ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}>
                          {isLive ? 'Live' : event.status}
                        </span>
                        {event.category && (
                          <span className="text-xs bg-white/10 text-white/60 font-bold uppercase tracking-wide px-2 py-0.5 rounded capitalize">
                            {event.category}
                          </span>
                        )}
                        {event.is_recurring && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                            Recurring
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-white">{event.name}</h3>
                      {event.location && <p className="text-xs text-white/50 mt-0.5">{event.location}</p>}
                    </div>
                    {isAway && (
                      <span className="text-xs bg-[#b8963e]/20 text-[#d4af62] font-bold uppercase tracking-wide px-2 py-0.5 rounded flex-shrink-0">
                        Away
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4">
                  {event.start_date && (
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                      {event.event_time && ` at ${event.event_time}`}
                      {event.end_date && event.end_date !== event.start_date && (
                        <> — {new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                      )}
                    </p>
                  )}
                  {event.event_location && (
                    <p className="text-xs text-gray-400 mb-2">{event.event_location}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{event.description}</p>
                  )}

                  {isAway && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                      {event.hotel_info && (
                        <p className="text-xs text-gray-600"><span className="font-semibold">Hotel:</span> {event.hotel_info}</p>
                      )}
                      {event.schedule_url && (
                        <a href={event.schedule_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#1e3a6e] font-medium hover:underline block">
                          View Schedule
                        </a>
                      )}
                    </div>
                  )}

                  {event.committees?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Committees</p>
                      <div className="flex flex-wrap gap-2">
                        {event.committees.map(committee => (
                          <Link
                            key={committee.id}
                            to={`/portal/committee/${committee.id}`}
                            className="text-xs bg-[#e8eef7] text-[#1e3a6e] font-medium px-2.5 py-1 rounded-full hover:bg-[#1e3a6e] hover:text-white transition-colors"
                          >
                            {committee.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    {!event._isOccurrence && event.event_roles?.length > 0 && (
                      signed ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                          &#10003; Interest Registered
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSignUp(event.event_roles[0].id, event.id)}
                          className="text-xs font-semibold bg-[#1e3a6e] text-white px-4 py-1.5 rounded-lg hover:bg-[#2d538f] transition-colors"
                        >
                          Express Interest
                        </button>
                      )
                    )}
                    {isStaffOrAbove && !event._isOccurrence && (
                      <Link
                        to={`/admin/event/${event.id}`}
                        className="text-xs font-semibold border border-[#1e3a6e] text-[#1e3a6e] px-4 py-1.5 rounded-lg hover:bg-[#e8eef7] transition-colors"
                      >
                        Manage Event
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No events at this time. Check back soon.</p>
        </div>
      )}
    </div>
  )
}