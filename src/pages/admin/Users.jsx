import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const { profile: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*, user_roles(*, roles(*))')
      .order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  async function fetchRoles() {
    const { data } = await supabase.from('roles').select('*').order('level', { ascending: false })
    setRoles(data ?? [])
  }

  async function approveUser(userId) {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId)
    fetchUsers()
    if (selected?.id === userId) setSelected(prev => ({ ...prev, status: 'approved' }))
  }

  async function suspendUser(userId) {
    await supabase.from('profiles').update({ status: 'suspended' }).eq('id', userId)
    fetchUsers()
    if (selected?.id === userId) setSelected(prev => ({ ...prev, status: 'suspended' }))
  }

  async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    await supabase.from('profiles').delete().eq('id', userId)
    setSelected(null)
    fetchUsers()
  }

  async function assignRole(userId, roleId) {
    await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId, assigned_by: currentUser.id })
      .select()
    fetchUsers()
  }

  async function removeRole(userId, roleId) {
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role_id', roleId)
    fetchUsers()
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviting(true)
    await supabase.from('invite_tokens').insert({
      email: inviteEmail,
      role_id: inviteRole || null,
      invited_by: currentUser.id,
      organization_id: currentUser.organization_id,
    })
    setInviteSuccess(true)
    setInviteEmail('')
    setInviteRole('')
    setTimeout(() => setInviteSuccess(false), 3000)
    setInviting(false)
  }

  async function forceLogout(userId) {
    await supabase.auth.admin.signOut(userId)
  }

  const filtered = users.filter(u => {
    const matchesFilter = filter === 'all' || u.status === filter
    const matchesSearch = search === '' ||
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const STATUS_COLORS = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user accounts, roles, and approvals.</p>
      </div>

      {/* Invite */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Invite User</h2>
        {inviteSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            Invite created successfully.
          </div>
        )}
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors min-w-[200px]"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
          >
            <option value="">No role assigned</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-5 py-2 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50"
          >
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors w-64"
        />
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'suspended'].map(f => (
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

      {/* User gallery */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />)
        ) : filtered.map(user => (
          <button
            key={user.id}
            onClick={() => setSelected(user)}
            className={`bg-white border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all
              ${selected?.id === user.id ? 'border-[#1e3a6e]' : 'border-gray-200'}`}
          >
            <div className="w-12 h-12 rounded-full bg-[#e8eef7] border-2 border-[#b8963e] flex items-center justify-center font-bold text-[#1e3a6e] mx-auto mb-2 overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{user.first_name?.charAt(0)}{user.last_name?.charAt(0)}</span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-900 truncate">{user.first_name} {user.last_name}</p>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[user.status]}`}>
              {user.status}
            </span>
          </button>
        ))}
      </div>

      {/* User detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">User Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Avatar & name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#e8eef7] border-2 border-[#b8963e] flex items-center justify-center font-bold text-[#1e3a6e] overflow-hidden flex-shrink-0">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{selected.first_name?.charAt(0)}{selected.last_name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selected.first_name} {selected.last_name}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <p className="text-xs text-gray-400">{selected.school}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Status</p>
                <div className="flex gap-2">
                  {['approved', 'pending', 'suspended'].map(s => (
                    <button
                      key={s}
                      onClick={() => s === 'approved' ? approveUser(selected.id) : suspendUser(selected.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all
                        ${selected.status === s
                          ? STATUS_COLORS[s] + ' border-transparent'
                          : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roles */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Roles</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selected.user_roles?.map(ur => (
                    <div key={ur.id} className="flex items-center gap-1 bg-[#e8eef7] text-[#1e3a6e] text-xs font-semibold px-2.5 py-1 rounded-full">
                      {ur.roles?.name}
                      <button onClick={() => removeRole(selected.id, ur.role_id)} className="text-[#1e3a6e]/50 hover:text-red-500 ml-1">&#x2715;</button>
                    </div>
                  ))}
                </div>
                <select
                  onChange={e => { if (e.target.value) assignRole(selected.id, e.target.value); e.target.value = '' }}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-[#1e3a6e] bg-white"
                  defaultValue=""
                >
                  <option value="">Assign role...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* Actions */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Actions</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => deleteUser(selected.id)}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-semibold"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}