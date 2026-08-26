import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { signIn, isApproved } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/portal'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mt-1">ERAU-MUN Member Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-900 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-900 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <span />
              <Link
                to="/reset-password"
                className="text-sm text-blue-900 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white font-semibold text-sm py-2.5 rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-900 font-medium hover:underline">
            Register
          </Link>
        </p>

        <p className="text-center mt-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back to eraumun.com
          </Link>
        </p>

      </div>
    </div>
  )
}