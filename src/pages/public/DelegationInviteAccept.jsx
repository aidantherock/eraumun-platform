import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function DelegationInviteAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (token) fetchInvite()
  }, [token])

  async function fetchInvite() {
    const { data: inv } = await supabase
      .from('delegation_invites')
      .select('*, events(id, name, start_date, location), committees(name)')
      .eq('token', token)
      .single()

    if (!inv) {
      setError('This invitation link is invalid or has expired.')
      setLoading(false)
      return
    }

    if (inv.accepted_at) {
      setError('This invitation has already been accepted.')
      setLoading(false)
      return
    }

    if (new Date(inv.expires_at) < new Date()) {
      setError('This invitation has expired. Please contact your Head Delegate for a new link.')
      setLoading(false)
      return
    }

    setInvite(inv)
    setEvent(inv.events)
    setLoading(false)
  }

  async function handleAccept() {
    setAccepting(true)
    setError('')

    try {
      // Mark invite as accepted
      const { error: acceptError } = await supabase
        .from('delegation_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token)

      if (acceptError) throw acceptError

      // Create guest delegate account
      const res = await fetch('/.netlify/functions/create-guest-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invite.email,
          eventId: invite.event_id,
          committeeId: invite.committee_id || null,
          assignment: invite.assignment || null,
          delegateType: 'member',
          delegationName: invite.delegation_name,
          fromInviteToken: token,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create account')

      setAccepted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-serif text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-serif text-xl font-bold text-gray-900 mb-2">You're in!</h1>
          <p className="text-sm text-gray-500 mb-1">
            Your account has been created and login credentials have been sent to:
          </p>
          <p className="text-sm font-semibold text-[#1e3a6e] mb-6">{invite.email}</p>
          <p className="text-xs text-gray-400 mb-6">
            Check your inbox for your login details. You'll use these to access the conference portal.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1e3a6e] to-[#0f2040] px-8 py-8 text-center">
          <img src="/logo-seal-transparent.png" alt="ERAU-MUN" className="h-14 w-auto mx-auto mb-4 opacity-90" />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-1">Delegation Invitation</p>
          <h1 className="font-serif text-2xl font-bold text-white">{event?.name}</h1>
          {event?.location && <p className="text-white/50 text-sm mt-1">{event.location}</p>}
          {event?.start_date && (
            <p className="text-white/50 text-xs mt-1">
              {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-xl p-5 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1e3a6e] mb-3">Your Invitation Details</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">Delegation</p>
                <p className="text-xs font-semibold text-gray-900">{invite.delegation_name}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-xs font-semibold text-gray-900">{invite.email}</p>
              </div>
              {invite.committees?.name && (
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500">Committee</p>
                  <p className="text-xs font-semibold text-gray-900">{invite.committees.name}</p>
                </div>
              )}
              {invite.assignment && (
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500">Assignment</p>
                  <p className="text-xs font-semibold text-[#b8963e]">{invite.assignment}</p>
                </div>
              )}
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">Expires</p>
                <p className="text-xs text-gray-500">
                  {new Date(invite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            You've been invited to join the <strong>{invite.delegation_name}</strong> delegation for <strong>{event?.name}</strong>. 
            Accepting this invitation will create a conference account and send your login credentials to <strong>{invite.email}</strong>.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-[#1e3a6e] text-white font-semibold py-3 rounded-lg hover:bg-[#2d538f] transition-colors disabled:opacity-50 mb-3"
          >
            {accepting ? 'Setting up your account...' : 'Accept Invitation'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            By accepting, you agree to ERAU-MUN's{' '}
            <a href="/terms" className="text-[#1e3a6e] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#1e3a6e] hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}