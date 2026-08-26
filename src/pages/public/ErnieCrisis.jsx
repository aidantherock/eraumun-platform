import { useState } from 'react'

const INDIVIDUAL_FIELDS = [
  { key: 'first_name', label: 'First Name', type: 'text', required: true },
  { key: 'last_name', label: 'Last Name', type: 'text', required: true },
  { key: 'email', label: 'Email Address', type: 'email', required: true },
  { key: 'school', label: 'School / Institution', type: 'text', required: true },
  { key: 'experience_level', label: 'MUN Experience Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  { key: 'faculty_advisor_name', label: 'Faculty Advisor Name', type: 'text', required: false, note: 'Required for high school participants' },
  { key: 'faculty_advisor_email', label: 'Faculty Advisor Email', type: 'email', required: false },
  { key: 'additional_info', label: 'Anything else we should know?', type: 'textarea', required: false },
]

const TEAM_FIELDS = [
  { key: 'first_name', label: 'Team Lead First Name', type: 'text', required: true },
  { key: 'last_name', label: 'Team Lead Last Name', type: 'text', required: true },
  { key: 'email', label: 'Team Lead Email', type: 'email', required: true },
  { key: 'school', label: 'School / Institution', type: 'text', required: true },
  { key: 'team_name', label: 'Team Name', type: 'text', required: true },
  { key: 'team_size', label: 'Number of Team Members', type: 'number', required: true },
  { key: 'experience_level', label: 'Team Experience Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  { key: 'faculty_advisor_name', label: 'Faculty Advisor Name', type: 'text', required: false, note: 'Required for high school teams' },
  { key: 'faculty_advisor_email', label: 'Faculty Advisor Email', type: 'email', required: false },
  { key: 'additional_info', label: 'Anything else we should know?', type: 'textarea', required: false },
]

const STATS = [
  { value: 'Open', label: 'To All Schools' },
  { value: 'Teams', label: 'and Individuals' },
  { value: 'Live', label: 'Crisis Format' },
  { value: 'ERAU', label: 'Daytona Beach' },
]

const ABOUT_ITEMS = [
  { title: 'Open to Everyone', desc: 'No prior MUN experience required. The simulation is designed for all skill levels.' },
  { title: 'Individual and Team', desc: 'Register as an individual or bring a team. Both formats are fully supported.' },
  { title: 'Live Crisis Format', desc: 'Experience the intensity of a real crisis committee with live updates and evolving scenarios.' },
  { title: 'Competitive and Collaborative', desc: 'Work with and against other delegations to navigate the crisis and achieve your objectives.' },
]

function Field({ field, value, onChange }) {
  const base = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors'
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}{field.required && <span className="text-red-500"> *</span>}
        {field.note && <span className="text-xs text-gray-400 ml-1">({field.note})</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea name={field.key} required={field.required} value={value ?? ''} onChange={onChange} rows={3} className={base + ' resize-none'} />
      ) : field.type === 'select' ? (
        <select name={field.key} required={field.required} value={value ?? ''} onChange={onChange} className={base + ' bg-white'}>
          <option value="">Select...</option>
          {field.options.map(opt => <option key={opt} value={opt.toLowerCase()}>{opt}</option>)}
        </select>
      ) : (
        <input type={field.type} name={field.key} required={field.required} value={value ?? ''} onChange={onChange} className={base} />
      )}
    </div>
  )
}

export default function ErnieCrisis() {
  const [regType, setRegType] = useState(null)
  const [form, setForm] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/ernie-crisis-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_type: regType, ...form }),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields = regType === 'individual' ? INDIVIDUAL_FIELDS : TEAM_FIELDS

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1e3a6e] via-[#162d58] to-[#0f2040] text-white px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af62] mb-3">Hosted by ERAU-MUN</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
              Ernie <em className="italic text-[#d4af62]">Crisis Simulation</em>
            </h1>
            <p className="text-white/70 text-base leading-relaxed font-light mb-8">
              Experience the intensity of crisis committee diplomacy. Open to individuals and teams from any school.
            </p>
            <a href="#register" className="bg-[#d4af62] text-[#1e3a6e] font-semibold text-sm px-6 py-3 rounded hover:bg-[#e8c570] transition-colors inline-block">
              Register Now
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(stat => (
              <div key={stat.label} className="border-l-2 border-[#b8963e] pl-3">
                <p className="font-serif text-2xl text-[#d4af62] font-bold leading-none">{stat.value}</p>
                <p className="text-xs uppercase tracking-widest text-white/45 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">About the Event</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4 leading-snug">
              What is the <em className="italic text-[#1e3a6e]">Ernie Crisis Simulation?</em>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-4">
              The Ernie Crisis Simulation is ERAU-MUN's signature standalone event, designed to give participants a taste of crisis committee dynamics in a fast-paced, immersive environment.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-4">
              Participants take on roles within a rapidly evolving crisis scenario, making real-time decisions, drafting directives, and negotiating with other delegations under time pressure.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed font-light">
              Whether you are a seasoned MUN delegate or completely new to the experience, the Ernie Crisis Simulation is designed to be accessible, challenging, and unforgettable.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {ABOUT_ITEMS.map(item => (
              <div key={item.title} className="border-l-[3px] border-[#b8963e] pl-4 py-2 bg-gray-50 rounded-r">
                <h4 className="font-semibold text-sm text-[#1e3a6e] mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration */}
      <section id="register" className="px-6 py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b8963e] mb-2">Sign Up</p>
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              Register for <em className="italic text-[#1e3a6e]">Ernie Crisis</em>
            </h2>
          </div>

          {submitted ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
              <div className="text-5xl mb-4 text-green-500">&#10003;</div>
              <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Registration Received</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                Thank you for registering. We will be in touch with confirmation details shortly.
              </p>
            </div>
          ) : !regType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { id: 'individual', title: 'Individual', desc: 'Register as a solo participant. You will be placed into a delegation for the simulation.' },
                { id: 'team', title: 'Team', desc: 'Register a team of delegates. One person registers on behalf of the whole team.' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setRegType(type.id)}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-[#1e3a6e] hover:shadow-md transition-all"
                >
                  <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">{type.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{type.desc}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl font-bold text-gray-900">
                  {regType === 'individual' ? 'Individual' : 'Team'} Registration
                </h3>
                <button onClick={() => setRegType(null)} className="text-sm text-gray-400 hover:text-gray-600">
                  Change
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(field => (
                  <Field key={field.key} field={field} value={form[field.key]} onChange={handleChange} />
                ))}

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" name="age_confirmed" checked={form.age_confirmed ?? false} onChange={handleChange} required className="mt-0.5 accent-[#1e3a6e]" />
                    <span className="text-sm text-gray-600">I confirm that I am 13 years of age or older.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" name="tos_accepted" checked={form.tos_accepted ?? false} onChange={handleChange} required className="mt-0.5 accent-[#1e3a6e]" />
                    <span className="text-sm text-gray-600">I agree to the Terms of Service and Privacy Policy.</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a6e] text-white font-semibold text-sm py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}