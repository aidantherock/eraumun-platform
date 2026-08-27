import { useEffect, useState } from 'react'
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
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
      .select('*, events(id, name, status)')
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
      .single()
    setUserRole(data?.role ?? null)
  }

  const isStaff = isStaffOrAbove || userRole === 'chair' || userRole === 'staff'
  const isCrisis = committee?.type === 'crisis'

  const NAV = [
    { label: 'Overview', to: '', end: true },
    { label: 'Resources', to: 'resources' },
    { label: 'Submissions', to: 'submissions' },
    { label: 'Resolutions', to: 'resolutions' },
    { label: 'Floor', to: 'floor' },
    { label: 'Messages', to: 'messages' },
    ...(isCrisis ? [
  { label: 'Crisis Feed', to: 'crisis' },
  { label: 'Crisis Notes', to: 'notes' },
] : []),
    ...(isStaff ? [{ label: 'Voting', to: 'voting' }] : []),
  { label: 'Awards', to: 'awards' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (!committee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Committee not found.</p>
          <button onClick={() => navigate('/portal/events')}
            className="text-sm text-[#1e3a6e] font-medium hover:underline">
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  const base = `/portal/committee/${committeeId}`

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-[#0f2040] min-h-screen flex flex-col fixed left-0 top-0 z-40">
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/logo-horizontal.png" alt="ERAU-MUN" className="h-9 w-auto brightness-0 invert" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mt-2">
            {isCrisis ? 'Crisis Committee' : 'General Assembly'}
          </p>
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-sm font-semibold text-white leading-tight">{committee.name}</p>
          {committee.topic && (
            <p className="text-xs text-white/40 mt-0.5 leading-snug">{committee.topic}</p>
          )}
          {userRole && (
            <span className="inline-block mt-2 text-xs font-bold text-[#d4af62] uppercase tracking-wide">
              {userRole.replace('_', ' ')}
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(item => (
            <NavLink
              key={item.label}
              to={`${base}/${item.to}`}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`
              }
            >
              {item.label}
              {item.label === 'Crisis Feed' && (
                <span className="ml-auto text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold">
                  LIVE
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
          <button
            onClick={() => navigate(`/portal/committee/${committeeId}/conference`)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#d4af62] hover:bg-white/10 transition-colors w-full text-left"
          >
            ⚡ Conference Mode
          </button>
          {committee.events && (
            <button
              onClick={() => navigate(`/portal/events/${committee.events.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
            >
              Back to Event
            </button>
          )}
          <button
            onClick={() => navigate('/portal')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
          >
            Portal Home
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">
              {committee.name}
              {committee.events?.name && ` — ${committee.events.name}`}
            </p>
            {isStaff && (
              <span className="text-xs font-bold text-[#1e3a6e] bg-[#e8eef7] px-2.5 py-1 rounded-full">
                Staff
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 px-8 py-8">
          <Outlet context={{ committee, userRole, isStaff, isCrisis, refetch: fetchCommittee }} />
        </main>
      </div>
    </div>
  )
}