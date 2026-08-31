<SEO
  title="Photo Gallery"
  description="Photos from ERAU-MUN conferences, events, and club activities."
  url="/gallery"
/>

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import SEO from '../../components/SEO'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [events, setEvents] = useState([])
  const [eventFilter, setEventFilter] = useState('all')

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photo_gallery')
      .select('*, events(name)')
      .eq('is_public', true)
      .order('display_order')
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])

    const uniqueEvents = []
    const seen = new Set()
    for (const p of data ?? []) {
      if (p.events && !seen.has(p.event_id)) {
        seen.add(p.event_id)
        uniqueEvents.push({ id: p.event_id, name: p.events.name })
      }
    }
    setEvents(uniqueEvents)
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (!selected) return
    if (e.key === 'Escape') setSelected(null)
    if (e.key === 'ArrowRight') {
      const idx = photos.findIndex(p => p.id === selected.id)
      if (idx < photos.length - 1) setSelected(photos[idx + 1])
    }
    if (e.key === 'ArrowLeft') {
      const idx = photos.findIndex(p => p.id === selected.id)
      if (idx > 0) setSelected(photos[idx - 1])
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, photos])

  const filtered = photos.filter(p =>
    eventFilter === 'all' || p.event_id === eventFilter
  )

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Memories</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            Photo <em className="italic text-[#d4af62]">Gallery</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-2xl">
            Photos from ERAU-MUN events, conferences, and club activities.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-7xl mx-auto">

          {/* Event filter */}
          {events.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8">
              <button onClick={() => setEventFilter('all')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                  ${eventFilter === 'all' ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
                All Events
              </button>
              {events.map(e => (
                <button key={e.id} onClick={() => setEventFilter(e.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                    ${eventFilter === e.id ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
                  {e.name}
                </button>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {selected && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelected(null)}>
              <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelected(null)}
                  className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-medium">
                  Close &#x2715;
                </button>

                {/* Prev */}
                {photos.findIndex(p => p.id === selected.id) > 0 && (
                  <button
                    onClick={() => {
                      const idx = photos.findIndex(p => p.id === selected.id)
                      setSelected(photos[idx - 1])
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-white/70 hover:text-white text-2xl font-bold">
                    &#8249;
                  </button>
                )}

                {/* Next */}
                {photos.findIndex(p => p.id === selected.id) < photos.length - 1 && (
                  <button
                    onClick={() => {
                      const idx = photos.findIndex(p => p.id === selected.id)
                      setSelected(photos[idx + 1])
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-white/70 hover:text-white text-2xl font-bold">
                    &#8250;
                  </button>
                )}

                <img src={selected.photo_url} alt={selected.title}
                  className="w-full max-h-[70vh] object-contain rounded-lg" />

                {(selected.title || selected.caption || selected.events?.name) && (
                  <div className="mt-4 text-center">
                    {selected.title && <p className="text-white font-semibold">{selected.title}</p>}
                    {selected.caption && <p className="text-white/60 text-sm mt-1">{selected.caption}</p>}
                    {selected.events?.name && (
                      <p className="text-[#d4af62] text-xs font-semibold mt-1">{selected.events.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(photo => (
                <button key={photo.id} onClick={() => setSelected(photo)}
                  className="group relative rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <img src={photo.photo_url} alt={photo.title}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                    {(photo.caption || photo.events?.name) && (
                      <div className="p-3 opacity-0 group-hover:opacity-100 transition-all w-full">
                        {photo.caption && (
                          <p className="text-white text-xs font-medium truncate">{photo.caption}</p>
                        )}
                        {photo.events?.name && (
                          <p className="text-[#d4af62] text-xs truncate">{photo.events.name}</p>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">No photos yet. Check back soon.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-8">
              {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
              {eventFilter !== 'all' ? ` from ${events.find(e => e.id === eventFilter)?.name}` : ''}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}