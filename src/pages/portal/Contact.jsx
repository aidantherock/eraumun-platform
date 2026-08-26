import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const FORM_TYPES = [
  { id: 'general', label: 'General Inquiry', desc: 'General questions or messages to the executive board.' },
  { id: 'report', label: 'Report', desc: 'Report a concern, incident, or code of conduct violation.' },
  { id: 'suggestion', label: 'Suggestion / Feedback', desc: 'Share ideas or feedback to help improve ERAU-MUN.' },
  { id: 'tech_support', label: 'Tech Support', desc: 'Report a bug or technical issue with the platform.' },
]

export default function PortalContact() {
  const { profile } = useAuth()
  const [selectedType, setSelectedType] = useState(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleTypeSelect(type) {
    setSelectedType(type)
    setForm({ subject: '', message: '' })
    setSubmitted(false)
    setError('')
    setIsAnonymous(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: dbError } = await supabase
        .from('portal_contact_forms')
        .insert({
          form_type: selectedType,
          submitted_by: isAnonymous ? null : profile?.id,
          is_anonymous: isAnonymous,
          subject: form.subject || null,
          message: form.message,
        })

      if (dbError) throw dbError
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">

      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">Contact</h1>
        <p className="text-sm text-gray-500 mt-1">Reach out to the ERAU-MUN executive board.</p>
      </div>

      {/* Form type selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FORM_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => handleTypeSelect(type.id)}
            className={`p-4 rounded-xl border text-left transition-all
              ${selectedType === type.id
                ? 'border-[#1e3a6e] bg-[#e8eef7]'
                : 'border-gray-200 bg-white hover:border-[#1e3a6e]'
              }`}
          >
            <p className={`text-sm font-semibold mb-1 ${selectedType === type.id ? 'text-[#1e3a6e]' : 'text-gray-900'}`}>
              {type.label}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">{type.desc}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      {selectedType && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">
            {FORM_TYPES.find(t => t.id === selectedType)?.label}
          </h3>

          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3 text-green-500">&#10003;</div>
              <h4 className="font-semibold text-gray-900 mb-2">Message Sent</h4>
              <p className="text-sm text-gray-500">Your message has been received by the executive board.</p>
              <button
                onClick={() => { setSelectedType(null); setSubmitted(false) }}
                className="mt-5 text-sm text-[#1e3a6e] font-medium hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
              )}

              {/* Anonymous option for reports */}
              {selectedType === 'report' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      className="mt-0.5 accent-[#1e3a6e]"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submit anonymously</p>
                      <p className="text-xs text-gray-500 mt-0.5">Your identity will not be attached to this report.</p>
                    </div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                  placeholder="Brief summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
                  placeholder="Write your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e3a6e] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}