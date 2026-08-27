import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const CHECKLIST_ITEMS = [
  'Logo on homepage',
  'Logo on conference materials',
  'Social media mention',
  'Email newsletter feature',
  'Event signage',
  'Verbal acknowledgment at event',
  'Certificate of appreciation',
]

export default function AdminSponsors() {
  const { profile } = useAuth()
  const [sponsors, setSponsors] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    website_url: '',
    tier: '',
    notes: '',
    is_active: true,
    show_on_homepage: true,
    checklist: {},
    custom_tier: '',
  })

  useEffect(() => {
    fetchSponsors()
  }, [])

  async function fetchSponsors() {
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .order('name')
    setSponsors(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleChecklist(item) {
    setForm(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [item]: !prev.checklist[item] }
    }))
  }

  async function handleLogoUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  setUploading(true)
  const ext = file.name.split('.').pop()
  const path = `sponsors/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('sponsors').upload(path, file)
  if (error) {
    console.error('Upload error:', error)
    alert(`Upload failed: ${error.message}`)
  } else {
    const { data: { publicUrl } } = supabase.storage.from('sponsors').getPublicUrl(path)
    setForm(prev => ({ ...prev, logo_url: publicUrl }))
  }
  setUploading(false)
}

  async function handleSubmit(e) {
  e.preventDefault()
  const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const { error } = await supabase.from('sponsors').insert({
    ...form,
    initials,
    tier: form.tier || null,
    custom_tier: form.tier === 'Custom' ? form.custom_tier : null,
    created_by: profile.id,
    organization_id: profile.organization_id,
  })
  if (!error) {
    setShowForm(false)
    setForm({ name: '', website_url: '', tier: '', custom_tier: '', notes: '', is_active: true, show_on_homepage: true, checklist: {} })
    fetchSponsors()
  }
}

  async function updateSponsor(id, updates) {
    await supabase.from('sponsors').update(updates).eq('id', id)
    fetchSponsors()
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }))
  }

  async function deleteSponsor(id) {
    if (!confirm('Delete this sponsor?')) return
    await supabase.from('sponsors').delete().eq('id', id)
    setSelected(null)
    fetchSponsors()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Sponsors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage sponsors and partnerships.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + Add Sponsor
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">New Sponsor</h2>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Name</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input type="url" name="website_url" value={form.website_url} onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
            </div>
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
  <select name="tier" value={form.tier} onChange={handleChange}
    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
    <option value="">Select tier...</option>
    {['Gold', 'Silver', 'Bronze', 'Partner', 'Custom'].map(t => (
      <option key={t} value={t}>{t}</option>
    ))}
  </select>
</div>

{form.tier === 'Custom' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Tier Name</label>
    <input type="text" name="custom_tier" value={form.custom_tier ?? ''} onChange={handleChange}
      placeholder="e.g. Presenting Sponsor, Title Sponsor"
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
  </div>
)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload}
                className="text-sm text-gray-600" />
              {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sponsorship Checklist</label>
              <div className="grid grid-cols-2 gap-2">
                {CHECKLIST_ITEMS.map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.checklist[item] ?? false}
                      onChange={() => handleChecklist(item)} className="accent-[#1e3a6e]" />
                    <span className="text-xs text-gray-600">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="accent-[#1e3a6e]" />
                <span className="text-sm text-gray-600">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="show_on_homepage" checked={form.show_on_homepage} onChange={handleChange} className="accent-[#1e3a6e]" />
                <span className="text-sm text-gray-600">Show on homepage</span>
              </label>
            </div>
            <button type="submit"
              className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors">
              Add Sponsor
            </button>
          </form>
        </div>
      )}

      {/* Sponsor gallery */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />)
        ) : sponsors.length > 0 ? sponsors.map(sponsor => (
          <button
            key={sponsor.id}
            onClick={() => setSelected(sponsor)}
            className={`bg-white border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all
              ${selected?.id === sponsor.id ? 'border-[#1e3a6e]' : 'border-gray-200'}
              ${!sponsor.is_active ? 'opacity-50' : ''}`}
          >
            <div className="h-12 flex items-center justify-center mx-auto mb-2">
  {sponsor.logo_url ? (
    <img src={sponsor.logo_url} alt={sponsor.name} className="h-full w-auto object-contain max-w-[120px]" />
  ) : (
    <span className="text-sm font-bold text-[#1e3a6e]">{sponsor.initials}</span>
  )}
</div>
            <p className="text-xs font-semibold text-gray-900 truncate">{sponsor.name}</p>
            {sponsor.tier && <p className="text-xs text-[#b8963e] font-medium">{sponsor.tier}</p>}
          </button>
        )) : (
          <div className="col-span-6 text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">No sponsors yet.</p>
          </div>
        )}
      </div>

      {/* Sponsor detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#e8eef7] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selected.logo_url ? (
                    <img src={selected.logo_url} alt={selected.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xl font-bold text-[#1e3a6e]">{selected.initials}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  {selected.tier && <p className="text-sm text-[#b8963e] font-medium">{selected.tier}</p>}
                  {selected.website_url && (
                    <a href={selected.website_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#1e3a6e] hover:underline">{selected.website_url}</a>
                  )}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Sponsorship Checklist</p>
                <div className="grid grid-cols-2 gap-2">
                  {CHECKLIST_ITEMS.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.checklist?.[item] ?? false}
                        onChange={() => {
                          const updated = { ...selected.checklist, [item]: !selected.checklist?.[item] }
                          updateSponsor(selected.id, { checklist: updated })
                        }}
                        className="accent-[#1e3a6e]"
                      />
                      <span className="text-xs text-gray-600">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Notes</p>
                <textarea
                  value={selected.notes ?? ''}
                  onChange={e => setSelected(prev => ({ ...prev, notes: e.target.value }))}
                  onBlur={e => updateSponsor(selected.id, { notes: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
                  placeholder="Add notes about this sponsor..."
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.is_active}
                    onChange={() => updateSponsor(selected.id, { is_active: !selected.is_active })}
                    className="accent-[#1e3a6e]" />
                  <span className="text-sm text-gray-600">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.show_on_homepage}
                    onChange={() => updateSponsor(selected.id, { show_on_homepage: !selected.show_on_homepage })}
                    className="accent-[#1e3a6e]" />
                  <span className="text-sm text-gray-600">Show on homepage</span>
                </label>
              </div>

              <button onClick={() => deleteSponsor(selected.id)}
                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-semibold">
                Delete Sponsor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}