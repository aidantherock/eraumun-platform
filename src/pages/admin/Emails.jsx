import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const TARGETS = [
  { id: 'all', label: 'All Members' },
  { id: 'eboard', label: 'Executive Board Only' },
  { id: 'role', label: 'Specific Role' },
  { id: 'event', label: 'Event Attendees' },
]

export default function AdminEmails() {
  const { profile, userRoles } = useAuth()
  const [roles, setRoles] = useState([])
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({
    subject: '',
    content: '',
    target: 'all',
    roleSlug: '',
    eventId: '',
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchRoles()
    fetchEvents()
    fetchHistory()
  }, [])

  async function fetchRoles() {
    const { data } = await supabase.from('roles').select('*').order('level', { ascending: false })
    setRoles(data ?? [])
  }

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('id, name').order('created_at', { ascending: false })
    setEvents(data ?? [])
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles(first_name, last_name)')
      .eq('action', 'mass_email_sent')
      .order('created_at', { ascending: false })
      .limit(20)
    setHistory(data ?? [])
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!confirm(`Send this email to ${TARGETS.find(t => t.id === form.target)?.label}? This cannot be undone.`)) return

    setSending(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/.netlify/functions/mass-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          senderId: profile.id,
          senderName: `${profile.first_name} ${profile.last_name}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Failed to send')

      setResult(data.sent)
      setForm({ subject: '', content: '', target: 'all', roleSlug: '', eventId: '' })
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Email Center</h1>
        <p className="text-sm text-gray-500 mt-1">Send mass emails to members, roles, or event attendees.</p>
      </div>

      {/* Compose */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-5">Compose Email</h2>

        {result !== null && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            Email sent successfully to {result} recipient{result !== 1 ? 's' : ''}.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TARGETS.map(target => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, target: target.id }))}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium text-left transition-all
                    ${form.target === target.id
                      ? 'border-[#1e3a6e] bg-[#e8eef7] text-[#1e3a6e]'
                      : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'
                    }`}
                >
                  {target.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role selector */}
          {form.target === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select name="roleSlug" value={form.roleSlug} onChange={handleChange} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                <option value="">Select a role...</option>
                {roles.map(r => <option key={r.id} value={r.slug}>{r.name}</option>)}
              </select>
            </div>
          )}

          {/* Event selector */}
          {form.target === 'event' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
              <select name="eventId" value={form.eventId} onChange={handleChange} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                <option value="">Select an event...</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              name="subject"
              required
              value={form.subject}
              onChange={handleChange}
              placeholder="Email subject line"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              name="content"
              required
              value={form.content}
              onChange={handleChange}
              rows={8}
              placeholder="Write your message here. Use blank lines to separate paragraphs."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Plain text. Blank lines become paragraph breaks.</p>
          </div>

          {/* Preview note */}
          <div className="bg-[#fffbf0] border border-[#e8c96f] rounded-lg p-3">
            <p className="text-xs text-[#7c5e10]">
              <strong>Before sending:</strong> This email will be sent using the ERAU-MUN branded template to all selected recipients. This action is logged in the audit trail and cannot be undone.
            </p>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-8 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>

      {/* Send history */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Send History</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {history.length > 0 ? history.map(log => (
            <div key={log.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{log.metadata?.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    To: <span className="capitalize">{log.metadata?.target}</span>
                    {log.metadata?.sent && ` — ${log.metadata.sent} recipients`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sent by {log.profiles?.first_name} {log.profiles?.last_name}
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(log.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No emails sent yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}