import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

export default function EventAdminRoles() {
  const { event } = useOutletContext()
  const [users, setUsers] = useState([])
  const [eventAttendees, setEventAttendees] = useState([])
  const [committees, setCommittees] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedCommittee, setSelectedCommittee] = useState('')
  const [selectedRole, setSelectedRole] = useState('delegate')
  const [assignment, setAssignment] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (event?.id) {
      fetchUsers()
      fetchEventAttendees()
      fetchCommittees()
    }
  }, [event?.id])

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, school, avatar_url')
      .eq('status', 'approved')
      .order('first_name')
    setUsers(data ?? [])
    setLoading(false)
  }

  async function fetchEventAttendees() {
    const { data: eventRoles } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', event.id)

    if (!eventRoles?.length) {
      setEventAttendees([])
      return
    }

    const { data } = await supabase
      .from('user_event_roles')
      .select('user_id, approved, profiles(id, first_name, last_name, email, school, avatar_url)')
      .in('event_role_id', eventRoles.map(r => r.id))

    setEventAttendees(data?.map(d => ({ ...d.profiles, approved: d.approved })) ?? [])
  }

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committees')
      .select('id, name, type, committee_roles(*, profiles(id, first_name, last_name, school))')
      .eq('event_id', event.id)
      .order('name')
    setCommittees(data ?? [])
  }

  async function assignEventRole(userId) {
    let { data: eventRole } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle()

    if (!eventRole) {
      const { data: newRole } = await supabase
        .from('event_roles')
        .insert({ event_id: event.id, name: 'Attendee' })
        .select()
        .single()
      eventRole = newRole
    }

    if (!eventRole) return

    await supabase.from('user_event_roles').upsert({
      user_id: userId,
      event_role_id: eventRole.id,
      approved: true,
    }, { onConflict: 'user_id,event_role_id' })

    fetchUsers()
    fetchEventAttendees()
  }

  async function removeEventRole(userId) {
    const { data: eventRoles } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', event.id)

    if (!eventRoles?.length) return

    await supabase.from('user_event_roles')
      .delete()
      .eq('user_id', userId)
      .in('event_role_id', eventRoles.map(r => r.id))

    fetchUsers()
    fetchEventAttendees()
  }

  async function assignCommitteeRole(e) {
    e.preventDefault()
    if (!selectedUser || !selectedCommittee) return
    setAssigning(true)

    await supabase.from('committee_roles').upsert({
      committee_id: selectedCommittee,
      user_id: selectedUser.id,
      role: selectedRole,
      assignment: assignment || null,
    }, { onConflict: 'committee_id,user_id' })

    setSelectedUser(null)
    setSelectedCommittee('')
    setSelectedRole('delegate')
    setAssignment('')
    fetchCommittees()
    setAssigning(false)
  }

  async function removeCommitteeRole(committeeId, userId) {
    await supabase.from('committee_roles').delete()
      .eq('committee_id', committeeId)
      .eq('user_id', userId)
    fetchCommittees()
  }

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const isEventAttendee = (userId) => eventAttendees.some(u => u.id === userId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Role Assignment</h1>
        <p className="text-sm text-gray-500 mt-1">Assign event and committee roles to approved members.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Event attendees */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Event Attendees</h2>
            <p className="text-xs text-gray-400 mt-0.5">Assign members to this event before giving committee roles.</p>
          </div>
          <div className="p-4">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors mb-3"
            />
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
              ) : filteredUsers.length > 0 ? filteredUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-400">{user.school}</p>
                  </div>
                  {isEventAttendee(user.id) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        Assigned
                      </span>
                      <button
                        onClick={() => removeEventRole(user.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => assignEventRole(user.id)}
                      className="text-xs text-[#1e3a6e] font-semibold border border-[#1e3a6e] px-2.5 py-1 rounded hover:bg-[#e8eef7] transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              )) : (
                <div className="py-8 text-center text-sm text-gray-400">No members found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Committee role assignment */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Committee Assignment</h2>
            <p className="text-xs text-gray-400 mt-0.5">Assign event attendees to specific committees.</p>
          </div>
          <div className="p-4">
            <form onSubmit={assignCommitteeRole} className="space-y-3 mb-4">
              {/* Member select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Member</label>
                <select
                  value={selectedUser?.id ?? ''}
                  onChange={e => setSelectedUser(eventAttendees.find(u => u.id === e.target.value) ?? null)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
                >
                  <option value="">Select attendee...</option>
                  {eventAttendees.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Committee select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Committee</label>
                <select
                  value={selectedCommittee}
                  onChange={e => setSelectedCommittee(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
                >
                  <option value="">Select committee...</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Role select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
                >
                  <option value="delegate">Delegate</option>
                  <option value="chair">Chair</option>
                  <option value="staff">Staff</option>
                  <option value="head_delegate">Head Delegate</option>
                </select>
              </div>

              {/* Assignment */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assignment (country, portfolio, etc.)</label>
                <input
                  type="text"
                  value={assignment}
                  onChange={e => setAssignment(e.target.value)}
                  placeholder="e.g. United States, Crisis Director"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={assigning || !selectedUser || !selectedCommittee}
                className="w-full bg-[#1e3a6e] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign to Committee'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Committee rosters */}
      {committees.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Committee Rosters</h2>
          {committees.map(committee => (
            <div key={committee.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#1e3a6e] px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#d4af62]">
                    {committee.type === 'crisis' ? 'Crisis' : 'GA'}
                  </p>
                  <p className="font-semibold text-white">{committee.name}</p>
                </div>
                <span className="text-xs text-white/50">
                  {committee.committee_roles?.length ?? 0} member{committee.committee_roles?.length !== 1 ? 's' : ''}
                </span>
              </div>
              {committee.committee_roles?.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {committee.committee_roles.map(cr => (
                    <div key={cr.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {cr.profiles?.first_name} {cr.profiles?.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full
                            ${cr.role === 'chair' || cr.role === 'staff'
                              ? 'bg-[#e8eef7] text-[#1e3a6e]'
                              : 'bg-gray-100 text-gray-600'}`}>
                            {cr.role?.replace('_', ' ')}
                          </span>
                          {cr.assignment && (
                            <span className="text-xs text-gray-400">— {cr.assignment}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCommitteeRole(committee.id, cr.profiles?.id)}
                        className="text-xs text-red-400 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-4 text-center text-sm text-gray-400">
                  No members assigned yet.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}