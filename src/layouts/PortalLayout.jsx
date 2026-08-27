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

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-[#1e3a6e] min-h-screen flex flex-col fixed left-0 top-0 z-40">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/logo-horizontal.png" alt="ERAU-MUN" className="h-9 w-auto brightness-0 invert" />
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
      <div className="ml-64 flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">Member Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}