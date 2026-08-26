import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function NewsPost() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, isApproved } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [slug])

  async function fetchPost() {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*, profiles(first_name, last_name)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    // Members only post — redirect to login if not authenticated
    if (data.visibility === 'members' && (!user || !isApproved)) {
      navigate('/login', { state: { from: { pathname: `/news/${slug}` } } })
      return
    }

    setPost(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">This post doesn't exist or has been removed.</p>
          <Link to="/news" className="text-sm text-[#1e3a6e] font-medium hover:underline">
            Back to News
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      {post.cover_image_url ? (
        <div className="h-64 md:h-80 relative overflow-hidden">
          <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a6e]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 py-8 max-w-4xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-2 block">
              {post.category}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af62] mb-3 block">
              {post.category}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      {/* Content */}
      <section className="px-6 py-12 bg-white">
        <div className="max-w-4xl mx-auto">

          {/* Meta */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-sm font-bold text-[#1e3a6e]">
              {post.profiles?.first_name?.charAt(0)}{post.profiles?.last_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {post.profiles?.first_name} {post.profiles?.last_name}
              </p>
              <p className="text-xs text-gray-400">
                {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                }) : ''}
              </p>
            </div>
            {post.visibility === 'members' && (
              <span className="ml-auto text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                Members Only
              </span>
            )}
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-8 font-light italic border-l-4 border-[#b8963e] pl-4">
              {post.excerpt}
            </p>
          )}

          {/* Body */}
          <div className="prose prose-gray max-w-none">
            {post.content.split('\n').map((paragraph, i) => (
              paragraph.trim() ? (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 text-base">
                  {paragraph}
                </p>
              ) : <br key={i} />
            ))}
          </div>

          {/* Back link */}
          <div className="mt-12 pt-6 border-t border-gray-100">
            <Link to="/news" className="text-sm text-[#1e3a6e] font-medium hover:underline">
              ← Back to News & Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}