export default function Placeholder() { return <div className='p-8 text-gray-500'>Announcements - coming soon</div> }
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminAnnouncements() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    content: '',
    visibility: 'members',
    is_urgent: false,
    is_scheduled: false,
    scheduled_for: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .is('committee_id', null)
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('announcements').insert({
      created_by: profile.id,
      title: form.title,
      content: form.content,
      visibility: form.visibility,
      is_urgent: form.is_urgent,
      is_scheduled: form.is_scheduled,
      scheduled_for: form.is_scheduled ? form.scheduled_for : null,
      status: form.is_scheduled ? 'draft' : 'published',
      published_at: form.is_scheduled ? null : new Date().toISOString(),
    })

    if (!error) {
      setShowForm(false)
      setForm({ title: '', content: '', visibility: 'members', is_urgent: false, is_scheduled: false, scheduled_for: '' })
      fetchAnnouncements()
    }
    setSubmitting(false)
  }

  async function archiveAnnouncement(id) {
    await supabase.from('announcements').update({ status: 'archived' }).eq('id', id)
    fetchAnnouncements()
  }

  async function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchAnnouncements()
  }

  const STATUS_COLORS = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-500',
  }

  const VISIBILITY_COLORS = {
    public: 'bg-blue-100 text-blue-700',
    members: 'bg-purple-100 text-purple-700',
    committee: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Post updates to members and the public site.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + New Announcement
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">New Announcement</h2>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" name="title" required value={form.title} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea name="content" required value={form.content} onChange={handleChange} rows={4}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select name="visibility" value={form.visibility} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                  <option value="public">Public (appears on public site)</option>
                  <option value="members">Members only</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_urgent" checked={form.is_urgent} onChange={handleChange} className="accent-[#1e3a6e]" />
                <span className="text-sm text-gray-600">Mark as urgent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_scheduled" checked={form.is_scheduled} onChange={handleChange} className="accent-[#1e3a6e]" />
                <span className="text-sm text-gray-600">Schedule for later</span>
              </label>
            </div>
            {form.is_scheduled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
                <input type="datetime-local" name="scheduled_for" value={form.scheduled_for} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
              {submitting ? 'Posting...' : form.is_scheduled ? 'Schedule' : 'Post Now'}
            </button>
          </form>
        </div>
      )}

      {/* Announcements list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : announcements.length > 0 ? announcements.map(ann => (
            <div key={ann.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{ann.title}</p>
                    {ann.is_urgent && <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">Urgent</span>}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[ann.status]}`}>{ann.status}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${VISIBILITY_COLORS[ann.visibility]}`}>{ann.visibility}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{ann.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {ann.published_at
                      ? new Date(ann.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : ann.scheduled_for
                      ? `Scheduled: ${new Date(ann.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'Draft'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {ann.status === 'published' && (
                    <button onClick={() => archiveAnnouncement(ann.id)}
                      className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded hover:bg-gray-50 transition-colors">
                      Archive
                    </button>
                  )}
                  <button onClick={() => deleteAnnouncement(ann.id)}
                    className="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No announcements yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}