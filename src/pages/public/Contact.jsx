<SEO
  title="Contact"
  description="Get in touch with ERAU Model United Nations."
  url="/contact"
/>

import { useState } from 'react'
import SEO from '../../components/SEO'

const FORM_TYPES = [
  { id: 'general', label: 'General Inquiry' },
  { id: 'membership', label: 'Membership Question' },
  { id: 'sponsorship', label: 'Sponsorship Inquiry' },
  { id: 'adopt_a_delegate', label: 'Adopt-a-Delegate' },
  { id: 'media_press', label: 'Media & Press' },
  { id: 'erniemun_conference', label: 'ErnieMUN / Conference Question' },
]

const FORM_FIELDS = {
  general: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'subject', label: 'Subject', type: 'text', required: true },
    { key: 'message', label: 'Message', type: 'textarea', required: true },
  ],
  membership: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'school', label: 'School / Year', type: 'text', required: true },
    { key: 'message', label: 'Your Question', type: 'textarea', required: true },
  ],
  sponsorship: [
    { key: 'name', label: 'Contact Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'school', label: 'Organization / Company', type: 'text', required: true },
    { key: 'subject', label: 'Sponsorship Interest', type: 'text', required: false },
    { key: 'message', label: 'Tell us about your interest', type: 'textarea', required: true },
  ],
  adopt_a_delegate: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'message', label: 'How would you like to help?', type: 'textarea', required: true },
  ],
  media_press: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'school', label: 'Publication / Organization', type: 'text', required: true },
    { key: 'message', label: 'Your Inquiry', type: 'textarea', required: true },
  ],
  erniemun_conference: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'school', label: 'School', type: 'text', required: true },
    { key: 'subject', label: 'Conference Name', type: 'text', required: false },
    { key: 'message', label: 'Your Question', type: 'textarea', required: true },
  ],
}

export default function Contact() {
  const [selectedType, setSelectedType] = useState(null)
  const [form, setForm] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleTypeSelect(type) {
    setSelectedType(type)
    setForm({})
    setSubmitted(false)
    setError('')
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
      const res = await fetch('/.netlify/functions/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_type: selectedType, ...form }),
      })

      if (!res.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again or email us directly.')
    } finally {
      setLoading(false)
    }
  }

  const fields = selectedType ? FORM_FIELDS[selectedType] : []

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Get in Touch</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            Contact <em className="italic text-[#d4af62]">ERAU-MUN</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-2xl">
            Have a question or want to get involved? Select a topic below and we will get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-3xl mx-auto">

          {/* Form Type Selector */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-4">What can we help you with?</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FORM_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all
                    ${selectedType === type.id
                      ? 'border-[#1e3a6e] bg-[#e8eef7] text-[#1e3a6e]'
                      : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e] hover:text-[#1e3a6e]'
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Form */}
          {selectedType && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-6">
                {FORM_TYPES.find(t => t.id === selectedType)?.label}
              </h3>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">&#10003;</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Message Sent</h4>
                  <p className="text-sm text-gray-500">
                    Thanks for reaching out. We will get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => { setSelectedType(null); setSubmitted(false) }}
                    className="mt-6 text-sm text-[#1e3a6e] font-medium hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  {fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.key}
                          required={field.required}
                          value={form[field.key] ?? ''}
                          onChange={handleChange}
                          rows={4}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
                        />
                      ) : (
                        <input
                          type={field.type}
                          name={field.key}
                          required={field.required}
                          value={form[field.key] ?? ''}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1e3a6e] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Direct contact */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 mb-1">Prefer to email us directly?</p>
            <p className="text-sm font-medium text-[#1e3a6e]">info@eraumun.com</p>
          </div>
        </div>
      </section>
    </div>
  )
}