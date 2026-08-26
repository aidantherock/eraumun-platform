import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function PortalEvents() {
  const { profile, isEboard, isStaffOrAbove } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        event_roles(*),
        committees(id, name, type, description, logo_url)
      `)
      .not('status', 'eq', 'draft')
      .order('start_date', { ascending: false })
    setEvents(data ?? [])
    setLoading(false)
  }

  async function handleSignUp(eventRoleId) {
    const { error } = await supabase
      .from('user_event_roles')
      .insert({ user_id: profile.id, event_role_id: eventRoleId })
    if (!error) fetchEvents()
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500 mt-1">View and register for ERAU-MUN events and conferences.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map(event => {
            const userHasRole = event.event_roles?.some(er =>
              er.user_event_roles?.some(uer => uer.user_id === profile?.id)
            )
            const isLive = event.status === 'live'
            const isAway = event.is_away_conference

            return (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                {/* Header */}
                <div className="bg-[#1e3a6e] px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-2 inline-block
                        ${isLive ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}>
                        {isLive ? 'Live' : event.status}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-white">{event.name}</h3>
                      {event.location && <p className="text-xs text-white/50 mt-0.5">{event.location}</p>}
                    </div>
                    {isAway && (
                      <span className="text-xs bg-[#b8963e]/20 text-[#d4af62] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                        Away
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                  {event.start_date && (
                    <p className="text-xs text-gray-500 mb-3">
                      {new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {event.end_date && event.end_date !== event.start_date && (
                        <> &mdash; {new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                      )}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{event.description}</p>
                  )}

                  {/* Away conference details */}
                  {isAway && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                      {event.hotel_info && (
                        <p className="text-xs text-gray-600"><span className="font-semibold">Hotel:</span> {event.hotel_info}</p>
                      )}
                      {event.schedule_url && (
                        <a href={event.schedule_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1e3a6e] font-medium hover:underline block">
                          View Schedule
                        </a>
                      )}
                    </div>
                  )}

                  {/* Committees */}
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

                  {/* Action */}
                  {userHasRole ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                      &#10003; Registered
                    </span>
                  ) : (
                    <button
                      onClick={() => event.event_roles?.[0] && handleSignUp(event.event_roles[0].id)}
                      className="text-xs font-semibold bg-[#1e3a6e] text-white px-4 py-1.5 rounded-lg hover:bg-[#2d538f] transition-colors"
                    >
                      Express Interest
                    </button>
                  )}
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