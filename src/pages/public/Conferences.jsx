import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Conferences() {
  const [conferences, setConferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteSubmitted, setInviteSubmitted] = useState(false)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteForm, setInviteForm] = useState({
    name: '', email: '', school: '', conference: '', date: '', location: '', message: ''
  })

  useEffect(() => {
    fetchConferences()
  }, [])

  async function fetchConferences() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_away_conference', true)
      .in('status', ['active', 'closed'])
      .order('start_date', { ascending: true })
    setConferences(data ?? [])
    setLoading(false)
  }

  function handleInviteChange(e) {
    const { name, value } = e.target
    setInviteForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleInviteSubmit(e) {
    e.preventDefault()
    setInviteSubmitting(true)
    setInviteError('')
    try {
      await fetch('/.netlify/functions/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  form_type: 'conference_invitation',
  name: inviteForm.name,
  email: inviteForm.email,
  subject: `Conference Invitation: ${inviteForm.conference}`,
  message: `
School/Organization: ${inviteForm.school}
Conference: ${inviteForm.conference}
Date: ${inviteForm.date}
Location: ${inviteForm.location}

${inviteForm.message}
  `.trim(),
})
      })
      setInviteSubmitted(true)
    } catch (err) {
      setInviteError('Something went wrong. Please try again or email us directly.')
    } finally {
      setInviteSubmitting(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Where We Compete</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
            Conferences <em className="italic text-[#d4af62]">&amp; Events</em>
          </h1>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-2xl">
            ERAU-MUN competes at Model United Nations conferences across the country. Below are the conferences we are attending and hosting.
          </p>
        </div>
      </section>

      {/* Away Conferences */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Intercollegiate</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              Upcoming <em className="italic text-[#1e3a6e]">Conferences</em>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse" />
              ))}
            </div>
          ) : conferences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[...conferences]
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                .map(conf => (
                <div key={conf.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <div className="bg-[#1e3a6e] px-5 py-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#d4af62] bg-[#b8963e]/20 px-2 py-0.5 rounded mb-2 inline-block">
                      {conf.status === 'active' ? 'Upcoming' : 'Past'}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-white mt-1">{conf.name}</h3>
                    {conf.location && (
                      <p className="text-xs text-white/55 mt-1">{conf.location}</p>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    {conf.start_date && (
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(conf.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {conf.end_date && conf.end_date !== conf.start_date && (
                          <> &mdash; {new Date(conf.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
                        )}
                      </p>
                    )}
                    {conf.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{conf.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Conference schedule coming soon. Check back for updates.</p>
            </div>
          )}
        </div>
      </section>

      {/* Conference Invitation CTA */}
<section className="px-6 py-12 bg-gray-50 border-t border-gray-200">
  <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
    <div>
      <p className="font-semibold text-gray-900">Want to invite ERAU-MUN to your conference?</p>
      <p className="text-sm text-gray-500 mt-0.5">We'd love to attend. Fill out a quick form and we'll get back to you.</p>
    </div>
    <button
      onClick={() => setShowInviteForm(true)}
      className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors flex-shrink-0"
    >
      Invite Us
    </button>
  </div>
</section>

{/* Invite Form Modal */}
{showInviteForm && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
        <h2 className="font-semibold text-gray-900">Invite ERAU-MUN to Your Conference</h2>
        <button onClick={() => { setShowInviteForm(false); setInviteSubmitted(false) }}
          className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
      </div>
      <div className="p-6">
        {inviteSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Thank you for reaching out!</p>
            <p className="text-sm text-gray-500">We'll review your invitation and get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input type="text" name="name" required value={inviteForm.name}
                  onChange={handleInviteChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                <input type="email" name="email" required value={inviteForm.email}
                  onChange={handleInviteChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School / Organization</label>
              <input type="text" name="school" required value={inviteForm.school}
                onChange={handleInviteChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conference Name</label>
              <input type="text" name="conference" required value={inviteForm.conference}
                onChange={handleInviteChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conference Date</label>
                <input type="date" name="date" value={inviteForm.date}
                  onChange={handleInviteChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={inviteForm.location}
                  onChange={handleInviteChange}
                  placeholder="City, State"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (optional)</label>
              <textarea name="message" value={inviteForm.message} onChange={handleInviteChange} rows={3}
                placeholder="Tell us more about your conference, committee offerings, registration fees, etc."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none" />
            </div>

            {inviteError && (
              <p className="text-sm text-red-500">{inviteError}</p>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={inviteSubmitting}
                className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                {inviteSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
              <button type="button" onClick={() => setShowInviteForm(false)}
                className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </div>
)}

      {/* Ernie Crisis */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#1e3a6e] to-[#162d58] rounded-xl p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Hosted by ERAU-MUN</p>
              <h2 className="font-serif text-3xl font-bold text-white mb-3 leading-snug">
                Ernie <em className="italic text-[#d4af62]">Crisis Simulation</em>
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-6 font-light">
                ERAU-MUN's signature crisis simulation event, open to individuals and teams from any school. Experience the intensity of high-stakes diplomatic decision-making in a fast-paced crisis environment.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/ernie-crisis"
                  className="bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors"
                >
                  Learn More
                </Link>
                <Link
                  to="/ernie-crisis#register"
                  className="border border-white/35 text-white font-semibold text-sm px-6 py-3 rounded hover:border-white/70 transition-colors"
                >
                  Register Now
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'Open', label: 'To All Schools' },
                { value: 'Teams', label: 'and Individuals' },
                { value: 'Live', label: 'Crisis Format' },
                { value: 'ERAU', label: 'Daytona Beach' },
              ].map(stat => (
                <div key={stat.label} className="border-l-2 border-[#b8963e] pl-3">
                  <p className="font-serif text-2xl text-[#d4af62] font-bold leading-none">{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest text-white/45 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}