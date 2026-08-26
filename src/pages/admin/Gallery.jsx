import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AdminGallery() {
  const { profile } = useAuth()
  const [photos, setPhotos] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [uploadError, setUploadError] = useState('')
  const [form, setForm] = useState({
    title: '',
    caption: '',
    description: '',
    event_id: '',
    is_public: true,
    display_order: 0,
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchPhotos()
    fetchEvents()
  }, [])

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photo_gallery')
      .select('*, events(name), profiles(first_name, last_name)')
      .order('display_order')
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('id, name')
      .order('created_at', { ascending: false })
    setEvents(data ?? [])
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.')
      return
    }
    setUploadError('')
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    if (!form.title) setForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }))
  }

  function closeForm() {
    setShowForm(false)
    setSelectedFile(null)
    setPreview(null)
    setUploadError('')
    setForm({ title: '', caption: '', description: '', event_id: '', is_public: true, display_order: 0 })
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    setUploadError('')

    try {
      const ext = selectedFile.name.split('.').pop().toLowerCase()
      const path = `photos/${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .upload(path, selectedFile, { upsert: false })

      if (storageError) throw new Error(storageError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(path)

      const { error: dbError } = await supabase.from('photo_gallery').insert({
        organization_id: profile.organization_id,
        title: form.title.trim(),
        caption: form.caption || null,
        description: form.description || null,
        photo_url: publicUrl,
        event_id: form.event_id || null,
        is_public: form.is_public,
        display_order: parseInt(form.display_order) || 0,
        uploaded_by: profile.id,
      })

      if (dbError) throw new Error(dbError.message)

      closeForm()
      fetchPhotos()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function updatePhoto(id, updates) {
    await supabase.from('photo_gallery').update(updates).eq('id', id)
    fetchPhotos()
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }))
  }

  async function deletePhoto(id) {
    if (!confirm('Delete this photo?')) return
    await supabase.from('photo_gallery').delete().eq('id', id)
    setSelected(null)
    fetchPhotos()
  }

  const filtered = filter === 'all' ? photos : photos.filter(p =>
    filter === 'public' ? p.is_public : !p.is_public
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">Manage photos for the public gallery.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
          + Upload Photo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Photos', value: photos.length },
          { label: 'Public', value: photos.filter(p => p.is_public).length },
          { label: 'Private', value: photos.filter(p => !p.is_public).length },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Upload modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Upload Photo</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpload} className="space-y-4">
                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{uploadError}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <input type="file" required accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#e8eef7] file:text-[#1e3a6e] hover:file:bg-[#1e3a6e] hover:file:text-white file:transition-colors cursor-pointer" />
                  {preview && (
                    <img src={preview} alt="Preview" className="mt-2 h-40 w-full object-cover rounded-lg" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" name="title" required value={form.title} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
                  <input type="text" name="caption" value={form.caption} onChange={handleChange}
                    placeholder="Short caption shown under photo"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event (optional)</label>
                  <select name="event_id" value={form.event_id} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                    <option value="">No event</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" name="display_order" value={form.display_order} onChange={handleChange}
                    min={0} placeholder="0"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange}
                    className="accent-[#1e3a6e]" />
                  <span className="text-sm text-gray-600">Show on public gallery page</span>
                </label>

                <div className="bg-[#fffbf0] border border-[#e8c96f] rounded-lg p-3">
                  <p className="text-xs text-[#7c5e10]">JPG, PNG, or WebP only. Max 5MB.</p>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={uploading || !selectedFile}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {uploading ? 'Uploading...' : 'Upload'}
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

      {/* Photo detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <img src={selected.photo_url} alt={selected.title} className="w-full object-cover max-h-80" />
            <div className="p-6 space-y-4">
              {selected.caption && <p className="text-sm text-gray-600 italic">{selected.caption}</p>}
              {selected.events?.name && (
                <p className="text-xs text-[#b8963e] font-semibold">{selected.events.name}</p>
              )}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.is_public}
                    onChange={() => updatePhoto(selected.id, { is_public: !selected.is_public })}
                    className="accent-[#1e3a6e]" />
                  <span className="text-sm text-gray-600">Public</span>
                </label>
                <button onClick={() => deletePhoto(selected.id)}
                  className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-semibold ml-auto">
                  Delete Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'public', 'private'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
              ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(photo => (
            <button key={photo.id} onClick={() => setSelected(photo)}
              className="group relative rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md transition-all">
              <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                <div className="p-3 opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-white text-xs font-semibold truncate">{photo.title}</p>
                  {!photo.is_public && (
                    <span className="text-white/70 text-xs">Private</span>
                  )}
                </div>
              </div>
              {!photo.is_public && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                  Private
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No photos yet. Upload one to get started.</p>
        </div>
      )}
    </div>
  )
}