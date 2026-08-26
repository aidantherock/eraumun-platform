import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const FILE_ICONS = {
  pdf: '📄',
  doc: '📝', docx: '📝',
  xls: '📊', xlsx: '📊', csv: '📊',
  ppt: '📋', pptx: '📋',
  jpg: '🖼', jpeg: '🖼', png: '🖼',
  zip: '📦',
  default: '📁',
}

const CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'general', label: 'General' },
  { id: 'rules', label: 'Rules of Procedure' },
  { id: 'committee', label: 'Committee Specific' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'hotel', label: 'Hotel & Logistics' },
  { id: 'other', label: 'Other' },
]

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function CommitteeResources() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [form, setForm] = useState({ name: '', category: 'general' })
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (committee?.id) fetchFiles()
  }, [committee?.id])

  async function fetchFiles() {
    const { data: event } = await supabase
      .from('committees')
      .select('event_id')
      .eq('id', committee.id)
      .single()

    if (!event?.event_id) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('event_files')
      .select('*')
      .eq('event_id', event.event_id)
      .order('created_at', { ascending: false })

    setFiles(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20MB.')
      return
    }
    setUploadError('')
    setSelectedFile(file)
    if (!form.name) setForm(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }))
  }

  function closeUpload() {
    setShowUpload(false)
    setSelectedFile(null)
    setUploadError('')
    setForm({ name: '', category: 'general' })
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    setUploadError('')

    try {
      const { data: committeeData } = await supabase
        .from('committees')
        .select('event_id')
        .eq('id', committee.id)
        .single()

      if (!committeeData?.event_id) throw new Error('Event not found')

      const ext = selectedFile.name.split('.').pop().toLowerCase()
      const path = `events/${committeeData.event_id}/${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`

      const { error: storageError } = await supabase.storage
        .from('event-files')
        .upload(path, selectedFile, { upsert: false })

      if (storageError) throw new Error(storageError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('event-files')
        .getPublicUrl(path)

      await supabase.from('event_files').insert({
        event_id: committeeData.event_id,
        name: form.name.trim() || selectedFile.name,
        file_url: publicUrl,
        file_type: ext,
        file_size: selectedFile.size,
        category: form.category,
        uploaded_by: profile.id,
      })

      closeUpload()
      fetchFiles()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function deleteFile(id) {
    if (!confirm('Delete this file?')) return
    await supabase.from('event_files').delete().eq('id', id)
    fetchFiles()
  }

  const filtered = filter === 'all'
    ? files
    : files.filter(f => f.category === filter)

  const categoryCounts = files.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Resources</h1>
          <p className="text-sm text-gray-500 mt-1">
            Documents and reference materials for this committee.
          </p>
        </div>
        {isStaff && (
          <button onClick={() => setShowUpload(true)}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
            + Upload Resource
          </button>
        )}
      </div>

      {/* Upload modal — staff only */}
      {showUpload && isStaff && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Upload Resource</h2>
              <button onClick={closeUpload} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpload} className="space-y-4">
                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{uploadError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input type="file" required onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.csv"
                    className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#e8eef7] file:text-[#1e3a6e] hover:file:bg-[#1e3a6e] hover:file:text-white file:transition-colors cursor-pointer" />
                  {selectedFile && (
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedFile.name} ({formatSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input type="text" name="name" required value={form.name} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select name="category" value={form.category} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={uploading || !selectedFile}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button type="button" onClick={closeUpload}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const count = cat.id === 'all' ? files.length : (categoryCounts[cat.id] ?? 0)
          if (cat.id !== 'all' && count === 0) return null
          return (
            <button key={cat.id} onClick={() => setFilter(cat.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                ${filter === cat.id ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {cat.label} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {/* Files */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(file => (
              <div key={file.id} className="px-6 py-4 flex items-center gap-4">
                <span className="text-2xl flex-shrink-0">
                  {FILE_ICONS[file.file_type?.toLowerCase()] ?? FILE_ICONS.default}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#b8963e] font-medium capitalize">
                      {CATEGORIES.find(c => c.id === file.category)?.label ?? file.category}
                    </span>
                    {file.file_size && (
                      <span className="text-xs text-gray-400">{formatSize(file.file_size)}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(file.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#1e3a6e] font-semibold hover:underline">
                    Download
                  </a>
                  {isStaff && (
                    <button onClick={() => deleteFile(file.id)}
                      className="text-xs text-red-400 font-semibold hover:underline">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">
            {filter === 'all'
              ? 'No resources uploaded yet.'
              : `No ${CATEGORIES.find(c => c.id === filter)?.label.toLowerCase()} resources.`}
          </p>
          {isStaff && filter === 'all' && (
            <button onClick={() => setShowUpload(true)}
              className="mt-3 text-sm text-[#1e3a6e] font-medium hover:underline">
              Upload the first resource
            </button>
          )}
        </div>
      )}
    </div>
  )
}