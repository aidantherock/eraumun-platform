import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Directory() {
  const { profile: currentUser, isEboard } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [roles, setRoles] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    fetchMembers()
    fetchRoles()
  }, [])

  async function fetchMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('*, user_roles(*, roles(*)), awards(award_type, is_public)')
      .eq('status', 'approved')
      .order('first_name')
    setMembers(data ?? [])
    setLoading(false)
  }

  async function fetchRoles() {
    const { data } = await supabase
      .from('roles')
      .select('*')
      .order('level', { ascending: false })
    setRoles(data ?? [])
  }

  const filtered = members.filter(m => {
    const matchesSearch = search === '' ||
      `${m.first_name} ${m.last_name} ${m.school} ${m.email}`
        .toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' ||
      m.user_roles?.some(ur => ur.roles?.slug === roleFilter)
    return matchesSearch && matchesRole
  })

  const getRoleLevel = (member) => {
    if (!member.user_roles?.length) return 0
    return Math.max(...member.user_roles.map(ur => ur.roles?.level ?? 0))
  }

  const getRoleName = (member) => {
    if (!member.user_roles?.length) return 'Member'
    const highestRole = member.user_roles.reduce((prev, curr) =>
      (curr.roles?.level ?? 0) > (prev.roles?.level ?? 0) ? curr : prev
    )
    return highestRole.roles?.name ?? 'Member'
  }

  const ROLE_COLORS = {
    president: 'bg-[#fdf6e3] text-[#b8963e] border-[#b8963e]',
    vp: 'bg-[#fdf6e3] text-[#b8963e] border-[#b8963e]',
    eboard: 'bg-[#e8eef7] text-[#1e3a6e] border-[#1e3a6e]',
    'conference-staff': 'bg-purple-50 text-purple-700 border-purple-200',
    default: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  function getRoleColor(member) {
    const level = getRoleLevel(member)
    if (level >= 100) return ROLE_COLORS.president
    if (level >= 90) return ROLE_COLORS.vp
    if (level >= 80) return ROLE_COLORS.eboard
    if (level >= 70) return ROLE_COLORS['conference-staff']
    return ROLE_COLORS.default
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Member Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse all approved ERAU-MUN members.
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, school..."
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors w-72"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white"
        >
          <option value="all">All Roles</option>
          {roles.map(r => (
            <option key={r.id} value={r.slug}>{r.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 ml-auto">
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Members grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(member => (
            <Link
              key={member.id}
              to={`/portal/directory/${member.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center"
            >
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-[#e8eef7] border-2 border-[#b8963e] flex items-center justify-center font-bold text-[#1e3a6e] mx-auto mb-3 overflow-hidden">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{member.first_name?.charAt(0)}{member.last_name?.charAt(0)}</span>
                )}
              </div>

              {/* Name */}
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {member.first_name} {member.last_name}
              </p>

              {/* School */}
              {member.school && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{member.school}</p>
              )}

              {/* Role badge */}
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-2 ${getRoleColor(member)}`}>
                {getRoleName(member)}
              </span>

              {/* Awards count */}
              {member.awards?.filter(a => a.is_public).length > 0 && (
                <p className="text-xs text-[#b8963e] mt-2">
                  🏆 {member.awards.filter(a => a.is_public).length} award{member.awards.filter(a => a.is_public).length !== 1 ? 's' : ''}
                </p>
              )}

              {/* Current user indicator */}
              {member.id === currentUser?.id && (
                <p className="text-xs text-[#1e3a6e] font-semibold mt-1">You</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No members found.</p>
        </div>
      )}
    </div>
  )
}