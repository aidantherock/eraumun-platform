import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const MUN_AWARDS = [
  'Best Delegate',
  'Outstanding Delegate',
  'Honorable Mention',
  'Best Position Paper',
  'Best Small Delegation',
  'Best Large Delegation',
  'Most Improved Delegate',
  'Best Crisis Note',
  'Best Directive',
  'Best Communiqué',
  'Verbal Commendation',
  'Custom Award',
]

const EMPTY_FORM = {
  award_type: 'Best Delegate',
  custom_award: '',
  recipient_type: 'individual',
  user_id: '',
  delegation: '',
  notes: '',
  is_public: true,
}

export default function CommitteeAwards() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [awards, setAwards] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (committee?.id) {
      fetchAwards()
      fetchMembers()
    }
  }, [committee?.id])

  async function fetchAwards() {
    const { data } = await supabase
      .from('awards')
      .select('*, profiles!awards_user_id_fkey(first_name, last_name, avatar_url)')
      .eq('committee_id', committee.id)
      .order('awarded_at', { ascending: false })
    setAwards(data ?? [])
    setLoading(false)
  }

  async function fetchMembers() {
    const { data } = await supabase
      .from('committee_roles')
      .select('*, profiles(id, first_name, last_name, school)')
      .eq('committee_id', committee.id)
      .in('role', ['delegate', 'head_delegate'])
    setMembers(data ?? [])
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function closeForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    await supabase.from('awards').insert({
      organization_id: profile.organization_id,
      committee_id: committee.id,
      award_type: form.award_type === 'Custom Award' ? form.custom_award : form.award_type,
      custom_award: form.award_type === 'Custom Award' ? form.custom_award : null,
      user_id: form.recipient_type === 'individual' ? form.user_id : null,
      delegation: form.recipient_type === 'delegation' ? form.delegation : null,
      notes: form.notes || null,
      is_public: form.is_public,
      awarded_by: profile.id,
      awarded_at: new Date().toISOString(),
    })

    closeForm()
    fetchAwards()
    setSubmitting(false)
  }

  async function deleteAward(id) {
    if (!confirm('Delete this award?')) return
    await supabase.from('awards').delete().eq('id', id)
    fetchAwards()
  }

  const filtered = filter === 'all'
    ? awards
    : awards.filter(a => filter === 'individual' ? a.user_id : a.delegation)

  if (!isStaff) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Awards</h1>
          <p className="text-sm text-gray-500 mt-1">Awards given in {committee?.name}.</p>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : awards.filter(a => a.is_public).length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {awards.filter(a => a.is_public).map(award => (
                <div key={award.id} className="px-6 py-4 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🏆</span>
                  <div>
                    <p className="text-sm font-bold text-[#b8963e]">{award.award_type}</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {award.user_id
                        ? `${award.profiles?.first_name} ${award.profiles?.last_name}`
                        : `Delegation: ${award.delegation}`}
                    </p>
                    {award.notes && <p className="text-xs text-gray-400 mt-0.5">{award.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 text-sm">No awards given yet.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Awards</h1>
          <p className="text-sm text-gray-500 mt-1">Give awards to delegates and delegations in {committee?.name}.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
          + Give Award
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Awards', value: awards.length },
          { label: 'Individual', value: awards.filter(a => a.user_id).length },
          { label: 'Delegation', value: awards.filter(a => a.delegation).length },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Give Award</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Award Type</label>
                  <select name="award_type" value={form.award_type} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                    {MUN_AWARDS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {form.award_type === 'Custom Award' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Award Name</label>
                    <input type="text" name="custom_award" required value={form.custom_award} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                      placeholder="e.g. Best Crisis Director" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type</label>
                  <div className="flex gap-3">
                    {['individual', 'delegation'].map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(prev => ({ ...prev, recipient_type: t }))}
                        className={`flex-1 py-2 text-sm font-semibold rounded border transition-all capitalize
                          ${form.recipient_type === t
                            ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                            : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {form.recipient_type === 'individual' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                    <select name="user_id" required value={form.user_id} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                      <option value="">Select delegate...</option>
                      {members.map(m => (
                        <option key={m.id} value={m.profiles?.id}>
                          {m.profiles?.first_name} {m.profiles?.last_name}
                          {m.assignment ? ` — ${m.assignment}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delegation Name</label>
                    <input type="text" name="delegation" required value={form.delegation} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                      placeholder="e.g. United States, Team Alpha" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange}
                    className="accent-[#1e3a6e]" />
                  <span className="text-sm text-gray-600">Show on recipient's public profile</span>
                </label>

                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {submitting ? 'Saving...' : 'Give Award'}
                  </button>
                  <button type="button" onClick={closeForm}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'individual', 'delegation'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
              ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Awards list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(award => (
              <div key={award.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🏆</span>
                  <div>
                    <p className="text-sm font-bold text-[#b8963e]">{award.award_type}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {award.user_id
                        ? `${award.profiles?.first_name} ${award.profiles?.last_name}`
                        : `Delegation: ${award.delegation}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {!award.is_public && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Private</span>
                      )}
                    </div>
                    {award.notes && <p className="text-xs text-gray-400 mt-0.5">{award.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(award.awarded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <button onClick={() => deleteAward(award.id)}
                    className="text-xs text-red-400 font-semibold hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No awards given yet.</p>
        </div>
      )}
    </div>
  )
}