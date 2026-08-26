import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function PortalHome() {
  const { profile, userRoles, isEboard } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [events, setEvents] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: ann }, { data: evs }, { data: notifs }] = await Promise.all([
      supabase
        .from('announcements')
        .select('*')
        .in('visibility', ['public', 'members'])
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5),
      supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'live'])
        .order('start_date')
        .limit(4),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5),
    ])
    setAnnouncements(ann ?? [])
    setEvents(evs ?? [])
    setNotifications(notifs ?? [])
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const roleNames = userRoles.map(r => r.name).join(', ')

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div className="bg-gradient-to-br from-[#1e3a6e] to-[#162d58] rounded-xl px-8 py-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-1">Welcome back</p>
        <h1 className="font-serif text-2xl font-bold mb-1">
          {profile?.first_name} {profile?.last_name}
        </h1>
        <p className="text-white/60 text-sm">{roleNames || 'Club Member'} &mdash; {profile?.school}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Unread Notifications', value: notifications.length },
          { label: 'Active Events', value: events.length },
          { label: 'Announcements', value: announcements.length },
          { label: 'Role Level', value: userRoles.length > 0 ? Math.max(...userRoles.map(r => r.level)) : 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold text-[#1e3a6e] font-serif">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Announcements */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : announcements.length > 0 ? announcements.map(ann => (
              <div key={ann.id} className="px-6 py-4">
                {ann.is_urgent && (
                  <span className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1 block">Urgent</span>
                )}
                <p className="text-sm font-semibold text-gray-900 mb-1">{ann.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{ann.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {ann.published_at ? new Date(ann.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </p>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No announcements yet.</div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : notifications.length > 0 ? notifications.map(notif => (
              <div key={notif.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                  {notif.body && <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => markRead(notif.id)}
                  className="text-xs text-[#1e3a6e] font-medium hover:underline flex-shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No new notifications.</div>
            )}
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Events</h2>
          <Link to="/portal/events" className="text-xs text-[#1e3a6e] font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-sm text-gray-400">Loading...</div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map(event => (
                <Link
                  key={event.id}
                  to="/portal/events"
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#1e3a6e] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm text-gray-900">{event.name}</h3>
                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded
                      ${event.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {event.status}
                    </span>
                  </div>
                  {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
                  {event.start_date && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-400">No active events at this time.</div>
          )}
        </div>
      </div>

    </div>
  )
}