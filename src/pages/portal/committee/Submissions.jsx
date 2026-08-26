import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  tabled: 'bg-purple-100 text-purple-700',
}

export default function CommitteeSubmissions() {
  const { committee, userRole, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [docTypes, setDocTypes] = useState([])
  const [selected, setSelected] = useState(null)
  const [versions, setVersions] = useState([])
  const [replies, setReplies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [formData, setFormData] = useState({})
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (committee?.id) {
      fetchSubmissions()
      fetchDocTypes()
    }
  }, [committee?.id])

  async function fetchSubmissions() {
    const query = supabase
      .from('submissions')
      .select('*, document_types(name, slug), profiles(first_name, last_name)')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false })

    if (!isStaff) {
      query.eq('submitted_by', profile.id)
    }

    const { data } = await query
    setSubmissions(data ?? [])
    setLoading(false)
  }

  async function fetchDocTypes() {
    const { data } = await supabase
      .from('document_types')
      .select('*')
      .in('committee_type', [committee.type, 'both'])
    setDocTypes(data ?? [])
  }

  async function fetchVersions(submissionId) {
    const { data } = await supabase
      .from('submission_versions')
      .select('*')
      .eq('submission_id', submissionId)
      .order('version_number', { ascending: false })
    setVersions(data ?? [])
  }

  async function fetchReplies(submissionId) {
    const { data } = await supabase
      .from('submission_replies')
      .select('*, profiles(first_name, last_name)')
      .eq('submission_id', submissionId)
      .order('created_at')
    setReplies(data ?? [])
  }

  async function selectSubmission(sub) {
    setSelected(sub)
    await Promise.all([fetchVersions(sub.id), fetchReplies(sub.id)])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    const { data: sub, error } = await supabase
      .from('submissions')
      .insert({
        committee_id: committee.id,
        submitted_by: profile.id,
        document_type_id: selectedType.id,
        title: formData.title || selectedType.name,
        status: 'submitted',
      })
      .select()
      .single()

    if (!error && sub) {
      await supabase.from('submission_versions').insert({
        submission_id: sub.id,
        version_number: 1,
        content: formData,
        created_by: profile.id,
      })
      setShowForm(false)
      setSelectedType(null)
      setFormData({})
      fetchSubmissions()
    }
    setSubmitting(false)
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!replyText.trim() || !selected) return

    await supabase.from('submission_replies').insert({
      submission_id: selected.id,
      replied_by: profile.id,
      content: replyText,
    })
    setReplyText('')
    fetchReplies(selected.id)
  }

  async function updateStatus(submissionId, status) {
    await supabase.from('submissions').update({ status }).eq('id', submissionId)
    fetchSubmissions()
    if (selected?.id === submissionId) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff ? 'Review and manage all committee submissions.' : 'Submit and track your documents.'}
          </p>
        </div>
        {!isStaff && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
          >
            + New Submission
          </button>
        )}
      </div>

      {/* New submission form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">New Submission</h2>
            <button onClick={() => { setShowForm(false); setSelectedType(null); setFormData({}) }}
              className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>

          {!selectedType ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">Select a document type:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {docTypes.map(dt => (
                  <button
                    key={dt.id}
                    onClick={() => setSelectedType(dt)}
                    className="border border-gray-200 rounded-lg p-3 text-left hover:border-[#1e3a6e] hover:bg-[#e8eef7] transition-all"
                  >
                    <p className="text-sm font-semibold text-gray-900">{dt.name}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">{selectedType.name}</span>
                <button type="button" onClick={() => setSelectedType(null)} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                  placeholder={selectedType.name}
                />
              </div>

              {selectedType.fields?.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      value={formData[field.key] ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={formData[field.key] ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors bg-white"
                    >
                      <option value="">Select...</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required={field.required}
                      value={formData[field.key] ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Document'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Filter */}
      {isStaff && (
        <div className="flex gap-2 flex-wrap">
          {['all', 'submitted', 'in_review', 'passed', 'failed', 'tabled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}
            >
              {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      )}

      {/* Submissions list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />)
        ) : filtered.length > 0 ? filtered.map(sub => (
          <button
            key={sub.id}
            onClick={() => selectSubmission(sub)}
            className={`bg-white border rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-all
              ${selected?.id === sub.id ? 'border-[#1e3a6e]' : 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">{sub.title}</p>
              <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${STATUS_COLORS[sub.status]}`}>
                {sub.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-[#b8963e] font-semibold">{sub.document_types?.name}</p>
            {isStaff && (
              <p className="text-xs text-gray-400 mt-1">
                {sub.profiles?.first_name} {sub.profiles?.last_name}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </button>
        )) : (
          <div className="col-span-2 text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">No submissions yet.</p>
          </div>
        )}
      </div>

      {/* Selected submission detail */}
      {selected && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{selected.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Version {selected.current_version}</p>
            </div>
            <div className="flex items-center gap-3">
              {isStaff && (
                <select
                  value={selected.status}
                  onChange={e => updateStatus(selected.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#1e3a6e]"
                >
                  {['submitted', 'in_review', 'passed', 'failed', 'tabled'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
              <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
            </div>
          </div>

          {/* Versions */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Version History</p>
            <div className="flex flex-col gap-3">
              {versions.map(v => (
                <div key={v.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Version {v.version_number}</p>
                  {Object.entries(v.content).map(([key, val]) => (
                    key !== 'title' && (
                      <div key={key} className="mb-2">
                        <p className="text-xs font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{val}</p>
                      </div>
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Replies */}
          <div className="px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Replies</p>
            <div className="flex flex-col gap-3 mb-4">
              {replies.length > 0 ? replies.map(reply => (
                <div key={reply.id} className="bg-[#e8eef7] rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-[#1e3a6e] mb-1">
                    {reply.profiles?.first_name} {reply.profiles?.last_name}
                  </p>
                  <p className="text-sm text-gray-700">{reply.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(reply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-gray-400">No replies yet.</p>
              )}
            </div>
            {isStaff && (
              <form onSubmit={handleReply} className="flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
                >
                  Reply
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}