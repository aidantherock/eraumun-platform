import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'

export default function EventAdminAttendees() {
  const { event } = useOutletContext()
  const { profile } = useAuth()
  const [attendees, setAttendees] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addSearch, setAddSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (event?.id) {
      fetchAttendees()
      fetchAllUsers()
    }
  }, [event?.id])

  async function fetchAttendees() {
    const { data: eventRoles } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', event.id)

    if (!eventRoles?.length) { setLoading(false); return }

    const eventRoleIds = eventRoles.map(r => r.id)

    const { data } = await supabase
      .from('user_event_roles')
      .select('*, profiles(id, first_name, last_name, email, school, avatar_url), event_roles(name)')
      .in('event_role_id', eventRoleIds)
      .order('assigned_at', { ascending: false })

    setAttendees(data ?? [])
    setLoading(false)
  }

  async function fetchAllUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, school')
      .eq('status', 'approved')
      .order('first_name')
    setAllUsers(data ?? [])
  }

  async function approveAttendee(id) {
    await supabase.from('user_event_roles').update({ approved: true }).eq('id', id)
    fetchAttendees()
  }

  async function removeAttendee(id) {
    if (!confirm('Remove this attendee from the event?')) return
    await supabase.from('user_event_roles').delete().eq('id', id)
    fetchAttendees()
  }

  async function addAttendee(userId) {
    setAdding(true)

    const { data: eventRole } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', event.id)
      .single()

    if (!eventRole) {
      alert('No event role found. Create committees first.')
      setAdding(false)
      return
    }

    const { error } = await supabase.from('user_event_roles').insert({
      user_id: userId,
      event_role_id: eventRole.id,
      approved: true,
    })

    if (!error) {
      fetchAttendees()
      setAddSearch('')
    }
    setAdding(false)
  }

  const filtered = attendees.filter(a => {
    const name = `${a.profiles?.first_name} ${a.profiles?.last_name} ${a.profiles?.email}`.toLowerCase()
    const matchesSearch = name.includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'approved' ? a.approved : !a.approved)
    return matchesSearch && matchesFilter
  })

  const addFiltered = allUsers.filter(u => {
    const name = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase()
    const alreadyAdded = attendees.some(a => a.profiles?.id === u.id)
    return name.includes(addSearch.toLowerCase()) && !alreadyAdded
  }).slice(0, 8)

  const approvedCount = attendees.filter(a => a.approved).length
  const pendingCount = attendees.filter(a => !a.approved).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Attendees</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage who is registered for {event?.name}.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + Add Attendee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: attendees.length },
          { label: 'Approved', value: approvedCount },
          { label: 'Pending', value: pendingCount },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Add attendee panel */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Add Attendee</h2>
          <input
            type="text"
            value={addSearch}
            onChange={e => setAddSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors mb-3"
          />
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {addSearch.length > 0 ? addFiltered.length > 0 ? addFiltered.map(user => (
              <div key={user.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-gray-400">{user.email} — {user.school}</p>
                </div>
                <button
                  onClick={() => addAttendee(user.id)}
                  disabled={adding}
                  className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )) : (
              <div className="px-4 py-4 text-center text-sm text-gray-400">No users found.</div>
            ) : (
              <div className="px-4 py-4 text-center text-sm text-gray-400">Type to search members.</div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search attendees..."
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors w-64"
        />
        <div className="flex gap-2">
          {['all', 'approved', 'pending'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Attendee list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : filtered.length > 0 ? filtered.map(attendee => (
            <div key={attendee.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0 overflow-hidden">
                  {attendee.profiles?.avatar_url ? (
                    <img src={attendee.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{attendee.profiles?.first_name?.charAt(0)}{attendee.profiles?.last_name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {attendee.profiles?.first_name} {attendee.profiles?.last_name}
                  </p>
                  <p className="text-xs text-gray-400">{attendee.profiles?.email} — {attendee.profiles?.school}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registered {new Date(attendee.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {attendee.approved ? (
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">Approved</span>
                ) : (
                  <button
                    onClick={() => approveAttendee(attendee.id)}
                    className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => removeAttendee(attendee.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              {filter === 'all' ? 'No attendees yet.' : `No ${filter} attendees.`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}