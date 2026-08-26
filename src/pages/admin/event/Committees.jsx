import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'

export default function EventAdminCommittees() {
  const { event } = useOutletContext()
  const { profile } = useAuth()
  const [committees, setCommittees] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'general_assembly', description: '', topic: '', submission_limit: ''
  })

  useEffect(() => {
    if (event?.id) fetchCommittees()
  }, [event?.id])

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committees')
      .select('*, committee_roles(*, profiles(first_name, last_name, avatar_url))')
      .eq('event_id', event.id)
      .order('name')
    setCommittees(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `committees/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('committee-logos').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('committee-logos').getPublicUrl(path)
      setForm(prev => ({ ...prev, logo_url: publicUrl }))
    }
    setUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await supabase.from('committees').insert({
      ...form,
      slug,
      event_id: event.id,
      submission_limit: form.submission_limit ? parseInt(form.submission_limit) : null,
      created_by: profile.id,
    })
    if (!error) {
      setShowForm(false)
      setForm({ name: '', type: 'general_assembly', description: '', topic: '', submission_limit: '' })
      fetchCommittees()
    }
  }

  async function deleteCommittee(id) {
    if (!confirm('Delete this committee? All data will be lost.')) return
    await supabase.from('committees').delete().eq('id', id)
    setSelected(null)
    fetchCommittees()
  }

  async function updateCommittee(id, updates) {
    await supabase.from('committees').update(updates).eq('id', id)
    fetchCommittees()
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Committees</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage committees for this event.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
          + New Committee
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">New Committee</h2>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Committee Name</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="type" value={form.type} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                  <option value="general_assembly">General Assembly</option>
                  <option value="crisis">Crisis Committee</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input type="text" name="topic" value={form.topic} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submission Limit (per delegate)</label>
                <input type="number" name="submission_limit" value={form.submission_limit} onChange={handleChange} min={1}
                  placeholder="No limit"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm text-gray-600" />
                {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
              </div>
            </div>
            <button type="submit"
              className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors">
              Create Committee
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1,2].map(i => <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />)
        ) : committees.length > 0 ? committees.map(committee => (
          <div key={committee.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e8eef7] flex items-center justify-center font-bold text-[#1e3a6e] flex-shrink-0 overflow-hidden">
                  {committee.logo_url ? (
                    <img src={committee.logo_url} alt={committee.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{committee.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{committee.name}</p>
                  <p className="text-xs text-[#b8963e] font-semibold">
                    {committee.type === 'crisis' ? 'Crisis Committee' : 'General Assembly'}
                  </p>
                </div>
              </div>
              <button onClick={() => deleteCommittee(committee.id)}
                className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
            </div>
            {committee.topic && <p className="text-xs text-gray-500 mb-2">{committee.topic}</p>}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {committee.committee_roles?.length ?? 0} members
              </p>
              <button
                onClick={() => setSelected(selected?.id === committee.id ? null : committee)}
                className="text-xs text-[#1e3a6e] font-semibold hover:underline"
              >
                {selected?.id === committee.id ? 'Close' : 'Manage'}
              </button>
            </div>

            {selected?.id === committee.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Topic</label>
                  <input
                    type="text"
                    defaultValue={committee.topic ?? ''}
                    onBlur={e => updateCommittee(committee.id, { topic: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Submission Limit</label>
                  <input
                    type="number"
                    defaultValue={committee.submission_limit ?? ''}
                    onBlur={e => updateCommittee(committee.id, { submission_limit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="No limit"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e]"
                  />
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-2 text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">No committees yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}