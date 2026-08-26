import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function EventChecklist() {
  const { eventId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [template, setTemplate] = useState(null)
  const [items, setItems] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId && profile?.id) fetchAll()
  }, [eventId, profile?.id])

  async function fetchAll() {
    const { data: eventData } = await supabase
      .from('events')
      .select('name')
      .eq('id', eventId)
      .single()
    setEvent(eventData)

    const { data: tmpl } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_published', true)
      .single()

    if (!tmpl) { setLoading(false); return }
    setTemplate(tmpl)

    const { data: itemData } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('template_id', tmpl.id)
      .eq('is_active', true)
      .order('position')
    setItems(itemData ?? [])

    if (itemData?.length) {
      const { data: comp } = await supabase
        .from('checklist_completions')
        .select('item_id')
        .eq('user_id', profile.id)
        .in('item_id', itemData.map(i => i.id))
      setCompletions(comp?.map(c => c.item_id) ?? [])
    }

    setLoading(false)
  }

  async function toggleCompletion(itemId) {
    const isCompleted = completions.includes(itemId)
    if (isCompleted) {
      await supabase.from('checklist_completions')
        .delete()
        .eq('item_id', itemId)
        .eq('user_id', profile.id)
      setCompletions(prev => prev.filter(id => id !== itemId))
    } else {
      await supabase.from('checklist_completions')
        .insert({ item_id: itemId, user_id: profile.id })
      setCompletions(prev => [...prev, itemId])
    }
  }

  const completedCount = completions.length
  const totalItems = items.length
  const requiredItems = items.filter(i => i.is_required)
  const completedRequired = requiredItems.filter(i => completions.includes(i.id)).length
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0
  const allRequiredDone = completedRequired === requiredItems.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => navigate(`/portal/events/${eventId}`)}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
          &#8592; Back to Event
        </button>
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">No checklist available for this event yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(`/portal/events/${eventId}`)}
        className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
        &#8592; Back to {event?.name}
      </button>

      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Pre-Conference Checklist</h1>
        <p className="text-sm text-gray-500 mt-1">{event?.name}</p>
      </div>

      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {completedCount} of {totalItems} completed
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedRequired} of {requiredItems.length} required items done
            </p>
          </div>
          <span className={`text-lg font-bold font-serif ${progress === 100 ? 'text-green-600' : 'text-[#1e3a6e]'}`}>
            {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-[#1e3a6e]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {allRequiredDone && requiredItems.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-green-600">
            <span className="text-lg">✅</span>
            <p className="text-sm font-semibold">All required items completed!</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {items.map(item => {
            const isCompleted = completions.includes(item.id)
            return (
              <button
                key={item.id}
                onClick={() => toggleCompletion(item.id)}
                className={`w-full px-6 py-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors
                  ${isCompleted ? 'bg-green-50/50' : ''}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                  ${isCompleted
                    ? 'bg-green-500 border-green-500'
                    : item.is_required
                    ? 'border-[#1e3a6e]'
                    : 'border-gray-300'}`}>
                  {isCompleted && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.label}
                    </p>
                    {item.is_required && !isCompleted && (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                    )}
                  </div>
                  {item.description && (
                    <p className={`text-xs leading-relaxed mt-0.5 ${isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                      {item.description}
                    </p>
                  )}
                  {item.due_date && !isCompleted && (
                    <p className="text-xs text-[#b8963e] font-medium mt-1">
                      Due: {new Date(item.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Your progress is saved automatically. Click any item to mark it complete.
      </p>
    </div>
  )
}