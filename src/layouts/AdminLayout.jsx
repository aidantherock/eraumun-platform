import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { label: 'Dashboard', to: '/admin', end: true },
  { label: 'Users', to: '/admin/users' },
  { label: 'Announcements', to: '/admin/announcements' },
  { label: 'Sponsors', to: '/admin/sponsors' },
  { label: 'Forms', to: '/admin/forms' },
  { label: 'Events', to: '/admin/events' },
  { label: 'Emails', to: '/admin/emails' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-[#0f2040] min-h-screen flex flex-col fixed left-0 top-0 z-40">
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-9 w-auto brightness-0 invert" />
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
          <NavLink to="/portal" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            Portal
          </NavLink>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
            Sign Out
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
          <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">Global Admin Panel</p>
        </header>
        <main className="flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}