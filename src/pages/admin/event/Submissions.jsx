import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  tabled: 'bg-purple-100 text-purple-700',
}

export default function EventAdminSubmissions() {
  const { event } = useOutletContext()
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [versions, setVersions] = useState([])
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [committeeFilter, setCommitteeFilter] = useState('all')
  const [committees, setCommittees] = useState([])

  useEffect(() => {
    if (event?.id) {
      fetchSubmissions()
      fetchCommittees()
    }
  }, [event?.id])

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committees')
      .select('id, name')
      .eq('event_id', event.id)
    setCommittees(data ?? [])
  }

  async function fetchSubmissions() {
    const { data } = await supabase
      .from('submissions')
      .select('*, document_types(name), profiles(first_name, last_name), committees!inner(event_id, name)')
      .eq('committees.event_id', event.id)
      .order('created_at', { ascending: false })
    setSubmissions(data ?? [])
    setLoading(false)
  }

  async function selectSubmission(sub) {
    setSelected(sub)
    const [{ data: v }, { data: r }] = await Promise.all([
      supabase.from('submission_versions').select('*').eq('submission_id', sub.id).order('version_number', { ascending: false }),
      supabase.from('submission_replies').select('*, profiles(first_name, last_name)').eq('submission_id', sub.id).order('created_at'),
    ])
    setVersions(v ?? [])
    setReplies(r ?? [])
  }

  const filtered = submissions.filter(s => {
    const matchesStatus = filter === 'all' || s.status === filter
    const matchesCommittee = committeeFilter === 'all' || s.committees?.name === committeeFilter
    return matchesStatus && matchesCommittee
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">All Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">View all submissions across committees for this event.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={committeeFilter}
          onChange={e => setCommitteeFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
        >
          <option value="all">All Committees</option>
          {committees.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <div className="flex gap-2 flex-wrap">
          {['all', 'submitted', 'in_review', 'passed', 'failed', 'tabled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : filtered.length > 0 ? filtered.map(sub => (
              <button
                key={sub.id}
                onClick={() => selectSubmission(sub)}
                className={`w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors
                  ${selected?.id === sub.id ? 'bg-[#e8eef7]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{sub.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sub.profiles?.first_name} {sub.profiles?.last_name} — {sub.committees?.name}
                    </p>
                    <p className="text-xs text-[#b8963e] mt-0.5">{sub.document_types?.name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[sub.status]}`}>
                    {sub.status.replace('_', ' ')}
                  </span>
                </div>
              </button>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No submissions found.</div>
            )}
          </div>
        </div>

        {/* Detail */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">&#x2715;</button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                By {selected.profiles?.first_name} {selected.profiles?.last_name} — {selected.committees?.name}
              </p>
              <p className="text-xs text-[#b8963e] font-semibold">{selected.document_types?.name}</p>
            </div>

            {/* Versions */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Versions</p>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {versions.map(v => (
                  <div key={v.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Version {v.version_number}</p>
                    {Object.entries(v.content).map(([key, val]) => (
                      key !== 'title' && val && (
                        <div key={key} className="mb-1.5">
                          <p className="text-xs font-medium text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{val}</p>
                        </div>
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Replies */}
            {replies.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Replies</p>
                <div className="space-y-2">
                  {replies.map(r => (
                    <div key={r.id} className="bg-[#e8eef7] rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-[#1e3a6e]">{r.profiles?.first_name} {r.profiles?.last_name}</p>
                      <p className="text-xs text-gray-700 mt-0.5">{r.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}