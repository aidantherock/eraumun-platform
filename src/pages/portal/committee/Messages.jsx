import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

export default function CommitteeMessages() {
  const { committee } = useOutletContext()
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reported, setReported] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (committee?.id) fetchMembers()
  }, [committee?.id])

  useEffect(() => {
    if (selectedMember) fetchMessages()
  }, [selectedMember])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMembers() {
    const { data } = await supabase
      .from('committee_roles')
      .select('*, profiles(id, first_name, last_name, avatar_url)')
      .eq('committee_id', committee.id)
      .neq('user_id', profile.id)
    setMembers(data ?? [])
    setLoading(false)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('committee_id', committee.id)
      .or(`and(sender_id.eq.${profile.id},recipient_id.eq.${selectedMember.profiles.id}),and(sender_id.eq.${selectedMember.profiles.id},recipient_id.eq.${profile.id})`)
      .order('created_at')
    setMessages(data ?? [])

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('committee_id', committee.id)
      .eq('sender_id', selectedMember.profiles.id)
      .eq('recipient_id', profile.id)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedMember) return
    setSending(true)

    const { error } = await supabase.from('messages').insert({
      committee_id: committee.id,
      sender_id: profile.id,
      recipient_id: selectedMember.profiles.id,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage('')
      fetchMessages()
    }
    setSending(false)
  }

  async function reportMessage(messageId) {
    await supabase.from('messages').update({ is_reported: true }).eq('id', messageId)
    setReported(prev => [...prev, messageId])
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">Private messaging with committee members.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">

          {/* Member list */}
          <div className="w-64 border-r border-gray-100 flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Committee Members</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
              ) : members.length > 0 ? members.map(member => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors
                    ${selectedMember?.id === member.id ? 'bg-[#e8eef7]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0">
                    {member.profiles?.first_name?.charAt(0)}{member.profiles?.last_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.profiles?.first_name} {member.profiles?.last_name}
                    </p>
                    <p className="text-xs text-[#b8963e] font-semibold capitalize">{member.role.replace('_', ' ')}</p>
                  </div>
                </button>
              )) : (
                <div className="p-4 text-center text-sm text-gray-400">No other members.</div>
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col">
            {selectedMember ? (
              <>
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e]">
                    {selectedMember.profiles?.first_name?.charAt(0)}{selectedMember.profiles?.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedMember.profiles?.first_name} {selectedMember.profiles?.last_name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{selectedMember.role.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                  {messages.length > 0 ? messages.map(msg => {
                    const isMine = msg.sender_id === profile.id
                    const isReported = reported.includes(msg.id) || msg.is_reported
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-xs lg:max-w-md relative`}>
                          <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed
                            ${isMine
                              ? 'bg-[#1e3a6e] text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                            }`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <p className="text-xs text-gray-400">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {!isMine && !isReported && (
                              <button
                                onClick={() => reportMessage(msg.id)}
                                className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Report
                              </button>
                            )}
                            {isReported && (
                              <span className="text-xs text-red-400">Reported</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="px-5 py-3 border-t border-gray-100 flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-[#2d538f] transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">Select a member to start messaging.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}