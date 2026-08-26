import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function MemberProfile() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const { profile: currentUser, isEboard } = useAuth()
  const [member, setMember] = useState(null)
  const [awards, setAwards] = useState([])
  const [eventHistory, setEventHistory] = useState([])
  const [committees, setCommittees] = useState([])
  const [loading, setLoading] = useState(true)

  const isOwnProfile = currentUser?.id === memberId

  useEffect(() => {
    if (memberId) fetchAll()
  }, [memberId])

  async function fetchAll() {
    await Promise.all([
      fetchMember(),
      fetchAwards(),
      fetchEventHistory(),
      fetchCommittees(),
    ])
    setLoading(false)
  }

  async function fetchMember() {
    const { data } = await supabase
      .from('profiles')
      .select('*, user_roles(*, roles(*))')
      .eq('id', memberId)
      .eq('status', 'approved')
      .single()
    setMember(data)
  }

  async function fetchAwards() {
    const { data } = await supabase
      .from('awards')
      .select('*, events(name), committees(name)')
      .eq('user_id', memberId)
      .eq('is_public', true)
      .order('awarded_at', { ascending: false })
    setAwards(data ?? [])
  }

  async function fetchEventHistory() {
    const { data } = await supabase
      .from('user_event_roles')
      .select('*, event_roles(event_id, *, events(name, start_date, end_date, location))')
      .eq('user_id', memberId)
      .eq('approved', true)
      .order('assigned_at', { ascending: false })
    setEventHistory(data ?? [])
  }

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committee_roles')
      .select('*, committees(name, type, events(name))')
      .eq('user_id', memberId)
      .order('created_at', { ascending: false })
    setCommittees(data ?? [])
  }

  const getRoleName = (member) => {
    if (!member?.user_roles?.length) return 'Member'
    const highest = member.user_roles.reduce((prev, curr) =>
      (curr.roles?.level ?? 0) > (prev.roles?.level ?? 0) ? curr : prev
    )
    return highest.roles?.name ?? 'Member'
  }

  const getRoleLevel = (member) => {
    if (!member?.user_roles?.length) return 0
    return Math.max(...member.user_roles.map(ur => ur.roles?.level ?? 0))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Member not found.</p>
        <Link to="/portal/directory" className="text-sm text-[#1e3a6e] font-medium hover:underline">
          Back to Directory
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button onClick={() => navigate('/portal/directory')}
        className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
        &#8592; Back to Directory
      </button>

      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-[#1e3a6e] to-[#2d538f] px-8 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#e8eef7] border-4 border-[#b8963e] flex items-center justify-center font-bold text-[#1e3a6e] text-2xl overflow-hidden flex-shrink-0">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{member.first_name?.charAt(0)}{member.last_name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-2xl font-bold text-white">
                {member.first_name} {member.last_name}
                {isOwnProfile && <span className="text-white/50 text-sm font-normal ml-2">(You)</span>}
              </h1>
              {member.school && <p className="text-white/60 text-sm mt-0.5">{member.school}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                  ${getRoleLevel(member) >= 80
                    ? 'bg-[#b8963e]/20 text-[#d4af62]'
                    : 'bg-white/10 text-white/70'}`}>
                  {getRoleName(member)}
                </span>
                {awards.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70">
                    🏆 {awards.length} Award{awards.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <Link to="/portal/profile"
                className="ml-auto text-xs border border-white/30 text-white font-semibold px-4 py-2 rounded hover:bg-white/10 transition-colors flex-shrink-0">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Bio & social */}
        {(member.bio || (member.show_contact_info && (member.twitter_url || member.linkedin_url || member.website_url))) && (
          <div className="px-8 py-6 border-b border-gray-100">
            {member.bio && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{member.bio}</p>
            )}
            {member.show_contact_info && (
              <div className="flex items-center gap-4 flex-wrap">
                {member.twitter_url && (
                  <a href={member.twitter_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#1e3a6e] font-medium hover:underline">Twitter/X</a>
                )}
                {member.linkedin_url && (
                  <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#1e3a6e] font-medium hover:underline">LinkedIn</a>
                )}
                {member.website_url && (
                  <a href={member.website_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#1e3a6e] font-medium hover:underline">Website</a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Awards */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Awards</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {awards.length > 0 ? awards.map(award => (
              <div key={award.id} className="px-6 py-4 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">🏆</span>
                <div>
                  <p className="text-sm font-semibold text-[#b8963e]">{award.award_type}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {award.events?.name && <p className="text-xs text-gray-500">{award.events.name}</p>}
                    {award.committees?.name && <p className="text-xs text-gray-400">— {award.committees.name}</p>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(award.awarded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No awards yet.</div>
            )}
          </div>
        </div>

        {/* Event history */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Event History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {eventHistory.length > 0 ? eventHistory.map(item => (
              <div key={item.id} className="px-6 py-4">
                <p className="text-sm font-semibold text-gray-900">
                  {item.event_roles?.events?.name ?? 'Event'}
                </p>
                {item.event_roles?.events?.start_date && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.event_roles.events.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {item.event_roles?.events?.location && (
                  <p className="text-xs text-gray-400">{item.event_roles.events.location}</p>
                )}
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No event history yet.</div>
            )}
          </div>
        </div>

        {/* Committee history */}
        {committees.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm md:col-span-2">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Committee History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {committees.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.committees?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.committees?.events?.name} —{' '}
                      <span className="capitalize">{item.role?.replace('_', ' ')}</span>
                      {item.assignment && ` · ${item.assignment}`}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize
                    ${item.role === 'chair' || item.role === 'staff'
                      ? 'bg-[#e8eef7] text-[#1e3a6e]'
                      : 'bg-gray-100 text-gray-600'}`}>
                    {item.role?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participation certificates */}
        {isOwnProfile && eventHistory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm md:col-span-2">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Participation Certificates</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {eventHistory.map(item => (
                item.event_roles?.events && (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.event_roles.events.name}
                      </p>
                      {item.event_roles.events.start_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.event_roles.events.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    
                      <a href={`/.netlify/functions/generate-certificate?userId=${memberId}&eventId=${item.event_roles.event_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#1e3a6e] font-semibold border border-[#1e3a6e] px-3 py-1.5 rounded hover:bg-[#e8eef7] transition-colors flex-shrink-0"
                    >
                      Download
                    </a>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}