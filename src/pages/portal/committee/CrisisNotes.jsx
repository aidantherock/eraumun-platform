import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { useRealtime } from '../../../hooks/useRealtime'

export default function CrisisNotes() {
  const { committee, isStaff } = useOutletContext()
  const { profile } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replying, setReplying] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (committee?.id) fetchNotes()
  }, [committee?.id])

  useRealtime({
    channel: `crisis-notes-${committee?.id}`,
    event: '*',
    table: 'crisis_notes',
    filter: `committee_id=eq.${committee?.id}`,
    callback: () => fetchNotes(),
    deps: [committee?.id]
  })

  async function fetchNotes() {
    let query = supabase
      .from('crisis_notes')
      .select('*, profiles!crisis_notes_submitted_by_fkey(first_name, last_name), replied_profile:profiles!crisis_notes_replied_by_fkey(first_name, last_name)')
      .eq('committee_id', committee.id)
      .order('created_at', { ascending: false })

    if (!isStaff) {
      query = query.eq('submitted_by', profile.id)
    }

    const { data } = await query
    setNotes(data ?? [])
    setLoading(false)

    // Mark unread notes as read for staff
    if (isStaff) {
      const unreadIds = (data ?? [])
        .filter(n => !n.is_read)
        .map(n => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('crisis_notes')
          .update({ is_read: true })
          .in('id', unreadIds)
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)

    await supabase.from('crisis_notes').insert({
      committee_id: committee.id,
      submitted_by: profile.id,
      content: content.trim(),
    })

    setContent('')
    fetchNotes()
    setSubmitting(false)
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!replyContent.trim() || !replyingTo) return
    setReplying(true)

    await supabase.from('crisis_notes').update({
      reply: replyContent.trim(),
      replied_by: profile.id,
      replied_at: new Date().toISOString(),
    }).eq('id', replyingTo)

    setReplyingTo(null)
    setReplyContent('')
    fetchNotes()
    setReplying(false)
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return
    await supabase.from('crisis_notes').delete().eq('id', id)
    fetchNotes()
  }

  const filtered = notes.filter(n => {
    if (!isStaff) return true
    if (filter === 'unread') return !n.is_read
    if (filter === 'unreplied') return !n.reply
    if (filter === 'replied') return !!n.reply
    return true
  })

  const unreadCount = notes.filter(n => !n.is_read && isStaff).length
  const unrepliedCount = notes.filter(n => !n.reply).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Crisis Notes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff
              ? 'Private notes from delegates. Reply to respond directly.'
              : 'Send private notes to the crisis director. Your notes are confidential.'}
          </p>
        </div>
        {isStaff && unrepliedCount > 0 && (
          <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full">
            {unrepliedCount} unreplied
          </span>
        )}
      </div>

      {/* Delegate — compose note */}
      {!isStaff && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Send a Crisis Note</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Write your private note to the crisis director here. This is confidential and only visible to committee staff."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Your note is private and only visible to committee staff.</p>
              <button type="submit" disabled={submitting || !content.trim()}
                className="bg-[#1e3a6e] text-white font-semibold text-sm px-5 py-2 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                {submitting ? 'Sending...' : 'Send Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff filters */}
      {isStaff && (
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: `All (${notes.length})` },
            { id: 'unreplied', label: `Unreplied (${unrepliedCount})` },
            { id: 'replied', label: 'Replied' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
                ${filter === f.id ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(note => (
            <div key={note.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden
              ${!note.reply && isStaff ? 'border-yellow-200' : 'border-gray-200'}`}>
              <div className="p-5">
                {/* Note header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0">
                      {note.profiles?.first_name?.charAt(0)}{note.profiles?.last_name?.charAt(0)}
                    </div>
                    <div>
                      {isStaff && (
                        <p className="text-xs font-semibold text-gray-900">
                          {note.profiles?.first_name} {note.profiles?.last_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!note.reply && (
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Awaiting Reply
                      </span>
                    )}
                    {note.reply && (
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        Replied
                      </span>
                    )}
                    {isStaff && (
                      <button onClick={() => deleteNote(note.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium">
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Note content */}
                <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">
                  <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                </div>

                {/* Reply */}
                {note.reply && (
                  <div className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-lg px-4 py-3">
                    <p className="text-xs font-bold text-[#1e3a6e] mb-1">
                      Crisis Director
                      {note.replied_at && (
                        <span className="font-normal text-gray-400 ml-2">
                          {new Date(note.replied_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{note.reply}</p>
                  </div>
                )}

                {/* Staff reply form */}
                {isStaff && !note.reply && (
                  replyingTo === note.id ? (
                    <form onSubmit={handleReply} className="mt-3 space-y-2">
                      <textarea
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        required
                        rows={3}
                        placeholder="Write your reply to this delegate..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={replying || !replyContent.trim()}
                          className="text-xs bg-[#1e3a6e] text-white font-semibold px-4 py-2 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                          {replying ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button type="button"
                          onClick={() => { setReplyingTo(null); setReplyContent('') }}
                          className="text-xs border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded hover:border-gray-400 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => { setReplyingTo(note.id); setReplyContent('') }}
                      className="mt-3 text-xs text-[#1e3a6e] font-semibold border border-[#1e3a6e] px-4 py-2 rounded hover:bg-[#e8eef7] transition-colors"
                    >
                      Reply
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">
            {isStaff
              ? filter === 'all' ? 'No crisis notes yet.' : `No ${filter} notes.`
              : 'You haven\'t sent any crisis notes yet.'}
          </p>
        </div>
      )}
    </div>
  )
}