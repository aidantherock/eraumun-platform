import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  school: '',
  committeeId: '',
  assignment: '',
}

export default function EventAdminGuestDelegates() {
  const { event } = useOutletContext()
  const { profile } = useAuth()
  const [delegates, setDelegates] = useState([])
  const [committees, setCommittees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (event?.id) {
      fetchDelegates()
      fetchCommittees()
    }
  }, [event?.id])

  async function fetchDelegates() {
    const { data } = await supabase
      .from('guest_delegates')
      .select('*, committees(name)')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
    setDelegates(data ?? [])
    setLoading(false)
  }

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committees')
      .select('id, name, type')
      .eq('event_id', event.id)
      .order('name')
    setCommittees(data ?? [])
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function closeForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/.netlify/functions/create-guest-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          school: form.school || null,
          eventId: event.id,
          committeeId: form.committeeId || null,
          assignment: form.assignment || null,
          createdBy: profile.id,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create delegate')

      setSuccess(`Account created for ${form.firstName} ${form.lastName}. Login email sent.`)
      closeForm()
      fetchDelegates()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function removeDelegate(id, profileId) {
    if (!confirm('Remove this guest delegate? Their account will be deleted.')) return

    // Delete auth user via service role
    await fetch('/.netlify/functions/admin-get-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profileId })
    })

    await supabase.from('guest_delegates').delete().eq('id', id)
    fetchDelegates()
  }

  async function resendCredentials(delegate) {
    try {
      const res = await fetch('/.netlify/functions/create-guest-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: delegate.login_email,
          firstName: delegate.first_name,
          lastName: delegate.last_name,
          school: delegate.school,
          eventId: event.id,
          committeeId: delegate.committee_id,
          assignment: delegate.assignment,
          createdBy: profile.id,
          resend: true,
        })
      })
      if (res.ok) setSuccess(`Credentials resent to ${delegate.login_email}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = delegates.filter(d => {
    const matchesSearch = search === '' ||
      `${d.first_name} ${d.last_name} ${d.login_email}`.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' ||
      (filter === 'assigned' ? d.committee_id : !d.committee_id)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Guest Delegates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create temporary accounts for outside delegates attending {event?.name}.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + Add Delegate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Delegates', value: delegates.length },
          { label: 'Assigned', value: delegates.filter(d => d.committee_id).length },
          { label: 'Unassigned', value: delegates.filter(d => !d.committee_id).length },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Success / error */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{success}</div>
      )}

      {/* Add delegate modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Add Guest Delegate</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" name="firstName" required value={form.firstName} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" name="lastName" required value={form.lastName} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    placeholder="delegate@school.edu" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School / Institution</label>
                  <input type="text" name="school" value={form.school} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    placeholder="Their home institution" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Committee (optional)</label>
                  <select name="committeeId" value={form.committeeId} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                    <option value="">No committee assigned</option>
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {form.committeeId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignment (country, portfolio, etc.)</label>
                    <input type="text" name="assignment" value={form.assignment} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                      placeholder="e.g. United States, Crisis Director" />
                  </div>
                )}

                <div className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-lg p-3">
                  <p className="text-xs text-[#1e3a6e]">
                    A temporary account will be created and login credentials sent to the delegate's email. The account persists until this event is deleted.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create & Send Credentials'}
                  </button>
                  <button type="button" onClick={closeForm}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search delegates..."
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors w-64"
        />
        <div className="flex gap-2">
          {['all', 'assigned', 'unassigned'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Delegates list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(delegate => (
              <div key={delegate.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0">
                  {delegate.first_name?.charAt(0)}{delegate.last_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {delegate.first_name} {delegate.last_name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-gray-400">{delegate.login_email}</p>
                    {delegate.school && <p className="text-xs text-gray-400">{delegate.school}</p>}
                    {delegate.committees?.name && (
                      <span className="text-xs font-semibold text-[#b8963e]">{delegate.committees.name}</span>
                    )}
                    {delegate.assignment && (
                      <span className="text-xs text-gray-500">— {delegate.assignment}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => resendCredentials(delegate)}
                    className="text-xs text-[#1e3a6e] font-semibold hover:underline"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => removeDelegate(delegate.id, delegate.profile_id)}
                    className="text-xs text-red-400 font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">
            {search || filter !== 'all' ? 'No delegates match your search.' : 'No guest delegates yet. Add one to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}