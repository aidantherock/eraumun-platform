import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminHome() {
  const [stats, setStats] = useState({
    pendingUsers: 0,
    totalUsers: 0,
    activeEvents: 0,
    unreadForms: 0,
    sponsors: 0,
  })
  const [recentForms, setRecentForms] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentForms()
    fetchAuditLogs()
  }, [])

  async function fetchStats() {
    const [
      { count: pendingUsers },
      { count: totalUsers },
      { count: activeEvents },
      { count: unreadForms },
      { count: sponsors },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).in('status', ['active', 'live']),
      supabase.from('public_contact_forms').select('*', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('sponsors').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ])
    setStats({ pendingUsers, totalUsers, activeEvents, unreadForms, sponsors })
    setLoading(false)
  }

  async function fetchRecentForms() {
    const { data } = await supabase
      .from('public_contact_forms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentForms(data ?? [])
  }

  async function fetchAuditLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(10)
    setAuditLogs(data ?? [])
  }

  const STATS = [
    { label: 'Pending Approvals', value: stats.pendingUsers, to: '/admin/users', urgent: stats.pendingUsers > 0 },
    { label: 'Total Users', value: stats.totalUsers, to: '/admin/users' },
    { label: 'Active Events', value: stats.activeEvents, to: '/admin/events' },
    { label: 'Unread Form Submissions', value: stats.unreadForms, to: '/admin/forms', urgent: stats.unreadForms > 0 },
    { label: 'Active Sponsors', value: stats.sponsors, to: '/admin/sponsors' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of platform activity and pending actions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATS.map(stat => (
          <Link
            key={stat.label}
            to={stat.to}
            className={`bg-white border rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all
              ${stat.urgent ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
          >
            <p className={`text-2xl font-bold font-serif ${stat.urgent ? 'text-red-600' : 'text-[#1e3a6e]'}`}>
              {loading ? '—' : stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent form submissions */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Form Submissions</h2>
            <Link to="/admin/forms" className="text-xs text-[#1e3a6e] font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentForms.length > 0 ? recentForms.map(form => (
              <div key={form.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{form.name}</p>
                  <p className="text-xs text-gray-400">{form.form_type.replace(/_/g, ' ')} — {form.email}</p>
                </div>
                {!form.is_read && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">New</span>
                )}
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No form submissions yet.</div>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {auditLogs.length > 0 ? auditLogs.map(log => (
              <div key={log.id} className="px-6 py-3">
                <p className="text-xs font-medium text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {log.profiles?.first_name} {log.profiles?.last_name} —{' '}
                  {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No activity yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}