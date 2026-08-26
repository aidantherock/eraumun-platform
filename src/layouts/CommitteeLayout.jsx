import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function CommitteeLayout() {
  const { committeeId } = useParams()
  const { profile, isStaffOrAbove } = useAuth()
  const navigate = useNavigate()
  const [committee, setCommittee] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (committeeId && profile?.id) {
      fetchCommittee()
      fetchUserRole()
    }
  }, [committeeId, profile?.id])

  async function fetchCommittee() {
    const { data } = await supabase
      .from('committees')
      .select('*, events(name)')
      .eq('id', committeeId)
      .single()
    setCommittee(data)
    setLoading(false)
  }

  async function fetchUserRole() {
    const { data } = await supabase
      .from('committee_roles')
      .select('role')
      .eq('committee_id', committeeId)
      .eq('user_id', profile.id)
      .maybeSingle()
    setUserRole(data?.role ?? null)
  }

  const isStaff = userRole === 'chair' || userRole === 'staff' || isStaffOrAbove

  const base = `/portal/committee/${committeeId}`

  const NAV = [
    { label: 'Overview', to: base },
    { label: 'Submissions', to: `${base}/submissions` },
    { label: 'Resolutions', to: `${base}/resolutions` },
    { label: 'Voting', to: `${base}/voting` },
    { label: 'Messages', to: `${base}/messages` },
    { label: 'Crisis Feed', to: 'crisis' },
    ...(isStaff ? [{ label: 'Floor', to: `${base}/floor` }] : []),
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-[#1e3a6e] min-h-screen flex flex-col fixed left-0 top-0 z-40">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/logo-horizontal.jpg" alt="ERAU-MUN" className="h-9 w-auto brightness-0 invert" />
        </div>

        {/* Committee info */}
        <div className="px-6 py-4 border-b border-white/10">
          {committee?.logo_url ? (
            <img src={committee.logo_url} alt={committee.name} className="h-10 w-auto mb-2 rounded" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#b8963e] flex items-center justify-center text-white font-bold text-sm mb-2">
              {committee?.name?.charAt(0) ?? 'C'}
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-0.5">
            {committee?.type === 'crisis' ? 'Crisis Committee' : 'General Assembly'}
          </p>
          <p className="text-sm font-semibold text-white leading-tight">{committee?.name}</p>
          <p className="text-xs text-white/40 mt-0.5">{committee?.events?.name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(item => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === base}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {userRole && (
            <div className="mt-4 px-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af62] bg-[#b8963e]/20 px-2 py-1 rounded">
                {userRole.replace('_', ' ')}
              </span>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={() => navigate('/portal/events')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
          >
            <span>&#8592;</span>
            Back to Events
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
          <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">
            {committee?.name ?? 'Committee'} — Workspace
          </p>
        </header>
        <main className="flex-1 px-8 py-8">
          <Outlet context={{ committee, userRole, isStaff }} />
        </main>
      </div>
    </div>
  )
}