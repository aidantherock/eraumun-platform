import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function expandRecurringEvents(events) {
  const expanded = []
  for (const event of events) {
    if (event.is_cancelled) continue
    if (!event.is_recurring) { expanded.push(event); continue }
    const start = new Date(event.start_date + 'T00:00:00')
    const end = event.recurrence_end_date
      ? new Date(event.recurrence_end_date + 'T00:00:00')
      : new Date(start.getFullYear(), 11, 31)
    const rule = event.recurrence_rule
    let current = new Date(start)
    while (current <= end) {
      expanded.push({ ...event, start_date: current.toISOString().split('T')[0] })
      if (rule === 'daily') current.setDate(current.getDate() + 1)
      else if (rule === 'weekly') current.setDate(current.getDate() + 7)
      else if (rule === 'biweekly') current.setDate(current.getDate() + 14)
      else if (rule === 'monthly') current.setMonth(current.getMonth() + 1)
      else break
    }
  }
  return expanded
}

export default function PortalHome() {
  const { profile, isEboard } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [notifications, setNotifications] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    await Promise.all([
      fetchEvents(),
      fetchAnnouncements(),
      fetchNotifications(),
      fetchNews(),
    ])
    setLoading(false)
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_cancelled', false)
      .not('status', 'eq', 'draft')
      .order('start_date')
    setEvents(expandRecurringEvents(data ?? []))
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

  async function fetchNotifications() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(5)
    setNotifications(data ?? [])
  }

  async function fetchNews() {
    const { data } = await supabase
      .from('news_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)
    setNews(data ?? [])
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  function getEventsForDay(day) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start_date === dateStr)
  }

  const upcomingEvents = events
    .filter(e => new Date(e.start_date + 'T00:00:00') >= today)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-[#1e3a6e] to-[#2d538f] rounded-2xl px-8 py-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-1">Welcome back</p>
        <h1 className="font-serif text-2xl font-bold">
          {profile?.first_name} {profile?.last_name}
        </h1>
        <p className="text-white/60 text-sm mt-1">{profile?.school}</p>
        {isEboard && (
          <Link to="/admin"
            className="inline-block mt-4 text-xs font-semibold bg-white/10 border border-white/20 text-white px-4 py-2 rounded hover:bg-white/20 transition-colors">
            Admin Panel
          </Link>
        )}
      </div>

      {/* Unread notifications */}
      {notifications.length > 0 && (
        <div className="bg-[#fffbf0] border border-[#e8c96f] rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7c5e10] mb-3">
            {notifications.length} Unread Notification{notifications.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#b8963e] flex-shrink-0 mt-1.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500">{n.body}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Calendar</h2>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth}
                  className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm">
                  &#8249;
                </button>
                <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">{monthName}</span>
                <button onClick={nextMonth}
                  className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm">
                  &#8250;
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />
                  const dayEvents = getEventsForDay(day)
                  const date = new Date(currentYear, currentMonth, day)
                  const isToday = date.toDateString() === today.toDateString()
                  return (
                    <div key={day} className={`min-h-[52px] p-1 rounded-lg ${isToday ? 'bg-[#e8eef7]' : ''}`}>
                      <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-0.5
                        ${isToday ? 'bg-[#1e3a6e] text-white' : 'text-gray-500'}`}>
                        {day}
                      </div>
                      {dayEvents.slice(0, 2).map((ev, idx) => (
                        <Link key={idx} to={`/portal/events/${ev.id}`}
                          className="block text-[9px] font-medium px-1 py-0.5 rounded bg-[#1e3a6e] text-white truncate mb-0.5 hover:bg-[#2d538f] transition-colors">
                          {ev.name}
                        </Link>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[9px] text-gray-400 px-1">+{dayEvents.length - 2}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
              <Link to="/portal/events" className="text-xs text-[#1e3a6e] font-medium hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => (
                <Link key={i} to={`/portal/events/${ev.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a6e] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {new Date(ev.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{ev.name}</p>
                    <p className="text-xs text-gray-400">
                      {ev.location ?? ev.event_location ?? ''}
                      {ev.event_time && ` · ${ev.event_time}`}
                    </p>
                  </div>
                </Link>
              )) : (
                <div className="px-5 py-6 text-center text-sm text-gray-400">No upcoming events.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Announcements */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Announcements</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {announcements.length > 0 ? announcements.map(ann => (
                <div key={ann.id} className="px-5 py-3">
                  {ann.is_urgent && (
                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-0.5">Urgent</span>
                  )}
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{ann.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {ann.published_at ? new Date(ann.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </p>
                </div>
              )) : (
                <div className="px-5 py-6 text-center text-sm text-gray-400">No announcements.</div>
              )}
            </div>
          </div>

          {/* Latest news */}
          {news.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Latest News</h2>
                <Link to="/news" className="text-xs text-[#1e3a6e] font-medium hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-gray-100">
                {news.map(post => (
                  <Link key={post.id} to={`/news/${post.slug}`}
                    className="block px-5 py-3 hover:bg-gray-50 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e] mb-0.5">{post.category}</p>
                    <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Quick Links</h2>
            <div className="flex flex-col gap-2">
              {[
                { label: 'View Events', to: '/portal/events' },
                { label: 'My Profile', to: '/portal/profile' },
                { label: 'Contact Us', to: '/portal/contact' },
              ].map(link => (
                <Link key={link.to} to={link.to}
                  className="text-sm text-[#1e3a6e] font-medium hover:underline">
                  {link.label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}