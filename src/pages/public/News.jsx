import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ── Calendar helpers ──────────────────────────────────────────
const MEETING_START = new Date('2026-08-25')
const HOLIDAYS = ['2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25']

function getEventType(date) {
  const day = date.getDay()
  const dateStr = date.toISOString().split('T')[0]
  if (HOLIDAYS.includes(dateStr)) return null
  if (day !== 2 && day !== 5) return null

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksSinceStart = Math.floor((date - MEETING_START) / msPerWeek)

  if (day === 2) {
    const cycle = weeksSinceStart % 4
    if (cycle === 0) return { label: 'GBM', type: 'gbm', time: '6:00 PM' }
    if (cycle === 1) return { label: 'GA Training', type: 'training', time: '6:00 PM' }
    if (cycle === 2) return { label: 'Crisis Training', type: 'training', time: '6:00 PM' }
    if (cycle === 3) return { label: 'Outreach Event', type: 'social', time: '6:00 PM' }
  }
  if (day === 5) {
    return { label: 'Committee Meeting', type: 'committee', time: '6:00 PM' }
  }
  return null
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

const TYPE_COLORS = {
  gbm: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', dot: 'bg-[#b8963e]' },
  training: { bg: 'bg-[#dbeafe]', text: 'text-[#1e40af]', dot: 'bg-[#3b82f6]' },
  committee: { bg: 'bg-[#ede9fe]', text: 'text-[#5b21b6]', dot: 'bg-[#8b5cf6]' },
  social: { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]', dot: 'bg-[#10b981]' },
  conference: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', dot: 'bg-[#f59e0b]' },
}

const LEGEND = [
  { label: 'GBM', type: 'gbm' },
  { label: 'Training', type: 'training' },
  { label: 'Committee', type: 'committee' },
  { label: 'Social', type: 'social' },
]

export default function News() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
  }, [])

  async function fetchNews() {
    const { data } = await supabase
      .from('news_posts')
      .select('*')
      .eq('visibility', 'public')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    setNews(data ?? [])
    setLoading(false)
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  // Upcoming events list
  const upcomingEvents = []
  for (let m = currentMonth; m <= 11; m++) {
    const days = getDaysInMonth(currentYear, m)
    for (let d = 1; d <= days; d++) {
      const date = new Date(currentYear, m, d)
      const event = getEventType(date)
      if (event && date >= today) {
        upcomingEvents.push({ date, ...event })
        if (upcomingEvents.length >= 10) break
      }
    }
    if (upcomingEvents.length >= 10) break
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Stay Updated</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            News <em className="italic text-[#d4af62]">&amp; Events</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-2xl">
            Stay up to date with ERAU-MUN announcements, meeting schedules, and conference news.
          </p>
        </div>
      </section>

      {/* Calendar */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Schedule</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              Meeting <em className="italic text-[#1e3a6e]">Calendar</em>
            </h2>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-[#e8eef7] hover:text-[#1e3a6e] transition-colors"
              >
                &#8249;
              </button>
              <span className="font-serif text-lg font-semibold text-gray-900 min-w-[180px] text-center">{monthName}</span>
              <button
                onClick={nextMonth}
                className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center text-gray-600 hover:bg-[#e8eef7] hover:text-[#1e3a6e] transition-colors"
              >
                &#8250;
              </button>
            </div>
            <div className="flex gap-4 flex-wrap">
              {LEGEND.map(l => (
                <div key={l.type} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[l.type].dot}`} />
                  <span className="text-xs text-gray-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="grid grid-cols-7">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-[#1e3a6e] text-white/80 text-xs font-semibold uppercase tracking-widest py-2 text-center">
                  {d}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="min-h-[90px] bg-gray-50 border-r border-b border-gray-200" />
                const date = new Date(currentYear, currentMonth, day)
                const event = getEventType(date)
                const isToday = date.toDateString() === today.toDateString()
                const isHoliday = HOLIDAYS.includes(date.toISOString().split('T')[0])
                const colors = event ? TYPE_COLORS[event.type] : null

                return (
                  <div
                    key={day}
                    className={`min-h-[90px] p-1.5 border-r border-b border-gray-200 ${isToday ? 'bg-[#fffbf0]' : isHoliday ? 'bg-red-50' : 'bg-white'} ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                  >
                    <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-[#1e3a6e] text-white' : 'text-gray-500'}`}>
                      {day}
                    </div>
                    {event && colors && (
                      <div className={`text-[10px] font-medium px-1 py-0.5 rounded ${colors.bg} ${colors.text} truncate`}>
                        {event.label}
                      </div>
                    )}
                    {isHoliday && (
                      <div className="text-[10px] font-medium px-1 py-0.5 rounded bg-red-100 text-red-700 truncate">
                        Holiday
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming list */}
          <div className="mt-10">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">
              Upcoming <em className="italic text-[#1e3a6e]">Meetings</em>
            </h3>
            <div className="flex flex-col divide-y divide-gray-100">
              {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => {
                const colors = TYPE_COLORS[ev.type]
                return (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <div className="text-xs font-semibold text-gray-500 min-w-[130px]">
                      {ev.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ev.label}</p>
                      <p className="text-xs text-gray-400">{ev.time}</p>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-gray-400 py-4">No upcoming meetings this period.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Latest</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              News <em className="italic text-[#1e3a6e]">&amp; Announcements</em>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {news.map(post => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="h-32 bg-gradient-to-br from-[#1e3a6e] to-[#162d58] flex items-center justify-center">
                    <span className="font-serif text-3xl text-white/13 italic">MUN</span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e] mb-2">{post.category ?? 'News'}</p>
                    <h4 className="font-semibold text-sm text-gray-900 mb-2 leading-snug">{post.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{post.excerpt}</p>
                    <p className="text-xs text-gray-400">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">No news posts yet. Check back soon.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}