import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Home() {
  const [sponsors, setSponsors] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [news, setNews] = useState([])

  useEffect(() => {
    fetchSponsors()
    fetchUpcomingEvents()
    fetchNews()
  }, [])

  async function fetchSponsors() {
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .eq('show_on_homepage', true)
      .order('name')
    setSponsors(data ?? [])
  }

  async function fetchUpcomingEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date')
      .limit(3)
    setUpcomingEvents(data ?? [])
  }

  async function fetchNews() {
    const { data } = await supabase
      .from('news_posts')
      .select('*')
      .eq('visibility', 'public')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)
    setNews(data ?? [])
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-4">
              Embry-Riddle Aeronautical University
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
              Where Diplomacy <em className="italic text-[#d4af62]">Takes Flight</em>
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8 font-light max-w-lg">
              ERAU Model United Nations prepares the next generation of global leaders through debate, diplomacy, and collaborative problem-solving.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors">
                Join ERAU-MUN
              </Link>
              <Link to="/about" className="border border-white/35 text-white font-semibold text-sm px-6 py-3 rounded hover:border-white/70 transition-colors">
                Learn More
              </Link>
            </div>
          </div>

          {/* Upcoming Events Card */}
          <div className="bg-white/7 border border-white/13 rounded-xl p-6 backdrop-blur-sm">
            <p className="font-serif text-[#d4af62] text-base font-semibold mb-4">Upcoming Events</p>
            <div className="flex flex-col gap-3">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                <div key={event.id} className="flex gap-3 items-start bg-white/5 rounded-lg px-3 py-3">
                  <div className="w-2 h-2 rounded-full bg-[#d4af62] flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-white">{event.name}</p>
                    <p className="text-xs text-white/48 mt-0.5">
                      {new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-white/40 italic">No upcoming events scheduled.</p>
              )}
            </div>
            <Link to="/news" className="text-xs text-[#d4af62] font-semibold mt-4 block hover:underline">
              View full calendar
            </Link>
          </div>
        </div>
      </section>

      {/* Info Strip */}
      <section className="bg-[#1e3a6e] px-6 py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '2024', label: 'Founded' },
            { value: 'ERAU', label: 'Daytona Beach' },
            { value: '4', label: 'Strategic Pillars' },
            { value: 'Open', label: 'Membership' },
          ].map(item => (
            <div key={item.label}>
              <p className="font-serif text-[#d4af62] text-2xl font-bold">{item.value}</p>
              <p className="text-white/55 text-xs uppercase tracking-widest mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Pillars */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Who We Are</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-3 leading-snug">
              Building the Next Generation of <em className="italic text-[#1e3a6e]">Global Leaders</em>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-6">
              ERAU-MUN is a student-run organization dedicated to fostering diplomacy, critical thinking, and international awareness through Model United Nations conferences and events.
            </p>
            <Link to="/about" className="text-sm font-semibold text-[#1e3a6e] hover:underline">
              Learn more about us
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { title: 'Outreach', desc: 'Expanding our reach across campus and the broader MUN community.' },
              { title: 'Revitalized Events', desc: 'Bringing fresh energy to our General Body Meetings, training sessions, and socials.' },
              { title: 'Intercollegiate Competition', desc: 'Representing ERAU at conferences across the country.' },
              { title: 'ErnieMUN', desc: "Launching ERAU's first hosted intercollegiate MUN conference." },
            ].map(pillar => (
              <div key={pillar.title} className="border-l-[3px] border-[#b8963e] pl-4 py-2 bg-white rounded-r">
                <h4 className="font-semibold text-sm text-[#1e3a6e] mb-1">{pillar.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Latest</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900">News <em className="italic text-[#1e3a6e]">&amp; Updates</em></h2>
          </div>
          {news.length > 0 ? (
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
          <div className="mt-8 text-center">
            <Link to="/news" className="text-sm font-semibold text-[#1e3a6e] hover:underline">
              View all news
            </Link>
          </div>
        </div>
      </section>

      {/* Ernie Crisis CTA */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#1e3a6e] to-[#162d58] rounded-xl p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Featured Event</p>
              <h2 className="font-serif text-3xl font-bold text-white mb-3 leading-snug">
                Ernie <em className="italic text-[#d4af62]">Crisis Simulation</em>
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-6 font-light">
                Experience the intensity of crisis committee diplomacy. Open to individuals and teams from any school. Test your skills under pressure in ERAU-MUN's signature event.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/ernie-crisis" className="bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors">
                  Learn More
                </Link>
                <Link to="/ernie-crisis#register" className="border border-white/35 text-white font-semibold text-sm px-6 py-3 rounded hover:border-white/70 transition-colors">
                  Register Now
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'Open', label: 'To All Schools' },
                { value: 'Teams', label: 'and Individuals' },
                { value: 'Live', label: 'Crisis Format' },
                { value: 'ERAU', label: 'Daytona Beach' },
              ].map(stat => (
                <div key={stat.label} className="border-l-2 border-[#b8963e] pl-3">
                  <p className="font-serif text-2xl text-[#d4af62] font-bold leading-none">{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest text-white/45 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Our Supporters</p>
            <h2 className="font-serif text-2xl font-bold text-gray-900">Sponsors <em className="italic text-[#1e3a6e]">&amp; Partners</em></h2>
          </div>
          {sponsors.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {sponsors.map(sponsor => (
                <div key={sponsor.id} className="bg-white border border-gray-200 rounded-lg px-6 py-4 flex items-center gap-3 shadow-sm">
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 w-auto object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1e3a6e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {sponsor.initials ?? sponsor.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-800">{sponsor.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 italic">Interested in sponsoring ERAU-MUN?{' '}
              <Link to="/support#sponsor" className="text-[#1e3a6e] font-medium hover:underline">Learn more</Link>
            </p>
          )}
        </div>
      </section>

      {/* Join CTA */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Get Started</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-3">
              Ready to <em className="italic text-[#1e3a6e]">Join Us?</em>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-6">
              Membership is open to all ERAU students. No experience required — just a passion for diplomacy, debate, and making a difference.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { step: '1', title: 'Attend a GBM', desc: 'Come to one of our General Body Meetings to learn more about the club.' },
                { step: '2', title: 'Create an Account', desc: 'Register on our platform to access the full member portal.' },
                { step: '3', title: 'Get Involved', desc: 'Sign up for conferences, training sessions, and events.' },
              ].map(item => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#1e3a6e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-0.5">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1e3a6e] rounded-lg p-8 text-white">
            <h3 className="font-serif text-2xl font-bold mb-2">Become a Member</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-5 font-light">
              Join ERAU-MUN and gain access to conference travel, leadership opportunities, networking, and our full member portal.
            </p>
            <ul className="flex flex-col gap-2 mb-6">
              {[
                'Access to the full member portal',
                'Conference travel opportunities',
                'Training and skill development',
                'Leadership roles available',
                'Networking with MUN delegates nationwide',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-[#d4af62] font-bold mt-0.5">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className="block text-center bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors">
              Create Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}