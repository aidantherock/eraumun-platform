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

export default function CommitteeResolutions() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [resolutions, setResolutions] = useState([])
  const [selected, setSelected] = useState(null)
  const [comments, setComments] = useState([])
  const [amendments, setAmendments] = useState([])
  const [cosponsors, setCosponsors] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [commentText, setCommentText] = useState('')
  const [isPrivateComment, setIsPrivateComment] = useState(false)
  const [amendmentForm, setAmendmentForm] = useState({ clause_reference: '', original_text: '', proposed_text: '' })
  const [showAmendment, setShowAmendment] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (committee?.id) fetchResolutions()
  }, [committee?.id])

  async function fetchResolutions() {
    const { data } = await supabase
      .from('resolutions')
      .select('*, profiles(first_name, last_name)')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false })
    setResolutions(data ?? [])
    setLoading(false)
  }

  async function fetchResolutionDetails(id) {
    const [{ data: comm }, { data: amend }, { data: cospon }] = await Promise.all([
      supabase.from('resolution_comments').select('*, profiles(first_name, last_name)')
        .eq('resolution_id', id).order('created_at'),
      supabase.from('amendments').select('*, profiles(first_name, last_name)')
        .eq('resolution_id', id).order('created_at'),
      supabase.from('resolution_cosponsors').select('*, profiles(first_name, last_name)')
        .eq('resolution_id', id),
    ])
    setComments(comm ?? [])
    setAmendments(amend ?? [])
    setCosponsors(cospon ?? [])
  }

  async function selectResolution(res) {
    setSelected(res)
    await fetchResolutionDetails(res.id)
  }

  async function createResolution(e) {
    e.preventDefault()
    const { data, error } = await supabase.from('resolutions').insert({
      committee_id: committee.id,
      author_id: profile.id,
      title: newTitle,
      status: 'draft',
      is_public: false,
    }).select().single()

    if (!error) {
      setShowCreate(false)
      setNewTitle('')
      fetchResolutions()
    }
  }

  async function togglePublic(resolutionId, current) {
    await supabase.from('resolutions').update({ is_public: !current }).eq('id', resolutionId)
    fetchResolutions()
    if (selected?.id === resolutionId) setSelected(prev => ({ ...prev, is_public: !current }))
  }

  async function updateStatus(resolutionId, status) {
    await supabase.from('resolutions').update({ status }).eq('id', resolutionId)
    fetchResolutions()
    if (selected?.id === resolutionId) setSelected(prev => ({ ...prev, status }))
  }

  async function requestCosponsor(resolutionId) {
    await supabase.from('resolution_cosponsors').insert({
      resolution_id: resolutionId,
      user_id: profile.id,
      status: 'pending',
    })
    fetchResolutionDetails(resolutionId)
  }

  async function respondCosponsor(id, status) {
    await supabase.from('resolution_cosponsors').update({ status, responded_at: new Date().toISOString() }).eq('id', id)
    fetchResolutionDetails(selected.id)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    await supabase.from('resolution_comments').insert({
      resolution_id: selected.id,
      user_id: profile.id,
      content: commentText,
      is_private: isPrivateComment,
    })
    setCommentText('')
    setIsPrivateComment(false)
    fetchResolutionDetails(selected.id)
  }

  async function submitAmendment(e) {
    e.preventDefault()
    await supabase.from('amendments').insert({
      resolution_id: selected.id,
      proposed_by: profile.id,
      ...amendmentForm,
      status: 'pending',
    })
    setAmendmentForm({ clause_reference: '', original_text: '', proposed_text: '' })
    setShowAmendment(false)
    fetchResolutionDetails(selected.id)
  }

  async function respondAmendment(id, status) {
    await supabase.from('amendments').update({ status }).eq('id', id)
    fetchResolutionDetails(selected.id)
  }

  const isAuthor = selected?.author_id === profile.id
  const sharingActive = committee?.sharing_period_active

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Resolutions</h1>
          <p className="text-sm text-gray-500 mt-1">Draft, collaborate on, and track resolutions.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + New Resolution
        </button>
      </div>

      {/* Sharing period banner */}
      {sharingActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-3">
          <p className="text-sm text-blue-800 font-medium">Sharing period is active — public resolutions are visible to all committee members.</p>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">New Resolution</h2>
            <button onClick={() => setShowCreate(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
          <form onSubmit={createResolution} className="flex gap-3">
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Resolution title..."
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
            />
            <button type="submit" className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
              Create
            </button>
          </form>
        </div>
      )}

      {/* Resolution list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2].map(i => <div key={i} className="bg-gray-100 rounded-xl h-28 animate-pulse" />)
        ) : resolutions.length > 0 ? resolutions.map(res => (
          <button
            key={res.id}
            onClick={() => selectResolution(res)}
            className={`bg-white border rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-all
              ${selected?.id === res.id ? 'border-[#1e3a6e]' : 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">{res.title}</p>
              <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${STATUS_COLORS[res.status]}`}>
                {res.status}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              By {res.profiles?.first_name} {res.profiles?.last_name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {res.is_public && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Public</span>
              )}
            </div>
          </button>
        )) : (
          <div className="col-span-2 text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">No resolutions yet. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Resolution detail */}
      {selected && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">{selected.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                By {selected.profiles?.first_name} {selected.profiles?.last_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isStaff && (
                <>
                  <select
                    value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#1e3a6e]"
                  >
                    {['draft', 'submitted', 'in_review', 'passed', 'failed', 'tabled'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => togglePublic(selected.id, selected.is_public)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded border transition-all
                      ${selected.is_public ? 'bg-blue-100 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}
                  >
                    {selected.is_public ? 'Public' : 'Make Public'}
                  </button>
                </>
              )}
              <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
            </div>
          </div>

          {/* Cosponsors */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Co-Sponsors</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {cosponsors.filter(c => c.status === 'approved').map(c => (
                <span key={c.id} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  {c.profiles?.first_name} {c.profiles?.last_name}
                </span>
              ))}
              {cosponsors.filter(c => c.status === 'approved').length === 0 && (
                <p className="text-xs text-gray-400">No co-sponsors yet.</p>
              )}
            </div>

            {/* Pending requests (author sees these) */}
            {isAuthor && cosponsors.filter(c => c.status === 'pending').length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Pending requests:</p>
                {cosponsors.filter(c => c.status === 'pending').map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-700">{c.profiles?.first_name} {c.profiles?.last_name}</p>
                    <div className="flex gap-2">
                      <button onClick={() => respondCosponsor(c.id, 'approved')}
                        className="text-xs text-green-600 font-semibold hover:underline">Approve</button>
                      <button onClick={() => respondCosponsor(c.id, 'denied')}
                        className="text-xs text-red-500 font-semibold hover:underline">Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isAuthor && !cosponsors.find(c => c.user_id === profile.id) && (
              <button
                onClick={() => requestCosponsor(selected.id)}
                className="text-xs text-[#1e3a6e] font-semibold hover:underline"
              >
                Request to co-sponsor
              </button>
            )}
          </div>

          {/* Amendments */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Amendments</p>
              <button
                onClick={() => setShowAmendment(!showAmendment)}
                className="text-xs text-[#1e3a6e] font-semibold hover:underline"
              >
                + Propose Amendment
              </button>
            </div>

            {showAmendment && (
              <form onSubmit={submitAmendment} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Clause Reference</label>
                  <input type="text" required value={amendmentForm.clause_reference}
                    onChange={e => setAmendmentForm(prev => ({ ...prev, clause_reference: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Original Text</label>
                  <textarea rows={2} value={amendmentForm.original_text}
                    onChange={e => setAmendmentForm(prev => ({ ...prev, original_text: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Proposed Text</label>
                  <textarea rows={2} required value={amendmentForm.proposed_text}
                    onChange={e => setAmendmentForm(prev => ({ ...prev, proposed_text: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-[#1e3a6e] text-white font-semibold text-xs px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
                    Submit
                  </button>
                  <button type="button" onClick={() => setShowAmendment(false)} className="text-xs text-gray-400 hover:text-gray-600">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {amendments.length > 0 ? amendments.map(amend => (
                <div key={amend.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Clause: {amend.clause_reference}</p>
                      <p className="text-xs text-gray-400 mt-0.5">By {amend.profiles?.first_name} {amend.profiles?.last_name}</p>
                    </div>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full
                      ${amend.status === 'approved' ? 'bg-green-100 text-green-700' :
                        amend.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {amend.status}
                    </span>
                  </div>
                  {amend.original_text && (
                    <p className="text-xs text-gray-500 line-through mb-1">{amend.original_text}</p>
                  )}
                  <p className="text-xs text-gray-700">{amend.proposed_text}</p>
                  {isStaff && amend.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => respondAmendment(amend.id, 'approved')}
                        className="text-xs text-green-600 font-semibold hover:underline">Approve</button>
                      <button onClick={() => respondAmendment(amend.id, 'rejected')}
                        className="text-xs text-red-500 font-semibold hover:underline">Reject</button>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-xs text-gray-400">No amendments proposed yet.</p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Comments</p>
            <div className="flex flex-col gap-3 mb-4">
              {comments.length > 0 ? comments.map(comment => (
                <div key={comment.id} className={`rounded-lg px-4 py-3 ${comment.is_private ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-700">
                      {comment.profiles?.first_name} {comment.profiles?.last_name}
                    </p>
                    {comment.is_private && (
                      <span className="text-xs text-yellow-600 font-medium">Private</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              )) : (
                <p className="text-sm text-gray-400">No comments yet.</p>
              )}
            </div>

            {(sharingActive || isAuthor) && (
              <form onSubmit={submitComment} className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivateComment}
                      onChange={e => setIsPrivateComment(e.target.checked)}
                      className="accent-[#1e3a6e]"
                    />
                    <span className="text-xs text-gray-600">Private message to author</span>
                  </label>
                  <button
                    type="submit"
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
                  >
                    Comment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}