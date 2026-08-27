import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TABS = ['public', 'portal', 'ernie_crisis']

const TAB_LABELS = {
  public: 'Public Contact',
  portal: 'Portal Contact',
  ernie_crisis: 'Ernie Crisis Registrations',
}

const STATUS_COLORS = {
  registered: 'bg-blue-100 text-blue-700',
  waitlisted: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const PUBLIC_FORM_TYPES = [
  'all', 'unread', 'read',
  'general', 'membership', 'sponsorship',
  'adopt_a_delegate', 'media_press',
  'erniemun_conference', 'conference_invitation',
]

export default function AdminForms() {
  const [tab, setTab] = useState('public')
  const [forms, setForms] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchForms()
    setSelected(null)
  }, [tab])

  async function fetchForms() {
    setLoading(true)
    let query

    if (tab === 'public') {
      query = supabase.from('public_contact_forms').select('*').order('created_at', { ascending: false })
    } else if (tab === 'portal') {
      query = supabase.from('portal_contact_forms').select('*, profiles(first_name, last_name, email)').order('created_at', { ascending: false })
    } else {
      query = supabase.from('ernie_crisis_registrations').select('*').order('created_at', { ascending: false })
    }

    const { data } = await query
    setForms(data ?? [])
    setLoading(false)
  }

  async function markRead(id) {
    const table = tab === 'public' ? 'public_contact_forms' : 'portal_contact_forms'
    await supabase.from(table).update({ is_read: true }).eq('id', id)
    fetchForms()
    if (selected?.id === id) setSelected(prev => ({ ...prev, is_read: true }))
  }

  async function updateRegistrationStatus(id, status) {
    await supabase.from('ernie_crisis_registrations').update({ status }).eq('id', id)
    fetchForms()
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
  }

  const filtered = tab === 'ernie_crisis'
    ? (filter === 'all' ? forms : forms.filter(f => f.status === filter))
    : tab === 'public'
    ? forms.filter(f => {
        if (filter === 'all') return true
        if (filter === 'unread') return !f.is_read
        if (filter === 'read') return f.is_read
        return f.form_type === filter
      })
    : (filter === 'all' ? forms : forms.filter(f => filter === 'unread' ? !f.is_read : f.is_read))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Form Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all form submissions.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setFilter('all') }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab === t ? 'border-[#1e3a6e] text-[#1e3a6e]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {tab === 'ernie_crisis' ? (
          ['all', 'registered', 'waitlisted', 'confirmed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {f}
            </button>
          ))
        ) : tab === 'public' ? (
          PUBLIC_FORM_TYPES.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {f.replace(/_/g, ' ')}
            </button>
          ))
        ) : (
          ['all', 'unread', 'read'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {f}
            </button>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : filtered.length > 0 ? filtered.map(form => (
              <button
                key={form.id}
                onClick={() => {
                  setSelected(form)
                  if (!form.is_read && tab !== 'ernie_crisis') markRead(form.id)
                }}
                className={`w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors
                  ${selected?.id === form.id ? 'bg-[#e8eef7]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {tab === 'ernie_crisis'
                        ? `${form.first_name} ${form.last_name}`
                        : tab === 'portal'
                        ? `${form.profiles?.first_name} ${form.profiles?.last_name}`
                        : form.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {tab === 'ernie_crisis' ? form.school : form.email ?? form.profiles?.email}
                    </p>
                    {tab === 'public' && form.form_type && (
                      <p className="text-xs text-[#b8963e] font-medium mt-0.5 capitalize">
                        {form.form_type.replace(/_/g, ' ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(form.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {tab === 'ernie_crisis' ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[form.status]}`}>
                        {form.status}
                      </span>
                    ) : !form.is_read ? (
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">New</span>
                    ) : null}
                  </div>
                </div>
              </button>
            )) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No submissions found.</div>
            )}
          </div>
        </div>

        {/* Detail */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">
                {tab === 'ernie_crisis'
                  ? `${selected.first_name} ${selected.last_name}`
                  : tab === 'portal'
                  ? `${selected.profiles?.first_name} ${selected.profiles?.last_name}`
                  : selected.name}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">&#x2715;</button>
            </div>

            <div className="space-y-3">
              {tab === 'ernie_crisis' ? (
                <>
                  {[
                    ['Type', selected.registration_type],
                    ['Email', selected.email],
                    ['School', selected.school],
                    ['Experience', selected.experience_level],
                    ['Team Name', selected.team_name],
                    ['Team Size', selected.team_size],
                    ['Faculty Advisor', selected.faculty_advisor_name],
                    ['Advisor Email', selected.faculty_advisor_email],
                    ['Additional Info', selected.additional_info],
                    ['Registered', new Date(selected.created_at).toLocaleDateString()],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {['registered', 'waitlisted', 'confirmed', 'cancelled'].map(s => (
                        <button key={s} onClick={() => updateRegistrationStatus(selected.id, s)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize transition-all
                            ${selected.status === s
                              ? STATUS_COLORS[s] + ' border-transparent'
                              : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {[
                    ['From', tab === 'portal'
                      ? `${selected.profiles?.first_name} ${selected.profiles?.last_name}`
                      : selected.name],
                    ['Email', selected.email ?? selected.profiles?.email],
                    ['Form Type', selected.form_type?.replace(/_/g, ' ')],
                    ['Subject', selected.subject],
                    ['School / Org', selected.school],
                    ['Anonymous', selected.is_anonymous ? 'Yes' : null],
                    ['Submitted', new Date(selected.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
                      <p className="text-sm text-gray-700 mt-0.5 capitalize">{value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Message</p>
                    <p className="text-sm text-gray-700 mt-0.5 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  </div>
                  {!selected.is_read && (
                    <button onClick={() => markRead(selected.id)}
                      className="text-xs text-[#1e3a6e] font-semibold border border-[#1e3a6e] px-3 py-1.5 rounded hover:bg-[#e8eef7] transition-colors">
                      Mark as Read
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}