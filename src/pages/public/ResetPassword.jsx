import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await resetPassword(email)

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {submitted ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
            </div>
          ) : (
            <>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-900 text-white font-semibold text-sm py-2.5 rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to="/login" className="text-sm text-blue-900 font-medium hover:underline">
            ← Back to sign in
          </Link>
        </p>

      </div>
    </div>
  )
}