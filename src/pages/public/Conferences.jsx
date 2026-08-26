import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Conferences() {
  const [conferences, setConferences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConferences()
  }, [])

  async function fetchConferences() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_away_conference', true)
      .in('status', ['active', 'closed'])
      .order('start_date', { ascending: false })
    setConferences(data ?? [])
    setLoading(false)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Where We Compete</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            Conferences <em className="italic text-[#d4af62]">&amp; Events</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-2xl">
            ERAU-MUN competes at Model United Nations conferences across the country. Below are the conferences we are attending and hosting.
          </p>
        </div>
      </section>

      {/* Away Conferences */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Intercollegiate</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              Upcoming <em className="italic text-[#1e3a6e]">Conferences</em>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse" />
              ))}
            </div>
          ) : conferences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {conferences.map(conf => (
                <div key={conf.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="bg-[#1e3a6e] px-5 py-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#d4af62] bg-[#b8963e]/20 px-2 py-0.5 rounded mb-2 inline-block">
                      {conf.status === 'active' ? 'Upcoming' : 'Past'}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-white mt-1">{conf.name}</h3>
                    {conf.location && (
                      <p className="text-xs text-white/55 mt-1">{conf.location}</p>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    {conf.start_date && (
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(conf.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {conf.end_date && conf.end_date !== conf.start_date && (
                          <> &mdash; {new Date(conf.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                        )}
                      </p>
                    )}
                    {conf.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{conf.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Conference schedule coming soon. Check back for updates.</p>
            </div>
          )}
        </div>
      </section>

      {/* Ernie Crisis */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#1e3a6e] to-[#162d58] rounded-xl p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Hosted by ERAU-MUN</p>
              <h2 className="font-serif text-3xl font-bold text-white mb-3 leading-snug">
                Ernie <em className="italic text-[#d4af62]">Crisis Simulation</em>
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-6 font-light">
                ERAU-MUN's signature crisis simulation event, open to individuals and teams from any school. Experience the intensity of high-stakes diplomatic decision-making in a fast-paced crisis environment.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/ernie-crisis"
                  className="bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors"
                >
                  Learn More
                </Link>
                <Link
                  to="/ernie-crisis#register"
                  className="border border-white/35 text-white font-semibold text-sm px-6 py-3 rounded hover:border-white/70 transition-colors"
                >
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
    </div>
  )
}