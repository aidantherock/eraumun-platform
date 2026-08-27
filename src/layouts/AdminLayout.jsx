import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { label: 'Dashboard', to: '/admin', end: true },
  { label: 'Users', to: '/admin/users' },
  { label: 'Announcements', to: '/admin/announcements' },
  { label: 'News', to: '/admin/news' },
  { label: 'Sponsorships', to: '/admin/sponsors' },
  { label: 'Manage Events', to: '/admin/events' },
  { label: 'Manage Awards', to: '/admin/awards' },
  { label: 'Manage Photos', to: '/admin/gallery' },
  { label: 'Form Inbox', to: '/admin/forms' },
  { label: 'Send an Email', to: '/admin/emails' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-[#0f2040] min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/logo-horizontal.png" alt="ERAU-MUN" className="w-full h-auto brightness-0 invert" style={{ background: 'transparent', mixBlendMode: 'screen' }} />
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mt-2">Admin Panel</p>
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-sm font-semibold text-white">{profile?.first_name} {profile?.last_name}</p>
          <p className="text-xs text-white/40">{profile?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
          <NavLink
            to="/portal"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            Portal
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">Global Admin Panel</p>
        </header>
        <main className="flex-1 px-6 md:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}