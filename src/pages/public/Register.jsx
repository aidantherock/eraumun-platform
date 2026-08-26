import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    ageConfirmed: false,
    tosAccepted: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function validate() {
    if (!form.firstName.trim()) return 'First name is required.'
    if (!form.lastName.trim()) return 'Last name is required.'
    if (!form.email.trim()) return 'Email is required.'
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

    setLoading(true)

    const { data, error } = await signUp(
      form.email,
      form.password,
      form.firstName,
      form.lastName
    )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      // Update school
      await supabase
        .from('profiles')
        .update({ school: form.school })
        .eq('id', data.user.id)

      // Send welcome email
      await fetch('/.netlify/functions/send-notification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'welcome',
          data: {
            email: form.email,
            firstName: form.firstName,
          }
        })
      }).catch(err => console.error('Welcome email failed:', err))
    }

    navigate('/pending')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registration requires admin approval before access is granted.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                placeholder="you@example.com" />
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

            <button type="submit" disabled={loading}
              className="w-full bg-[#1e3a6e] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1e3a6e] font-medium hover:underline">Sign in</Link>
        </p>

        <p className="text-center mt-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
            Back to eraumun.com
          </Link>
        </p>
      </div>
    </div>
  )
}