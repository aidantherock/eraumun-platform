import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  revision_requested: 'bg-orange-100 text-orange-700',
  withdrawn: 'bg-gray-100 text-gray-500',
}

export default function CommitteeSubmissions() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState(isStaff ? 'all' : 'mine')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', document_type: '' })
  const [submitting, setSubmitting] = useState(false)
  const [documentTypes, setDocumentTypes] = useState([])

  useEffect(() => {
    if (committee?.id) {
      fetchSubmissions()
      fetchDocumentTypes()
    }
  }, [committee?.id, view])

  async function fetchSubmissions() {
    setLoading(true)
    let query = supabase
      .from('submissions')
      .select('*, profiles(first_name, last_name, school), submission_replies(*, profiles(first_name, last_name))')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false })

    if (view === 'mine') {
      query = query.eq('submitted_by', profile.id)
    }

    const { data } = await query
    setSubmissions(data ?? [])
    setLoading(false)
  }

  async function fetchDocumentTypes() {
    const { data } = await supabase
      .from('document_types')
      .select('*')
      .order('name')
    setDocumentTypes(data ?? [])
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from('submissions').insert({
      committee_id: committee.id,
      submitted_by: profile.id,
      title: form.title,
      content: form.content,
      document_type_id: form.document_type || null,
      status: 'pending',
    })
    setForm({ title: '', content: '', document_type: '' })
    setShowForm(false)
    fetchSubmissions()
    setSubmitting(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('submissions').update({ status }).eq('id', id)
    fetchSubmissions()
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff ? 'Review and manage all committee submissions.' : 'Submit and track your documents.'}
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
          + New Submission
        </button>
      </div>

      {/* View toggle for staff */}
      {isStaff && (
        <div className="flex rounded-lg overflow-hidden border border-gray-200 w-fit">
          {[
            { id: 'all', label: 'All Submissions' },
            { id: 'mine', label: 'My Submissions' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`px-4 py-2 text-xs font-semibold transition-colors
                ${view === v.id ? 'bg-[#1e3a6e] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected', 'revision_requested', 'withdrawn'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
              ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* New submission form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">New Submission</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" name="title" required value={form.title} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>
                {documentTypes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                    <select name="document_type" value={form.document_type} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                      <option value="">Select type...</option>
                      {documentTypes.map(dt => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea name="content" required value={form.content} onChange={handleChange} rows={8}
                    placeholder="Write your document content here..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none font-mono" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submissions list */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : filtered.length > 0 ? filtered.map(sub => (
              <button key={sub.id} onClick={() => setSelected(sub)}
                className={`w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors
                  ${selected?.id === sub.id ? 'bg-[#e8eef7]' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{sub.title}</p>
                    {isStaff && view === 'all' && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sub.profiles?.first_name} {sub.profiles?.last_name}
                        {sub.profiles?.school && ` — ${sub.profiles.school}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {sub.submission_replies?.length > 0 && (
                      <p className="text-xs text-[#1e3a6e] font-medium mt-0.5">
                        {sub.submission_replies.length} reply{sub.submission_replies.length !== 1 ? 'ies' : ''}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${STATUS_COLORS[sub.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {sub.status?.replace('_', ' ')}
                  </span>
                </div>
              </button>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                {view === 'mine' ? "You haven't submitted anything yet." : 'No submissions found.'}
              </div>
            )}
          </div>
        </div>

        {/* Submission detail */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 truncate">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">&#x2715;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[550px] overflow-y-auto">
              {/* Meta */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[selected.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {selected.status?.replace('_', ' ')}
                </span>
                {isStaff && (
                  <p className="text-xs text-gray-500">
                    By {selected.profiles?.first_name} {selected.profiles?.last_name}
                    {selected.profiles?.school && ` — ${selected.profiles.school}`}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">{selected.content}</p>
              </div>

              {/* Replies */}
              {selected.submission_replies?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Staff Replies</p>
                  {selected.submission_replies.map(reply => (
                    <div key={reply.id} className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-lg px-4 py-3">
                      <p className="text-xs font-bold text-[#1e3a6e] mb-1">
                        {reply.profiles?.first_name} {reply.profiles?.last_name}
                        <span className="font-normal text-gray-400 ml-2">
                          {new Date(reply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Staff controls */}
              {isStaff && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'approved', 'rejected', 'revision_requested', 'withdrawn'].map(s => (
                      <button key={s} onClick={() => updateStatus(selected.id, s)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all
                          ${selected.status === s
                            ? STATUS_COLORS[s] + ' border-transparent'
                            : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}