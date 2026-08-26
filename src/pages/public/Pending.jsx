import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Pending() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-12 mx-auto mb-8" />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Your account is pending approval
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Thanks for registering{profile?.first_name ? `, ${profile.first_name}` : ''}. An administrator will review your account and grant access shortly. You'll receive an email once you've been approved.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <p className="text-sm text-blue-800">
              If you believe this is taking longer than expected, please contact us at{' '}
              <a href="mailto:info@eraumun.com" className="font-medium underline">
                info@eraumun.com
              </a>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}