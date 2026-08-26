import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'

const EMPTY_FORM = {
  day: '',
  start_time: '',
  end_time: '',
  title: '',
  description: '',
  location: '',
  type: 'general',
}

const TYPE_COLORS = {
  general: 'bg-gray-100 text-gray-600',
  session: 'bg-blue-100 text-blue-700',
  break: 'bg-green-100 text-green-700',
  social: 'bg-purple-100 text-purple-700',
  committee: 'bg-yellow-100 text-yellow-700',
  ceremony: 'bg-red-100 text-red-700',
}

export default function EventAdminSchedule() {
  const { event } = useOutletContext()
  const { profile } = useAuth()
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (event?.id) fetchSchedule()
  }, [event?.id])

  async function fetchSchedule() {
    const { data } = await supabase
      .from('event_schedule')
      .select('*')
      .eq('event_id', event.id)
      .order('day')
      .order('start_time')
    setSchedule(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      ...form,
      event_id: event.id,
      created_by: profile.id,
      end_time: form.end_time || null,
      description: form.description || null,
      location: form.location || null,
    }

    if (editing) {
      await supabase.from('event_schedule').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('event_schedule').insert(payload)
    }

    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    fetchSchedule()
    setSubmitting(false)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      day: item.day ?? '',
      start_time: item.start_time ?? '',
      end_time: item.end_time ?? '',
      title: item.title ?? '',
      description: item.description ?? '',
      location: item.location ?? '',
      type: item.type ?? 'general',
    })
    setShowForm(true)
  }

  async function deleteItem(id) {
    if (!confirm('Delete this schedule item?')) return
    await supabase.from('event_schedule').delete().eq('id', id)
    fetchSchedule()
  }

  const scheduleByDay = schedule.reduce((acc, item) => {
    const day = item.day
    if (!acc[day]) acc[day] = []
    acc[day].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Build the day-by-day schedule for {event?.name}.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM) }}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Item' : 'Add Schedule Item'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }}
                className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                    <input type="date" name="day" required value={form.day} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select name="type" value={form.type} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                      <option value="general">General</option>
                      <option value="session">Session</option>
                      <option value="committee">Committee</option>
                      <option value="break">Break</option>
                      <option value="social">Social</option>
                      <option value="ceremony">Ceremony</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" name="start_time" required value={form.start_time} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time (optional)</label>
                    <input type="time" name="end_time" value={form.end_time} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" name="title" required value={form.title} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    placeholder="e.g. Opening Ceremony, Committee Session 1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                  <input type="text" name="location" value={form.location} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    placeholder="e.g. Room 101, Main Hall" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
                    placeholder="Additional details..." />
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Item'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Schedule */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />)}
        </div>
      ) : Object.keys(scheduleByDay).length > 0 ? (
        Object.entries(scheduleByDay).map(([day, items]) => (
          <div key={day} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#1e3a6e] px-6 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {new Date(day + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </p>
              <span className="text-xs text-white/50">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-start gap-4">
                  <div className="text-xs font-semibold text-gray-400 min-w-[80px] pt-0.5">
                    {item.start_time?.slice(0, 5)}
                    {item.end_time && <><br />{item.end_time?.slice(0, 5)}</>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[item.type] ?? TYPE_COLORS.general}`}>
                        {item.type}
                      </span>
                    </div>
                    {item.location && <p className="text-xs text-[#b8963e] mt-0.5">{item.location}</p>}
                    {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(item)}
                      className="text-xs text-[#1e3a6e] font-semibold hover:underline">Edit</button>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-xs text-red-400 font-semibold hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No schedule items yet. Add your first item above.</p>
        </div>
      )}
    </div>
  )
}