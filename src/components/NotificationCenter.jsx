import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const TYPE_ICONS = {
  new_user: '👤',
  role_assigned: '🎖',
  announcement: '📢',
  new_submission: '📄',
  submission_reply: '💬',
  new_message: '✉',
  vote_activated: '🗳',
  motion: '✋',
  motion_response: '✅',
  cosponsor_request: '🤝',
  cosponsor_response: '🤝',
  amendment: '✏',
  sharing_period: '📋',
  floor_change: '🎙',
  contact_form: '📬',
  ernie_crisis: '🏛',
  default: '🔔',
}

export default function NotificationCenter() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [filter, setFilter] = useState('all')
  const panelRef = useRef(null)

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications()
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        }, payload => {
          setNotifications(prev => [payload.new, ...prev])
          setUnread(prev => prev + 1)
        })
        .subscribe()
      return () => supabase.removeChannel(channel)
    }
  }, [profile?.id])

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setUnread(data?.filter(n => !n.is_read).length ?? 0)
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', profile.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  async function handleClick(notification) {
    if (!notification.is_read) await markRead(notification.id)
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.is_read)

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-xs text-[#1e3a6e] font-medium hover:underline">
                  Mark all read
                </button>
              )}
              <div className="flex gap-1">
                {['all', 'unread'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all capitalize
                      ${filter === f ? 'bg-[#1e3a6e] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {filtered.length > 0 ? filtered.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3
                  ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {TYPE_ICONS[notif.type] ?? TYPE_ICONS.default}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#1e3a6e] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </button>
            )) : (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-gray-400">
                  {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">{notifications.length} total notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}