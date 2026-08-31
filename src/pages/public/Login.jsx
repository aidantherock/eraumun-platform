import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { signIn, user, isApproved, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (isApproved) navigate('/portal', { replace: true })
      else navigate('/pending', { replace: true })
    }
  }, [user, isApproved, loading])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Invalid email or password. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img src="/logo-horizontal.png" alt="ERAU-MUN" className="h-24 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mt-1">ERAU-MUN Member Portal</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <span />
              <Link to="/reset-password" className="text-sm text-[#1e3a6e] font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1e3a6e] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Sign up callout */}
        <div className="mt-5 bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-[#1e3a6e] mb-1">New to ERAU-MUN?</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Create an account to access the member portal, sign up for events, and join our community.
          </p>
          <Link
            to="/register"
            className="inline-block bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors"
          >
            Create Account
          </Link>
        </div>

        <p className="text-center mt-5">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
            Back to eraumun.com
          </Link>
        </p>
      </div>
    </div>
  )
}