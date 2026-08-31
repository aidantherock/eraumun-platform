import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ConferenceRecap() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [committees, setCommittees] = useState([])
  const [awards, setAwards] = useState([])
  const [photos, setPhotos] = useState([])
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => {
    if (eventId) fetchAll()
  }, [eventId])

  async function fetchAll() {
    await Promise.all([
      fetchEvent(),
      fetchCommittees(),
      fetchAwards(),
      fetchPhotos(),
      fetchAttendees(),
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

  async function fetchAwards() {
    const { data } = await supabase
      .from('awards')
      .select('*, profiles!awards_user_id_fkey(first_name, last_name, school), committees(name)')
      .eq('event_id', eventId)
      .eq('is_public', true)
      .order('awarded_at', { ascending: false })
    setAwards(data ?? [])
  }

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photo_gallery')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_public', true)
      .order('display_order')
      .order('created_at', { ascending: false })
      .limit(12)
    setPhotos(data ?? [])
  }

  async function fetchAttendees() {
    const { data: eventRoles } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', eventId)

    if (!eventRoles?.length) return

    const { data } = await supabase
      .from('user_event_roles')
      .select('profiles(school)')
      .in('event_role_id', eventRoles.map(r => r.id))
      .eq('approved', true)

    setAttendees(data ?? [])
  }

  const schools = [...new Set(
    attendees
      .map(a => a.profiles?.school)
      .filter(Boolean)
  )].sort()

  const awardsByCommittee = awards.reduce((acc, award) => {
    const key = award.committees?.name ?? 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(award)
    return acc
  }, {})

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
          <p className="text-gray-500 mb-4">Conference not found.</p>
          <Link to="/conferences" className="text-sm text-[#1e3a6e] font-medium hover:underline">
            Back to Conferences
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <Link to="/conferences"
            className="text-xs text-white/50 hover:text-white font-medium transition-colors mb-6 inline-block">
            &#8592; Back to Conferences
          </Link>
          <div className="flex items-start gap-5">
            {event.logo_url && (
              <img src={event.logo_url} alt={event.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-white/20" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-2">Conference Recap</p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-3">{event.name}</h1>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0f2040] px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: attendees.length, label: 'Delegates' },
            { value: committees.length, label: 'Committees' },
            { value: awards.length, label: 'Awards Given' },
            { value: schools.length, label: 'Schools' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-serif text-3xl font-bold text-[#d4af62]">{stat.value}</p>
              <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Description */}
      {event.description && (
        <section className="px-6 py-16 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-3">About</p>
            <p className="text-gray-600 text-base leading-relaxed">{event.description}</p>
          </div>
        </section>
      )}

      {/* Committees */}
      {committees.length > 0 && (
        <section className="px-6 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Committees</p>
              <h2 className="font-serif text-3xl font-bold text-gray-900">
                Committees <em className="italic text-[#1e3a6e]">at this Conference</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {committees.map(committee => (
                <div key={committee.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                  {committee.topic && (
                    <div className="px-5 py-3">
                      <p className="text-xs text-gray-500 leading-relaxed">{committee.topic}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <section className="px-6 py-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Recognition</p>
              <h2 className="font-serif text-3xl font-bold text-gray-900">
                Awards <em className="italic text-[#1e3a6e]">&amp; Honors</em>
              </h2>
            </div>
            <div className="space-y-8">
              {Object.entries(awardsByCommittee).map(([committeeName, committeeAwards]) => (
                <div key={committeeName}>
                  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
                    {committeeName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {committeeAwards.map(award => (
                      <div key={award.id} className="bg-[#fdf6e3] border border-[#b8963e]/20 rounded-xl p-5 flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">🏆</span>
                        <div>
                          <p className="text-sm font-bold text-[#b8963e]">{award.award_type}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">
                            {award.user_id
                              ? `${award.profiles?.first_name} ${award.profiles?.last_name}`
                              : `Delegation: ${award.delegation}`}
                          </p>
                          {award.profiles?.school && (
                            <p className="text-xs text-gray-400 mt-0.5">{award.profiles.school}</p>
                          )}
                          {award.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">{award.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <section className="px-6 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Memories</p>
              <h2 className="font-serif text-3xl font-bold text-gray-900">
                Photo <em className="italic text-[#1e3a6e]">Gallery</em>
              </h2>
            </div>

            {/* Lightbox */}
            {selectedPhoto && (
              <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedPhoto(null)}>
                <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelectedPhoto(null)}
                    className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-medium">
                    Close &#x2715;
                  </button>
                  <img src={selectedPhoto.photo_url} alt={selectedPhoto.title}
                    className="w-full max-h-[70vh] object-contain rounded-lg" />
                  {selectedPhoto.caption && (
                    <p className="text-center text-white/60 text-sm mt-3">{selectedPhoto.caption}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <button key={photo.id} onClick={() => setSelectedPhoto(photo)}
                  className="group relative rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                </button>
              ))}
            </div>

            <div className="text-center mt-6">
              <Link to="/gallery"
                className="text-sm text-[#1e3a6e] font-semibold hover:underline">
                View all photos in gallery →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Participating schools */}
      {schools.length > 0 && (
        <section className="px-6 py-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Participants</p>
              <h2 className="font-serif text-3xl font-bold text-gray-900">
                Participating <em className="italic text-[#1e3a6e]">Schools</em>
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {schools.map(school => (
                <span key={school}
                  className="text-sm font-medium bg-[#e8eef7] text-[#1e3a6e] px-4 py-2 rounded-full">
                  {school}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-16 bg-gradient-to-br from-[#1e3a6e] to-[#0f2040] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Join Us</p>
          <h2 className="font-serif text-3xl font-bold mb-4">
            Want to be part of the next <em className="italic text-[#d4af62]">conference</em>?
          </h2>
          <p className="text-white/60 text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Join ERAU-MUN and compete at conferences across the country alongside delegates from top universities.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            
              <a href="https://campusgroups.erau.edu/mun/club_signup"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#b8963e] text-white font-semibold px-7 py-3 rounded hover:bg-[#d4af62] transition-colors text-sm"
            >
              Join on CampusGroups
            </a>
            <Link to="/conferences"
              className="border border-white/30 text-white font-semibold px-7 py-3 rounded hover:bg-white/10 transition-colors text-sm">
              View All Conferences
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}