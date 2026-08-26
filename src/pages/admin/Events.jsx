import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminEvents() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    is_away_conference: false,
    hotel_info: '',
    schedule_url: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*, committees(id, name, type)')
      .order('created_at', { ascending: false })
    setEvents(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { error } = await supabase.from('events').insert({
      ...form,
      slug,
      status: 'draft',
      created_by: profile.id,
      organization_id: profile.organization_id,
    })

    if (!error) {
      setShowForm(false)
      setForm({ name: '', description: '', location: '', start_date: '', end_date: '', is_away_conference: false, hotel_info: '', schedule_url: '' })
      fetchEvents()
    }
    setSubmitting(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('events').update({ status }).eq('id', id)
    fetchEvents()
  }

  async function deleteEvent(id) {
    if (!confirm('Delete this event? This will also delete all committees and data under it.')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  const STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage events and conferences.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + New Event
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">New Event</h2>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={form.location} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_away_conference" checked={form.is_away_conference} onChange={handleChange} className="accent-[#1e3a6e]" />
              <span className="text-sm text-gray-600">This is an away conference</span>
            </label>
            {form.is_away_conference && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Info</label>
                  <input type="text" name="hotel_info" value={form.hotel_info} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule URL</label>
                  <input type="url" name="schedule_url" value={form.schedule_url} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      {/* Events list */}
      <div className="flex flex-col gap-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />)
        ) : events.length > 0 ? events.map(event => (
          <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{event.name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
                    {event.status}
                  </span>
                  {event.is_away_conference && (
                    <span className="text-xs font-bold text-[#b8963e] bg-[#fdf6e3] px-2 py-0.5 rounded-full">Away</span>
                  )}
                </div>
                {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
                {event.start_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {event.end_date && event.end_date !== event.start_date && (
                      <> — {new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </p>
                )}
                {event.committees?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{event.committees.length} committee{event.committees.length !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                <select
                  value={event.status}
                  onChange={e => updateStatus(event.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#1e3a6e] bg-white"
                >
                  {['draft', 'active', 'live', 'closed', 'archived'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Link
                  to={`/admin/event/${event.id}`}
                  className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors"
                >
                  Manage
                </Link>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">No events yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}