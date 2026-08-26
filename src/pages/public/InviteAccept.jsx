import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function InviteAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('loading')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    school: '',
    password: '',
    confirmPassword: '',
    ageConfirmed: false,
    tosAccepted: false,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    validateToken()
  }, [token])

  async function validateToken() {
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('*, roles(name)')
      .eq('token', token)
      .is('accepted_at', null)
      .is('cancelled_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      setStatus('invalid')
      return
    }

    setInvite(data)
    setStatus('valid')
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function validate() {
    if (!form.firstName.trim()) return 'First name is required.'
    if (!form.lastName.trim()) return 'Last name is required.'
    if (!form.school.trim()) return 'School is required.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number.'
    if (!/[^a-zA-Z0-9]/.test(form.password)) return 'Password must contain at least one special character.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!form.ageConfirmed) return 'You must confirm you are 13 or older.'
    if (!form.tosAccepted) return 'You must accept the Terms of Service.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)

    const { data, error } = await signUp(
      invite.email,
      form.password,
      form.firstName,
      form.lastName
    )

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    if (data?.user) {
      // Update profile
      await supabase.from('profiles').update({
        school: form.school,
        status: 'approved', // Auto-approve invited users
      }).eq('id', data.user.id)

      // Assign role if invite has one
      if (invite.role_id) {
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role_id: invite.role_id,
          assigned_by: invite.invited_by,
        })
      }

      // Mark invite as accepted
      await supabase.from('invite_tokens')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token)
    }

    setStatus('accepted')
    setSubmitting(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-8" />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid or Expired Invite</h1>
            <p className="text-sm text-gray-500 mb-6">
              This invite link is invalid, has already been used, or has expired. Please contact your administrator for a new invite.
            </p>
            <Link to="/" className="text-sm text-[#1e3a6e] font-medium hover:underline">
              Back to eraumun.com
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-8" />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your account has been created and approved. You can now sign in to the portal.
            </p>
            <Link
              to="/login"
              className="inline-block bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Accept Your Invitation</h1>
          <p className="text-sm text-gray-500 mt-1">
            You've been invited to join ERAU-MUN{invite?.roles?.name ? ` as ${invite.roles.name}` : ''}.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="bg-[#e8eef7] rounded-lg px-4 py-3 mb-6">
            <p className="text-sm text-[#1e3a6e]">
              Registering as <strong>{invite?.email}</strong>
              {invite?.roles?.name && <> with role <strong>{invite.roles.name}</strong></>}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input type="text" name="firstName" required value={form.firstName} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input type="text" name="lastName" required value={form.lastName} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School / Institution</label>
              <input type="text" name="school" required value={form.school} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                placeholder="Embry-Riddle Aeronautical University" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" required value={form.password} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                placeholder="Min. 8 characters, 1 number, 1 special character" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input type="password" name="confirmPassword" required value={form.confirmPassword} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                placeholder="••••••••" />
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" name="ageConfirmed" checked={form.ageConfirmed} onChange={handleChange}
                  className="mt-0.5 accent-[#1e3a6e]" />
                <span className="text-sm text-gray-600">I confirm that I am 13 years of age or older.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" name="tosAccepted" checked={form.tosAccepted} onChange={handleChange}
                  className="mt-0.5 accent-[#1e3a6e]" />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#1e3a6e] font-medium hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-[#1e3a6e] font-medium hover:underline">Privacy Policy</Link>.
                </span>
              </label>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-[#1e3a6e] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}