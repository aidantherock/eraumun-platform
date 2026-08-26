import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const RESULT_COLORS = {
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  tabled: 'bg-purple-100 text-purple-700',
}

export default function CommitteeVoting() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [votes, setVotes] = useState([])
  const [activeVote, setActiveVote] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newVote, setNewVote] = useState({ type: 'live_tally', log_individual: false, submission_id: '', duration_seconds: 300 })
  const [tallyForm, setTallyForm] = useState({ for: '', against: '', abstain: '' })
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (committee?.id) {
      fetchVotes()
      if (isStaff) fetchSubmissions()
    }
  }, [committee?.id])

  async function fetchVotes() {
    const { data } = await supabase
      .from('votes')
      .select('*, submissions(title)')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false })
    setVotes(data ?? [])

    const active = data?.find(v => v.status === 'active')
    if (active) {
      setActiveVote(active)
      fetchUserVote(active.id)
    }
    setLoading(false)
  }

  async function fetchSubmissions() {
    const { data } = await supabase
      .from('submissions')
      .select('id, title')
      .eq('committee_id', committee.id)
      .eq('status', 'in_review')
    setSubmissions(data ?? [])
  }

  async function fetchUserVote(voteId) {
    const { data } = await supabase
      .from('vote_records')
      .select('vote')
      .eq('vote_id', voteId)
      .eq('user_id', profile.id)
      .maybeSingle()
    setUserVote(data?.vote ?? null)
  }

  async function createVote(e) {
    e.preventDefault()
    const closesAt = newVote.type === 'digital'
      ? new Date(Date.now() + newVote.duration_seconds * 1000).toISOString()
      : null

    const { error } = await supabase.from('votes').insert({
      committee_id: committee.id,
      submission_id: newVote.submission_id || null,
      type: newVote.type,
      log_individual: newVote.log_individual,
      status: 'active',
      duration_seconds: newVote.type === 'digital' ? newVote.duration_seconds : null,
      closes_at: closesAt,
      created_by: profile.id,
    })

    if (!error) {
      setShowCreate(false)
      fetchVotes()
    }
  }

  async function submitDigitalVote(vote) {
    await supabase.from('vote_records').insert({
      vote_id: activeVote.id,
      user_id: profile.id,
      vote,
    })
    setUserVote(vote)
  }

  async function submitTally(e) {
    e.preventDefault()
    await supabase.from('votes').update({
      status: 'closed',
      votes_for: parseInt(tallyForm.for) || 0,
      votes_against: parseInt(tallyForm.against) || 0,
      votes_abstain: parseInt(tallyForm.abstain) || 0,
      result: parseInt(tallyForm.for) > parseInt(tallyForm.against) ? 'passed' : 'failed',
      closed_at: new Date().toISOString(),
    }).eq('id', activeVote.id)
    setActiveVote(null)
    setTallyForm({ for: '', against: '', abstain: '' })
    fetchVotes()
  }

  async function closeVote(voteId) {
    await supabase.from('votes').update({
      status: 'closed',
      closed_at: new Date().toISOString(),
    }).eq('id', voteId)
    setActiveVote(null)
    fetchVotes()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Voting</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff ? 'Create and manage votes for this committee.' : 'Participate in committee votes.'}
          </p>
        </div>
        {isStaff && !activeVote && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
          >
            + New Vote
          </button>
        )}
      </div>

      {/* Create vote form */}
      {showCreate && isStaff && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Create Vote</h2>
            <button onClick={() => setShowCreate(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
          <form onSubmit={createVote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vote Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'live_tally', label: 'Live Tally', desc: 'Chair manually enters vote counts.' },
                  { id: 'digital', label: 'Digital Vote', desc: 'Delegates vote in-app within a time window.' },
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setNewVote(prev => ({ ...prev, type: type.id }))}
                    className={`p-3 rounded-lg border text-left transition-all
                      ${newVote.type === type.id ? 'border-[#1e3a6e] bg-[#e8eef7]' : 'border-gray-200 hover:border-[#1e3a6e]'}`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {submissions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document (optional)</label>
                <select
                  value={newVote.submission_id}
                  onChange={e => setNewVote(prev => ({ ...prev, submission_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
                >
                  <option value="">No specific document</option>
                  {submissions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            )}

            {newVote.type === 'digital' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voting Window (seconds)</label>
                <input
                  type="number"
                  value={newVote.duration_seconds}
                  onChange={e => setNewVote(prev => ({ ...prev, duration_seconds: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e]"
                  min={30}
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newVote.log_individual}
                onChange={e => setNewVote(prev => ({ ...prev, log_individual: e.target.checked }))}
                className="accent-[#1e3a6e]"
              />
              <span className="text-sm text-gray-600">Log individual votes (who voted what)</span>
            </label>

            <button type="submit" className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors">
              Start Vote
            </button>
          </form>
        </div>
      )}

      {/* Active vote */}
      {activeVote && (
        <div className="bg-white border-2 border-[#1e3a6e] rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-green-600 bg-green-100 px-2 py-0.5 rounded">Active Vote</span>
              <h2 className="font-serif text-xl font-bold text-gray-900 mt-2">
                {activeVote.submissions?.title ?? 'Committee Vote'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Type: {activeVote.type === 'live_tally' ? 'Live Tally' : 'Digital Vote'}
              </p>
              {activeVote.closes_at && (
                <p className="text-xs text-gray-500">
                  Closes: {new Date(activeVote.closes_at).toLocaleTimeString()}
                </p>
              )}
            </div>
            {isStaff && (
              <button
                onClick={() => closeVote(activeVote.id)}
                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
              >
                Close Vote
              </button>
            )}
          </div>

          {/* Live tally form for staff */}
          {isStaff && activeVote.type === 'live_tally' && (
            <form onSubmit={submitTally} className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Enter vote counts:</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'for', label: 'In Favor', color: 'border-green-300 focus:border-green-500' },
                  { key: 'against', label: 'Against', color: 'border-red-300 focus:border-red-500' },
                  { key: 'abstain', label: 'Abstain', color: 'border-gray-300 focus:border-gray-500' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input
                      type="number"
                      min={0}
                      value={tallyForm[f.key]}
                      onChange={e => setTallyForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className={`w-full border rounded px-3 py-2 text-sm focus:outline-none transition-colors ${f.color}`}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors">
                Submit Tally & Close Vote
              </button>
            </form>
          )}

          {/* Digital vote for delegates */}
          {!isStaff && activeVote.type === 'digital' && (
            <div>
              {userVote ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold text-gray-900">Your vote: <span className="text-[#1e3a6e] capitalize">{userVote}</span></p>
                  <p className="text-xs text-gray-400 mt-1">Vote recorded successfully.</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  {[
                    { value: 'for', label: 'In Favor', color: 'bg-green-600 hover:bg-green-700' },
                    { value: 'against', label: 'Against', color: 'bg-red-600 hover:bg-red-700' },
                    { value: 'abstain', label: 'Abstain', color: 'bg-gray-400 hover:bg-gray-500' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => submitDigitalVote(option.value)}
                      className={`flex-1 text-white font-semibold text-sm py-3 rounded transition-colors ${option.color}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Past votes */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Vote History</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : votes.filter(v => v.status === 'closed').length > 0 ? (
            votes.filter(v => v.status === 'closed').map(vote => (
              <div key={vote.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {vote.submissions?.title ?? 'Committee Vote'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {vote.type === 'live_tally' ? 'Live Tally' : 'Digital'} &mdash;{' '}
                    For: {vote.votes_for} / Against: {vote.votes_against} / Abstain: {vote.votes_abstain}
                  </p>
                </div>
                {vote.result && (
                  <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full ${RESULT_COLORS[vote.result]}`}>
                    {vote.result}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">No completed votes yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}