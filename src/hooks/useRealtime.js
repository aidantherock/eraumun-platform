import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useRealtime — swappable real-time abstraction layer
 *
 * Currently wraps Supabase channels.
 * To swap to a custom WebSocket server, socket.io, Ably, etc.,
 * replace the implementation inside this hook only.
 * All components using this hook require zero changes.
 *
 * @param {string} channel - Channel name
 * @param {string} event - Event to listen for (INSERT, UPDATE, DELETE, or custom)
 * @param {string} table - Supabase table name
 * @param {string|null} filter - Optional Supabase filter string e.g. 'committee_id=eq.123'
 * @param {function} callback - Called with payload when event fires
 * @param {Array} deps - Dependency array to re-subscribe when values change
 */
export function useRealtime({ channel, event, table, filter, callback, deps = [] }) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!channel || !table) return

    const channelConfig = {
      event: event ?? '*',
      schema: 'public',
      table,
    }

    if (filter) channelConfig.filter = filter

    const sub = supabase
      .channel(channel)
      .on('postgres_changes', channelConfig, (payload) => {
        callbackRef.current(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [channel, table, filter, ...deps])
}

/**
 * useRealtimePresence — track who is online in a channel
 * Useful for conference mode showing active delegates
 */
export function useRealtimePresence({ channel, userInfo, onSync }) {
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync

  useEffect(() => {
    if (!channel || !userInfo) return

    const sub = supabase.channel(channel, {
      config: { presence: { key: userInfo.id } }
    })

    sub
      .on('presence', { event: 'sync' }, () => {
        const state = sub.presenceState()
        onSyncRef.current?.(state)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await sub.track(userInfo)
        }
      })

    return () => {
      supabase.removeChannel(sub)
    }
  }, [channel, userInfo?.id])
}

/**
 * useRealtimeBroadcast — send and receive broadcast messages
 * Used for crisis injects, floor announcements, etc.
 */
export function useRealtimeBroadcast({ channel, event, onMessage }) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const channelRef = useRef(null)

  useEffect(() => {
    if (!channel) return

    const sub = supabase.channel(channel)
      .on('broadcast', { event }, (payload) => {
        onMessageRef.current?.(payload)
      })
      .subscribe()

    channelRef.current = sub

    return () => {
      supabase.removeChannel(sub)
      channelRef.current = null
    }
  }, [channel, event])

  async function broadcast(payload) {
    if (!channelRef.current) return
    await channelRef.current.send({
      type: 'broadcast',
      event,
      payload,
    })
  }

  return { broadcast }
}