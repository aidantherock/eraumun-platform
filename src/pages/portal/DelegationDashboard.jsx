import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function DelegationDashboard() {
  const { eventId } = useParams()
  const { profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [myDelegate, setMyDelegate] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [committees, setCommittees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', committeeId: '', assignment: '' })
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (eventId && profile?.id) fetchAll()
  }, [eventId, profile?.id])

  async function fetchAll() {
    await Promise.all([fetchEvent(), fetchMyDelegate(), fetchCommittees()])
    setLoading(false)
  }

  async function fetchEvent() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    setEvent(data)
  }

  async function fetchMyDelegate() {
    const { data } = await supabase
      .from('guest_delegates')
      .select('*')
      .eq('event_id', eventId)
      .eq('profile_id', profile.id)
      .single()
    setMyDelegate(data)

    if (data?.is_head_delegate && data?.delegation_name) {
      fetchTeamMembers(data.delegation_name)
    }
  }

  async function fetchTeamMembers(delegationName) {
    const { data } = await supabase
      .from('guest_delegates')
      .select('*, committees(name)')
      .eq('event_id', eventId)
      .eq('delegation_name', delegationName)
      .order('created_at')
    setTeamMembers(data ?? [])
  }

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committees')
      .select('id, name, type')
      .eq('event_id', eventId)
      .order('name')
    setCommittees(data ?? [])
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')

    try {
      const { error } = await supabase.from('delegation_invites').insert({
        event_id: eventId,
        delegation_name: myDelegate.delegation_name,
        invited_by: profile.id,
        email: inviteForm.email,
        committee_id: inviteForm.committeeId || null,
        assignment: inviteForm.assignment || null,
      })

      if (error) throw error

      // Send invite email
      await fetch('/.netlify/functions/send-notification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'delegation_invite',
          data: {
            email: inviteForm.email,
            delegationName: myDelegate.delegation_name,
            headDelegateName: `${profile.first_name} ${profile.last_name}`,
            eventName: event.name,
            school: myDelegate.school,
          }
        })
      })

      setInviteSuccess(`Invitation sent to ${inviteForm.email}`)
      setInviteForm({ email: '', committeeId: '', assignment: '' })
      setShowInviteForm(false)
      setTimeout(() => setInviteSuccess(''), 5000)
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (!myDelegate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">You are not registered as a delegate for this event.</p>
          <Link to="/portal/events" className="text-sm text-[#1e3a6e] font-medium hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  if (!myDelegate.is_head_delegate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">This dashboard is only available to Head Delegates.</p>
          <Link to={`/portal/events/${eventId}`} className="text-sm text-[#1e3a6e] font-medium hover:underline">
            Back to Event
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to={`/portal/events/${eventId}`}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium mb-2 inline-block">
            &#8592; Back to Event
          </Link>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            {myDelegate.delegation_name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Head Delegate Dashboard — {event?.name}
          </p>
        </div>
        <button onClick={() => setShowInviteForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
          + Invite Team Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', value: teamMembers.length },
          { label: 'Assigned', value: teamMembers.filter(m => m.committee_id).length },
          { label: 'Unassigned', value: teamMembers.filter(m => !m.committee_id).length },
          { label: 'School', value: myDelegate.school ?? '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold font-serif text-[#1e3a6e] truncate">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {inviteSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{inviteSuccess}</div>
      )}

      {/* Invite modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Invite Team Member</h2>
              <button onClick={() => setShowInviteForm(false)} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              {inviteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{inviteError}</div>
              )}
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" required value={inviteForm.email}
                    onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    placeholder="teammate@school.edu" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Committee (optional)</label>
                  <select value={inviteForm.committeeId}
                    onChange={e => setInviteForm(prev => ({ ...prev, committeeId: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                    <option value="">No committee yet</option>
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {inviteForm.committeeId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
                    <input type="text" value={inviteForm.assignment}
                      onChange={e => setInviteForm(prev => ({ ...prev, assignment: e.target.value }))}
                      placeholder="e.g. United States"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                )}
                <div className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-lg p-3">
                  <p className="text-xs text-[#1e3a6e]">
                    An invitation will be sent to their email. They'll join your delegation — {myDelegate.delegation_name}.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={inviting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </button>
                  <button type="button" onClick={() => setShowInviteForm(false)}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Team roster */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Delegation Roster</h2>
          <span className="text-xs text-gray-400">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
        </div>
        {teamMembers.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {teamMembers.map(member => (
              <div key={member.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0">
                  {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.is_head_delegate && (
                      <span className="text-xs font-bold text-[#b8963e] bg-[#fdf6e3] px-2 py-0.5 rounded-full">
                        Head Delegate
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-gray-400">{member.login_email}</p>
                    {member.committees?.name && (
                      <span className="text-xs font-semibold text-[#b8963e]">{member.committees.name}</span>
                    )}
                    {member.assignment && (
                      <span className="text-xs text-gray-500">— {member.assignment}</span>
                    )}
                    {!member.committee_id && (
                      <span className="text-xs text-gray-400 italic">Awaiting assignment</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No team members yet. Invite your delegation using the button above.
          </div>
        )}
      </div>

      {/* My assignment */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">My Assignment</h2>
        {myDelegate.committee_id ? (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1e3a6e] flex items-center justify-center text-white font-bold flex-shrink-0">
              {committees.find(c => c.id === myDelegate.committee_id)?.name?.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {committees.find(c => c.id === myDelegate.committee_id)?.name ?? 'Unknown Committee'}
              </p>
              {myDelegate.assignment && (
                <p className="text-xs text-[#b8963e] font-medium mt-0.5">{myDelegate.assignment}</p>
              )}
            </div>
            <Link to={`/portal/committee/${myDelegate.committee_id}`}
              className="ml-auto text-xs font-semibold text-[#1e3a6e] border border-[#1e3a6e] px-3 py-1.5 rounded hover:bg-[#e8eef7] transition-colors">
              Enter Committee
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-400">You have not been assigned to a committee yet. Contact event staff for details.</p>
        )}
      </div>
    </div>
  )
}