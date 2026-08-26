import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function UpdatePassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
    if (!/[^a-zA-Z0-9]/.test(password)) return 'Password must contain at least one special character.'
    if (password !== confirmPassword) return 'Passwords do not match.'
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
    const { error } = await updatePassword(password)

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    navigate('/portal')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-900 transition-colors"
                placeholder="Min. 8 characters, 1 number, 1 special character"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-900 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white font-semibold text-sm py-2.5 rounded hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}