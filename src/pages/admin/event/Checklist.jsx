import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'

const BASE_ITEMS = [
  { label: 'Register on host conference website', description: 'Complete your official registration through the hosting school\'s conference portal.', is_required: true },
  { label: 'Submit position paper', description: 'Research and submit your position paper by the deadline.', is_required: true },
  { label: 'Book hotel accommodations', description: 'Reserve your hotel room at the conference hotel or nearby.', is_required: false },
  { label: 'Arrange travel to conference', description: 'Book flights, trains, or coordinate carpooling with teammates.', is_required: false },
  { label: 'Review rules of procedure', description: 'Study the rules of procedure for this conference.', is_required: true },
  { label: 'Pay conference fees', description: 'Ensure all conference fees have been paid.', is_required: false },
  { label: 'Complete delegate background research', description: 'Research your assigned country or portfolio\'s position on committee topics.', is_required: true },
  { label: 'Attend pre-conference training session', description: 'Attend the ERAU-MUN pre-conference training and preparation session.', is_required: false },
]

export default function EventAdminChecklist() {
  const { event } = useOutletContext()
  const { profile } = useAuth()
  const [template, setTemplate] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newItem, setNewItem] = useState({ label: '', description: '', is_required: true })
  const [completionStats, setCompletionStats] = useState({})

  useEffect(() => {
    if (event?.id) fetchChecklist()
  }, [event?.id])

  async function fetchChecklist() {
    const { data: tmpl } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('event_id', event.id)
      .single()

    if (tmpl) {
      setTemplate(tmpl)
      const { data: itemData } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('template_id', tmpl.id)
        .order('position')
      setItems(itemData ?? [])
      fetchCompletionStats(itemData ?? [])
    }
    setLoading(false)
  }

  async function fetchCompletionStats(itemList) {
    if (!itemList.length) return
    const { data } = await supabase
      .from('checklist_completions')
      .select('item_id')
      .in('item_id', itemList.map(i => i.id))
    const stats = {}
    for (const c of data ?? []) {
      stats[c.item_id] = (stats[c.item_id] ?? 0) + 1
    }
    setCompletionStats(stats)
  }

  async function createTemplate() {
    setSaving(true)
    const { data: tmpl } = await supabase
      .from('checklist_templates')
      .insert({
        event_id: event.id,
        title: `${event.name} Checklist`,
        created_by: profile.id,
        organization_id: profile.organization_id,
        is_published: false,
      })
      .select()
      .single()

    if (tmpl) {
      setTemplate(tmpl)
      // Insert base items
      const baseItemsData = BASE_ITEMS.map((item, idx) => ({
        template_id: tmpl.id,
        label: item.label,
        description: item.description,
        is_required: item.is_required,
        is_active: true,
        position: idx + 1,
      }))
      const { data: insertedItems } = await supabase
        .from('checklist_items')
        .insert(baseItemsData)
        .select()
      setItems(insertedItems ?? [])
    }
    setSaving(false)
  }

  async function togglePublish() {
    const { data } = await supabase
      .from('checklist_templates')
      .update({ is_published: !template.is_published })
      .eq('id', template.id)
      .select()
      .single()
    setTemplate(data)
  }

  async function addItem(e) {
    e.preventDefault()
    if (!newItem.label.trim()) return
    setSaving(true)
    const maxPos = items.length > 0 ? Math.max(...items.map(i => i.position)) : 0
    const { data } = await supabase
      .from('checklist_items')
      .insert({
        template_id: template.id,
        label: newItem.label.trim(),
        description: newItem.description || null,
        is_required: newItem.is_required,
        is_active: true,
        position: maxPos + 1,
      })
      .select()
      .single()
    setItems(prev => [...prev, data])
    setNewItem({ label: '', description: '', is_required: true })
    setShowAddForm(false)
    setSaving(false)
  }

  async function updateItem(id, updates) {
    await supabase.from('checklist_items').update(updates).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
    setEditingId(null)
  }

  async function toggleActive(id, current) {
    await supabase.from('checklist_items').update({ is_active: !current }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i))
  }

  async function deleteItem(id) {
    if (!confirm('Delete this checklist item?')) return
    await supabase.from('checklist_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function moveItem(id, direction) {
    const idx = items.findIndex(i => i.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === items.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newItems = [...items]
    const temp = newItems[idx]
    newItems[idx] = newItems[swapIdx]
    newItems[swapIdx] = temp

    const updates = newItems.map((item, i) => ({ id: item.id, position: i + 1 }))
    setItems(newItems.map((item, i) => ({ ...item, position: i + 1 })))

    for (const update of updates) {
      await supabase.from('checklist_items').update({ position: update.position }).eq('id', update.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a6e]" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Pre-Conference Checklist</h1>
          <p className="text-sm text-gray-500 mt-1">Create a checklist for delegates to complete before the conference.</p>
        </div>
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm mb-4">No checklist created yet.</p>
          <button onClick={createTemplate} disabled={saving}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Checklist'}
          </button>
          <p className="text-xs text-gray-400 mt-3">Starts with 8 common pre-conference items you can customize.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Pre-Conference Checklist</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} items · {items.filter(i => i.is_required).length} required</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddForm(true)}
            className="border border-[#1e3a6e] text-[#1e3a6e] font-semibold text-sm px-4 py-2 rounded hover:bg-[#e8eef7] transition-colors">
            + Add Item
          </button>
          <button onClick={togglePublish}
            className={`font-semibold text-sm px-4 py-2 rounded transition-colors
              ${template.is_published
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-[#1e3a6e] text-white hover:bg-[#2d538f]'}`}>
            {template.is_published ? 'Unpublish' : 'Publish to Delegates'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl px-5 py-3 flex items-center justify-between
        ${template.is_published ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${template.is_published ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <p className="text-sm font-semibold text-gray-900">
            {template.is_published ? 'Published — visible to all event attendees' : 'Draft — not yet visible to delegates'}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          {Object.keys(completionStats).length > 0
            ? `${Object.keys(completionStats).length} completions recorded`
            : 'No completions yet'}
        </p>
      </div>

      {/* Add item form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Add Custom Item</h3>
          <form onSubmit={addItem} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Label</label>
              <input type="text" required value={newItem.label}
                onChange={e => setNewItem(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g. Submit dietary restrictions form"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input type="text" value={newItem.description}
                onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this item"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newItem.is_required}
                onChange={e => setNewItem(prev => ({ ...prev, is_required: e.target.checked }))}
                className="accent-[#1e3a6e]" />
              <span className="text-sm text-gray-600">Required item</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-[#1e3a6e] text-white font-semibold text-sm px-5 py-2 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                Add Item
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="border border-gray-200 text-gray-600 font-semibold text-sm px-5 py-2 rounded hover:border-gray-400 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {items.map((item, idx) => (
            <div key={item.id} className={`px-6 py-4 ${!item.is_active ? 'opacity-50' : ''}`}>
              {editingId === item.id ? (
                <EditItemForm
                  item={item}
                  onSave={(updates) => updateItem(item.id, updates)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                    <button onClick={() => moveItem(item.id, 'up')} disabled={idx === 0}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-xs leading-none">▲</button>
                    <button onClick={() => moveItem(item.id, 'down')} disabled={idx === items.length - 1}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-xs leading-none">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      {item.is_required && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>
                      )}
                      {!item.is_active && (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Hidden</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                    )}
                    {item.due_date && (
                      <p className="text-xs text-[#b8963e] mt-0.5 font-medium">
                        Due: {new Date(item.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {completionStats[item.id] > 0 && (
                      <p className="text-xs text-green-600 mt-0.5">{completionStats[item.id]} completion{completionStats[item.id] !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setEditingId(item.id)}
                      className="text-xs text-[#1e3a6e] font-semibold hover:underline">Edit</button>
                    <button onClick={() => toggleActive(item.id, item.is_active)}
                      className="text-xs text-gray-400 font-semibold hover:underline">
                      {item.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-xs text-red-400 font-semibold hover:underline">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    label: item.label ?? '',
    description: item.description ?? '',
    due_date: item.due_date ?? '',
    is_required: item.is_required ?? true,
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSave(e) {
    e.preventDefault()
    onSave({
      label: form.label.trim(),
      description: form.description || null,
      due_date: form.due_date || null,
      is_required: form.is_required,
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 bg-gray-50 rounded-lg p-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
        <input type="text" name="label" required value={form.label} onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <input type="text" name="description" value={form.description} onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Due Date (optional)</label>
        <input type="date" name="due_date" value={form.due_date} onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="is_required" checked={form.is_required} onChange={handleChange}
          className="accent-[#1e3a6e]" />
        <span className="text-xs text-gray-600">Required</span>
      </label>
      <div className="flex gap-2">
        <button type="submit"
          className="text-xs bg-[#1e3a6e] text-white font-semibold px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
          Save
        </button>
        <button type="button" onClick={onCancel}
          className="text-xs border border-gray-200 text-gray-600 font-semibold px-4 py-2 rounded hover:border-gray-400 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}