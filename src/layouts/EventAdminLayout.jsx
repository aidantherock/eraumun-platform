import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const NAV = [
  { label: 'Overview', to: '', end: true },
  { label: 'Committees', to: 'committees' },
  { label: 'Roles', to: 'roles' },
  { label: 'Submissions', to: 'submissions' },
  { label: 'Attendees', to: 'attendees' },
  { label: 'Schedule', to: 'schedule' },
  { label: 'Files', to: 'files' },
  { label: 'Delegates', to: 'delegates' },
  { label: 'Awards', to: 'awards' },
  { label: 'Checklist', to: 'checklist' },
  { label: 'Export', to: 'export' },
]

export default function EventAdminLayout() {
  const { eventId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)

  useEffect(() => {
    if (eventId) fetchEvent()
  }, [eventId])

  async function fetchEvent() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
    setEvent(data)
  }

  const base = `/admin/event/${eventId}`

  return (
   <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-[#0f2040] min-h-screen flex flex-col fixed left-0 top-0 z-40">
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/logo-horizontal.svg" alt="ERAU-MUN" className="h-9 w-auto brightness-0 invert" style={{ background: 'transparent', mixBlendMode: 'screen' }} />
          <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mt-2">Event Admin</p>
        </div>
        
        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-sm font-semibold text-white leading-tight">{event?.name ?? 'Loading...'}</p>
          <p className="text-xs text-white/40 mt-0.5 capitalize">{event?.status}</p>
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
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={() => navigate('/admin/events')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
          >
            Back to Events
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-30">
          <p className="text-xs font-bold uppercase tracking-widest text-[#b8963e]">
            {event?.name ?? 'Event'} — Admin
          </p>
        </header>
        <main className="flex-1 px-8 py-8">
          <Outlet context={{ event, refetchEvent: fetchEvent }} />
        </main>
      </div>
    </div>
  )
}