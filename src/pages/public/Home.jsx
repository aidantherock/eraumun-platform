import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function HeroCalendar() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('id, name, start_date, category')
      .eq('is_cancelled', false)
      .not('status', 'eq', 'draft')
      .order('start_date')
    setEvents(data ?? [])
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  function getEventsForDay(day) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start_date === dateStr)
  }

  const twoWeeksFromNow = new Date(today)
    twoWeeksFromNow.setDate(today.getDate() + 14)

  const upcomingEvents = events
    .filter(e => {
  const date = new Date(e.start_date + 'T00:00:00')
    return date >= today && date <= twoWeeksFromNow
  })
  .slice(0, 4)

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="w-7 h-7 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-lg">
          &#8249;
        </button>
        <p className="text-sm font-semibold text-white">{monthName}</p>
        <button onClick={nextMonth}
          className="w-7 h-7 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-lg">
          &#8250;
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-bold text-white/40 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dayEvents = getEventsForDay(day)
          const date = new Date(currentYear, currentMonth, day)
          const isToday = date.toDateString() === today.toDateString()
          return (
            <div key={day} className={`min-h-[32px] p-0.5 rounded ${isToday ? 'bg-[#b8963e]/30' : ''}`}>
              <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mx-auto
                ${isToday ? 'bg-[#d4af62] text-[#1e3a6e]' : 'text-white/70'}`}>
                {day}
              </div>
              {dayEvents.length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#d4af62] mx-auto mt-0.5" />
              )}
            </div>
          )
        })}
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Upcoming</p>
          <div className="space-y-2">
            {upcomingEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d4af62] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{ev.name}</p>
                  <p className="text-xs text-white/40">
                    {new Date(ev.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to="/news"
        className="block text-center text-xs text-white/50 hover:text-white mt-4 transition-colors">
        View full calendar →
      </Link>
    </div>
  )
}

export default function Home() {
  const [news, setNews] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    await Promise.all([fetchNews(), fetchSponsors(), fetchPhotos()])
    setLoading(false)
  }

  async function fetchNews() {
    const { data } = await supabase
      .from('news_posts')
      .select('*')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(3)
    setNews(data ?? [])
  }

  async function fetchSponsors() {
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .eq('show_on_homepage', true)
      .order('name')
    setSponsors(data ?? [])
  }

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photo_gallery')
      .select('*')
      .eq('is_public', true)
      .order('display_order')
      .order('created_at', { ascending: false })
      .limit(8)
    setPhotos(data ?? [])
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,.1) 50px, rgba(255,255,255,.1) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,.1) 50px, rgba(255,255,255,.1) 51px)'
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d4af62] mb-4">
                Embry-Riddle Aeronautical University
              </p>
              <h1 className="font-serif text-5xl md:text-6xl font-bold leading-[1.1] mb-6">
                Model <em className="italic text-[#d4af62]">United</em><br />Nations
              </h1>
              <p className="text-white/70 text-lg leading-relaxed font-light mb-8 max-w-xl">
                Developing the next generation of global leaders through diplomacy, debate, and international cooperation at Embry-Riddle Aeronautical University.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                
                  <a href="https://campusgroups.erau.edu/mun/club_signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#b8963e] text-white font-semibold px-7 py-3 rounded hover:bg-[#d4af62] transition-colors text-sm">
                  Join on CampusGroups
                </a>
                <Link to="/about"
                  className="border border-white/30 text-white font-semibold px-7 py-3 rounded hover:bg-white/10 transition-colors text-sm">
                  Learn More
                </Link>
              </div>
            </div>

            {/* Right — mini calendar */}
            <div className="hidden md:block">
              <HeroCalendar />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0f2040] px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '5+', label: 'Conferences Attended Annually' },
            { value: '50+', label: 'Active Members' },
            { value: '5+', label: 'Years Active' },
            { value: '1', label: 'Awesome ERAU MUN Team' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-serif text-3xl font-bold text-[#d4af62]">{stat.value}</p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-3">Who We Are</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-5">
              Diplomacy meets <em className="italic text-[#1e3a6e]">aviation</em>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-4">
              ERAU-MUN is Embry-Riddle Aeronautical University's official Model United Nations organization. We prepare students to engage with global issues through simulated UN conferences, debate, and collaborative problem-solving.
            </p>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              Whether you're a seasoned delegate or attending your first conference, ERAU-MUN offers a welcoming community focused on growth, leadership, and international awareness.
            </p>
            <Link to="/about"
              className="inline-block bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors">
              About Us
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Conferences', desc: 'Compete at regional and national MUN conferences across the country.' },
              { title: 'Training', desc: 'Regular workshops on resolution writing, public speaking, and diplomacy.' },
              { title: 'Ernie Crisis Simulation', desc: 'ERAU\'s first competitive Model United Nations simulation.' },
              { title: 'Community', desc: 'A tight-knit team of delegates passionate about global affairs.' },
            ].map(item => (
              <div key={item.title} className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                <p className="font-semibold text-[#1e3a6e] text-sm mb-2">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Latest</p>
              <h2 className="font-serif text-3xl font-bold text-gray-900">
                News <em className="italic text-[#1e3a6e]">&amp; Updates</em>
              </h2>
            </div>
            <Link to="/news" className="text-sm text-[#1e3a6e] font-semibold hover:underline hidden md:block">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />)}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {news.map(post => (
                <Link key={post.id} to={`/news/${post.slug}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-[#1e3a6e] to-[#162d58] flex items-center justify-center">
                      <span className="font-serif text-3xl text-white/20 italic">MUN</span>
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e] mb-2">{post.category ?? 'News'}</p>
                    <h4 className="font-semibold text-sm text-gray-900 mb-2 leading-snug">{post.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{post.excerpt}</p>
                    <p className="text-xs text-gray-400 mt-3">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      }) : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">No news posts yet.</p>
            </div>
          )}
          <div className="text-center mt-8 md:hidden">
            <Link to="/news" className="text-sm text-[#1e3a6e] font-semibold hover:underline">View all news →</Link>
          </div>
        </div>
      </section>

      {/* Gallery preview */}
      {photos.length > 0 && (
        <section className="px-6 py-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Memories</p>
                <h2 className="font-serif text-3xl font-bold text-gray-900">
                  Photo <em className="italic text-[#1e3a6e]">Gallery</em>
                </h2>
              </div>
              <Link to="/gallery" className="text-sm text-[#1e3a6e] font-semibold hover:underline hidden md:block">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map(photo => (
                <Link key={photo.id} to="/gallery"
                  className="group relative rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                </Link>
              ))}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link to="/gallery" className="text-sm text-[#1e3a6e] font-semibold hover:underline">View all photos →</Link>
            </div>
          </div>
        </section>
      )}

     {/* Sponsors */}
{sponsors.length > 0 && (
  <section className="px-6 py-16 bg-gray-50 border-t border-gray-200">
    <div className="max-w-7xl mx-auto">
      <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-10">
        Our Sponsors
      </p>
      <div className="flex items-end justify-center gap-10 flex-wrap">
        {sponsors.map(sponsor => (
          <a key={sponsor.id}
            href={sponsor.website_url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3"
          >
            {sponsor.logo_url ? (
              <img src={sponsor.logo_url} alt={sponsor.name} className="h-16 w-auto max-w-[160px] object-contain bg-gray-50 rounded-lg p-2" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                {sponsor.initials}
              </div>
            )}
            <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors text-center">
              {sponsor.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
)}

      {/* CTA */}
      <section className="px-6 py-20 bg-gradient-to-br from-[#1e3a6e] to-[#0f2040] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Get Involved</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to make your <em className="italic text-[#d4af62]">mark</em>?
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Join ERAU-MUN and develop skills in diplomacy, public speaking, research, and global leadership. Open to all ERAU students.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            
              <a href="https://campusgroups.erau.edu/mun/club_signup"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#b8963e] text-white font-semibold px-7 py-3 rounded hover:bg-[#d4af62] transition-colors text-sm">
              Join on CampusGroups
            </a>
            <Link to="/contact"
              className="border border-white/30 text-white font-semibold px-7 py-3 rounded hover:bg-white/10 transition-colors text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}