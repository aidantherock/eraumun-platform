import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationCenter from '../components/NotificationCenter'

const NAV = [
  { label: 'Dashboard', to: '/portal', icon: '⊞', end: true },
  { label: 'Events', to: '/portal/events', icon: '📅' },
  { label: 'Contact', to: '/portal/contact', icon: '✉' },
  { label: 'Profile', to: '/portal/profile', icon: '👤' },
  { label: 'Directory', to: '/portal/directory', icon: '👥' },
]

export default function PortalLayout() {
  const { profile, isEboard, signOut } = useAuth()
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
      <aside className={`w-64 bg-[#1e3a6e] min-h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/logo-horizontal.png" alt="ERAU-MUN" className="w-full h-auto brightness-0 invert" style={{ background: 'transparent', mixBlendMode: 'screen' }} />
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#b8963e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {profile?.first_name?.charAt(0) ?? '?'}{profile?.last_name?.charAt(0) ?? ''}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-white/50 truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Admin button */}
          {isEboard && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-[#b8963e] text-white'
                    : 'text-[#d4af62] hover:bg-[#b8963e]/20 hover:text-[#d4af62]'
                  }`
                }
              >
                <span className="text-base">⚙</span>
                Admin Panel
              </NavLink>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
          <NavLink
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="text-base">&#8592;</span>
            Public Site
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
          >
            <span className="text-base">&#x2192;</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">Member Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 md:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}