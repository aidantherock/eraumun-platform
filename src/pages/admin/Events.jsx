import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminEvents() {
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [interestedUsers, setInterestedUsers] = useState([])
  const [form, setForm] = useState({
    name: '', description: '', location: '', event_location: '',
    event_time: '', category: '', start_date: '', end_date: '',
    is_away_conference: false, is_recurring: false, recurrence_rule: '',
    recurrence_end_date: '', hotel_info: '', schedule_url: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*, committees(id, name, type)')
      .order('created_at', { ascending: false })
    setEvents(data ?? [])
    setLoading(false)
  }

  async function fetchInterestedUsers(eventId) {
    const { data } = await supabase
      .from('user_event_roles')
      .select('*, profiles(id, first_name, last_name, email, school), event_roles(name)')
      .eq('event_roles.event_id', eventId)
    setInterestedUsers(data ?? [])
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
    const { error } = await supabase.from('events').insert({
      ...form,
      slug,
      status: 'active',
      is_cancelled: false,
      created_by: profile.id,
      organization_id: profile.organization_id,
    })
    if (!error) {
      setShowForm(false)
      setForm({
        name: '', description: '', location: '', event_location: '',
        event_time: '', category: '', start_date: '', end_date: '',
        is_away_conference: false, is_recurring: false, recurrence_rule: '',
        recurrence_end_date: '', hotel_info: '', schedule_url: '',
      })
      fetchEvents()
    }
    setSubmitting(false)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('events').update(form).eq('id', selected.id)
    if (!error) {
      setEditing(false)
      fetchEvents()
      setSelected(prev => ({ ...prev, ...form }))
    }
    setSubmitting(false)
  }

  function openEdit(event) {
    setSelected(event)
    setForm({
      name: event.name ?? '',
      description: event.description ?? '',
      location: event.location ?? '',
      event_location: event.event_location ?? '',
      event_time: event.event_time ?? '',
      category: event.category ?? '',
      start_date: event.start_date ?? '',
      end_date: event.end_date ?? '',
      is_away_conference: event.is_away_conference ?? false,
      is_recurring: event.is_recurring ?? false,
      recurrence_rule: event.recurrence_rule ?? '',
      recurrence_end_date: event.recurrence_end_date ?? '',
      hotel_info: event.hotel_info ?? '',
      schedule_url: event.schedule_url ?? '',
    })
    setEditing(true)
    fetchInterestedUsers(event.id)
  }

  async function updateStatus(id, status) {
    await supabase.from('events').update({ status }).eq('id', id)
    fetchEvents()
  }

  async function cancelEvent(id) {
    if (!confirm('Cancel this event? It will be hidden from the public calendar.')) return
    await supabase.from('events').update({ is_cancelled: true, status: 'closed' }).eq('id', id)
    fetchEvents()
  }

  async function deleteEvent(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await supabase.from('events').delete().eq('id', id)
    setSelected(null)
    setEditing(false)
    fetchEvents()
  }

  async function approveInterest(userEventRoleId) {
    await supabase.from('user_event_roles').update({ approved: true }).eq('id', userEventRoleId)
    fetchInterestedUsers(selected.id)
  }

  const STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-400',
  }

  const FormFields = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
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
      <div className="grid grid-cols-3 gap-4">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input type="time" name="event_time" value={form.event_time} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" value={form.category} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
            <option value="">None</option>
            <option value="gbm">GBM</option>
            <option value="training">Training</option>
            <option value="committee">Committee</option>
            <option value="social">Social</option>
            <option value="conference">Conference</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specific Location</label>
          <input type="text" name="event_location" value={form.event_location} onChange={handleChange}
            placeholder="Room, building, etc."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="is_recurring" checked={form.is_recurring} onChange={handleChange} className="accent-[#1e3a6e]" />
        <span className="text-sm text-gray-600">Recurring event</span>
      </label>
      {form.is_recurring && (
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
            <select name="recurrence_rule" value={form.recurrence_rule} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
              <option value="">Select...</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Until</label>
            <input type="date" name="recurrence_end_date" value={form.recurrence_end_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
          </div>
        </div>
      )}
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
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage events and conferences.</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(false); setSelected(null) }}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
          + New Event
        </button>
      </div>

      {/* Create form */}
      {showForm && !editing && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">New Event</h2>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
          <FormFields onSubmit={handleSubmit} submitLabel="Create Event" />
        </div>
      )}

      {/* Edit modal */}
      {editing && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Edit: {selected.name}</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <FormFields onSubmit={handleUpdate} submitLabel="Save Changes" />

              {/* Interested users */}
              {interestedUsers.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Interest Signups</h3>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                    {interestedUsers.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.profiles?.first_name} {item.profiles?.last_name}
                          </p>
                          <p className="text-xs text-gray-400">{item.profiles?.email} — {item.profiles?.school}</p>
                        </div>
                        {item.approved ? (
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Approved</span>
                        ) : (
                          <button
                            onClick={() => approveInterest(item.id)}
                            className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => cancelEvent(selected.id)}
                  className="text-xs text-yellow-600 border border-yellow-200 px-4 py-2 rounded hover:bg-yellow-50 transition-colors font-semibold">
                  Cancel Event
                </button>
                <button onClick={() => deleteEvent(selected.id)}
                  className="text-xs text-red-500 border border-red-200 px-4 py-2 rounded hover:bg-red-50 transition-colors font-semibold">
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="flex flex-col gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />)
        ) : events.length > 0 ? events.map(event => (
          <div key={event.id} className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${event.is_cancelled ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{event.name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
                    {event.status}
                  </span>
                  {event.is_cancelled && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">Cancelled</span>
                  )}
                  {event.is_recurring && (
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Recurring</span>
                  )}
                  {event.is_away_conference && (
                    <span className="text-xs font-bold text-[#b8963e] bg-[#fdf6e3] px-2 py-0.5 rounded-full">Away</span>
                  )}
                  {event.category && (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{event.category}</span>
                  )}
                </div>
                {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
                {event.start_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {event.event_time && ` at ${event.event_time}`}
                    {event.end_date && event.end_date !== event.start_date && (
                      <> — {new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </p>
                )}
                {event.is_recurring && event.recurrence_rule && (
                  <p className="text-xs text-purple-500 mt-0.5 capitalize">Repeats {event.recurrence_rule}</p>
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
                <button
                  onClick={() => openEdit(event)}
                  className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors"
                >
                  Edit
                </button>
                <Link
                  to={`/admin/event/${event.id}`}
                  className="text-xs border border-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded hover:border-[#1e3a6e] hover:text-[#1e3a6e] transition-colors"
                >
                  Manage
                </Link>
                <button
                  onClick={() => cancelEvent(event.id)}
                  className="text-xs text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded hover:bg-yellow-50 transition-colors"
                >
                  Cancel
                </button>
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