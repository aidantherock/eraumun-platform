import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { useRealtime } from '../../../hooks/useRealtime'

const INJECT_TYPES = [
  { id: 'general', label: 'General Update', color: 'border-[#1e3a6e] bg-[#e8eef7]', badge: 'bg-[#e8eef7] text-[#1e3a6e]' },
  { id: 'urgent', label: 'Urgent', color: 'border-red-500 bg-red-50', badge: 'bg-red-100 text-red-700' },
  { id: 'development', label: 'Development', color: 'border-yellow-500 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' },
  { id: 'resolution', label: 'Resolution Update', color: 'border-green-500 bg-green-50', badge: 'bg-green-100 text-green-700' },
]

const EMPTY_FORM = { title: '', content: '', inject_type: 'general' }

export default function CommitteeCrisis() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [injects, setInjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (committee?.id) fetchInjects()
  }, [committee?.id])

  useRealtime({
    channel: `crisis-feed-${committee?.id}`,
    event: 'INSERT',
    table: 'crisis_injects',
    filter: `committee_id=eq.${committee?.id}`,
    callback: (payload) => {
      if (payload.new?.is_published) {
        setInjects(prev => [payload.new, ...prev])
      }
    },
    deps: [committee?.id]
  })

  useRealtime({
    channel: `crisis-feed-update-${committee?.id}`,
    event: 'UPDATE',
    table: 'crisis_injects',
    filter: `committee_id=eq.${committee?.id}`,
    callback: (payload) => {
      setInjects(prev => prev.map(i => i.id === payload.new.id ? payload.new : i))
    },
    deps: [committee?.id]
  })

  async function fetchInjects() {
    const query = supabase
      .from('crisis_injects')
      .select('*, profiles(first_name, last_name)')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false })

    if (!isStaff) query.eq('is_published', true)

    const { data } = await query
    setInjects(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from('crisis_injects').insert({
      committee_id: committee.id,
      title: form.title,
      content: form.content,
      inject_type: form.inject_type,
      is_published: false,
      created_by: profile.id,
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchInjects()
    setSubmitting(false)
  }

  async function publishInject(id) {
    await supabase.from('crisis_injects').update({
      is_published: true,
      published_at: new Date().toISOString(),
    }).eq('id', id)
    fetchInjects()
  }

  async function unpublishInject(id) {
    await supabase.from('crisis_injects').update({
      is_published: false,
      published_at: null,
    }).eq('id', id)
    fetchInjects()
  }

  async function deleteInject(id) {
    if (!confirm('Delete this inject?')) return
    await supabase.from('crisis_injects').delete().eq('id', id)
    fetchInjects()
  }

  const filtered = filter === 'all'
    ? injects
    : injects.filter(i => i.inject_type === filter)

  const publishedCount = injects.filter(i => i.is_published).length
  const draftCount = injects.filter(i => !i.is_published).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Crisis Feed</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff
              ? 'Create and publish crisis updates to delegates in real-time.'
              : 'Live crisis updates from the crisis director.'}
          </p>
        </div>
        {isStaff && (
          <button onClick={() => setShowForm(true)}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
            + New Inject
          </button>
        )}
      </div>

      {/* Stats — staff only */}
      {isStaff && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Injects', value: injects.length },
            { label: 'Published', value: publishedCount },
            { label: 'Drafts', value: draftCount },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
              <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* New inject form */}
      {showForm && isStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">New Crisis Inject</h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inject Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INJECT_TYPES.map(type => (
                      <button key={type.id} type="button"
                        onClick={() => setForm(prev => ({ ...prev, inject_type: type.id }))}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all text-left
                          ${form.inject_type === type.id
                            ? `${type.color} border-2`
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" name="title" required value={form.title} onChange={handleChange}
                    placeholder="e.g. Breaking: Security Council Emergency Session Called"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea name="content" required value={form.content} onChange={handleChange} rows={5}
                    placeholder="Describe the crisis development in detail..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
                </div>

                <div className="bg-[#fffbf0] border border-[#e8c96f] rounded-lg p-3">
                  <p className="text-xs text-[#7c5e10]">
                    The inject will be saved as a draft. You can publish it when ready to push to all delegates in real-time.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
            ${filter === 'all' ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
          All
        </button>
        {INJECT_TYPES.map(type => (
          <button key={type.id} onClick={() => setFilter(type.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
              ${filter === type.id ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
            {type.label}
          </button>
        ))}
      </div>

      {/* Injects feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(inject => {
            const typeConfig = INJECT_TYPES.find(t => t.id === inject.inject_type) ?? INJECT_TYPES[0]
            return (
              <div key={inject.id} className={`bg-white border-l-4 rounded-xl shadow-sm overflow-hidden
                ${inject.inject_type === 'urgent' ? 'border-l-red-500' :
                  inject.inject_type === 'development' ? 'border-l-yellow-500' :
                  inject.inject_type === 'resolution' ? 'border-l-green-500' :
                  'border-l-[#1e3a6e]'}
                ${!inject.is_published && isStaff ? 'opacity-60' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeConfig.badge}`}>
                          {typeConfig.label}
                        </span>
                        {isStaff && !inject.is_published && (
                          <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                        {inject.inject_type === 'urgent' && inject.is_published && (
                          <span className="text-xs font-bold text-red-600 animate-pulse">⚡ URGENT</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{inject.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{inject.content}</p>
                      <div className="flex items-center gap-3 mt-3">
                        {inject.published_at && (
                          <p className="text-xs text-gray-400">
                            Published {new Date(inject.published_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        )}
                        {!inject.is_published && inject.created_at && (
                          <p className="text-xs text-gray-400">
                            Created {new Date(inject.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Staff controls */}
                    {isStaff && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {!inject.is_published ? (
                          <button onClick={() => publishInject(inject.id)}
                            className="text-xs bg-green-600 text-white font-semibold px-3 py-1.5 rounded hover:bg-green-700 transition-colors">
                            Publish
                          </button>
                        ) : (
                          <button onClick={() => unpublishInject(inject.id)}
                            className="text-xs border border-gray-200 text-gray-500 font-semibold px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                            Unpublish
                          </button>
                        )}
                        <button onClick={() => deleteInject(inject.id)}
                          className="text-xs text-red-400 font-semibold hover:underline text-center">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">
            {filter === 'all' ? 'No crisis updates yet.' : `No ${filter} updates.`}
          </p>
        </div>
      )}
    </div>
  )
}