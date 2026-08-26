import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES = ['News', 'Conference', 'Announcement', 'Achievement', 'Event', 'Other']

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: 'News',
  visibility: 'public',
  status: 'draft',
  cover_image_url: '',
  published_at: '',
}

export default function AdminNews() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('news_posts')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `news/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('news').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('news').getPublicUrl(path)
      setForm(prev => ({ ...prev, cover_image_url: publicUrl }))
    }
    setUploading(false)
  }

  function generateSlug(title) {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      ...form,
      slug: editing?.slug ?? generateSlug(form.title),
      created_by: profile.id,
      organization_id: profile.organization_id,
      published_at: form.status === 'published' ? (form.published_at || new Date().toISOString()) : null,
      cover_image_url: form.cover_image_url || null,
    }

    if (editing) {
      await supabase.from('news_posts').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('news_posts').insert(payload)
    }

    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    fetchPosts()
    setSubmitting(false)
  }

  function openEdit(post) {
    setEditing(post)
    setForm({
      title: post.title ?? '',
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      category: post.category ?? 'News',
      visibility: post.visibility ?? 'public',
      status: post.status ?? 'draft',
      cover_image_url: post.cover_image_url ?? '',
      published_at: post.published_at ?? '',
    })
    setShowForm(true)
  }

  async function publishPost(id) {
    await supabase.from('news_posts').update({
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', id)
    fetchPosts()
  }

  async function archivePost(id) {
    await supabase.from('news_posts').update({ status: 'archived' }).eq('id', id)
    fetchPosts()
  }

  async function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await supabase.from('news_posts').delete().eq('id', id)
    fetchPosts()
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  const STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-red-100 text-red-500',
  }

  const VISIBILITY_COLORS = {
    public: 'bg-blue-100 text-blue-700',
    members: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">News Posts</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage news posts for the public site and member portal.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM) }}
          className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors"
        >
          + New Post
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }}
                className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" name="title" required value={form.title} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                  <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2}
                    placeholder="Short summary shown in news cards..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea name="content" required value={form.content} onChange={handleChange} rows={10}
                    placeholder="Full post content..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none font-mono" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select name="category" value={form.category} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select name="visibility" value={form.visibility} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                      <option value="public">Public (visible on public site)</option>
                      <option value="members">Members Only (portal only)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={form.status} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date (optional)</label>
                    <input type="datetime-local" name="published_at" value={form.published_at} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload}
                    className="text-sm text-gray-600" />
                  {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                  {form.cover_image_url && (
                    <img src={form.cover_image_url} alt="Cover" className="mt-2 h-24 w-auto rounded object-cover" />
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Post'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }}
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
        {['all', 'draft', 'published', 'archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
              ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Posts list */}
      <div className="flex flex-col gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />)
        ) : filtered.length > 0 ? filtered.map(post => (
          <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.title}
                  className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status]}`}>
                        {post.status}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${VISIBILITY_COLORS[post.visibility]}`}>
                        {post.visibility}
                      </span>
                      {post.category && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {post.category}
                        </span>
                      )}
                    </div>
                    {post.excerpt && <p className="text-xs text-gray-500 line-clamp-1">{post.excerpt}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      By {post.profiles?.first_name} {post.profiles?.last_name}
                      {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {post.status === 'draft' && (
                      <button onClick={() => publishPost(post.id)}
                        className="text-xs text-green-600 border border-green-200 px-3 py-1.5 rounded hover:bg-green-50 transition-colors font-semibold">
                        Publish
                      </button>
                    )}
                    {post.status === 'published' && (
                      <button onClick={() => archivePost(post.id)}
                        className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors font-semibold">
                        Archive
                      </button>
                    )}
                    <button onClick={() => openEdit(post)}
                      className="text-xs bg-[#1e3a6e] text-white font-semibold px-3 py-1.5 rounded hover:bg-[#2d538f] transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deletePost(post.id)}
                      className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 transition-colors font-semibold">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">No posts yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}