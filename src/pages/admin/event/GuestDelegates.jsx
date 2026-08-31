import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import * as XLSX from 'xlsx'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  school: '',
  committeeId: '',
  assignment: '',
  delegateType: 'solo',
  delegationName: '',
  headDelegateId: '',
}

const TYPE_LABELS = {
  head: 'Head Delegate',
  member: 'Delegation Member',
  solo: 'Solo Delegate',
}

const TYPE_COLORS = {
  head: 'bg-[#fdf6e3] text-[#b8963e] border-[#b8963e]/30',
  member: 'bg-[#e8eef7] text-[#1e3a6e] border-[#1e3a6e]/20',
  solo: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function EventAdminGuestDelegates() {
  const { event } = useOutletContext()
  const { profile } = useAuth()
  const [delegates, setDelegates] = useState([])
  const [committees, setCommittees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [importRows, setImportRows] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const fileRef = useRef()

  const delegationMode = event?.delegation_mode ?? false

  useEffect(() => {
    if (event?.id) {
      fetchDelegates()
      fetchCommittees()
    }
  }, [event?.id])

  async function fetchDelegates() {
    const { data } = await supabase
      .from('guest_delegates')
      .select('*, committees(name)')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })
    setDelegates(data ?? [])
    setLoading(false)
  }

  async function fetchCommittees() {
    const { data } = await supabase
      .from('committees')
      .select('id, name, type')
      .eq('event_id', event.id)
      .order('name')
    setCommittees(data ?? [])
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function closeForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setError('')
  }

  const headDelegates = delegates.filter(d => d.delegate_type === 'head')

  const delegationsByName = delegates.reduce((acc, d) => {
    if (d.delegate_type === 'solo') return acc
    const key = d.delegation_name ?? 'Unaffiliated'
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  const soloDelegates = delegates.filter(d => d.delegate_type === 'solo')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/create-guest-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          school: form.school || null,
          eventId: event.id,
          committeeId: form.committeeId || null,
          assignment: form.assignment || null,
          createdBy: profile.id,
          delegateType: delegationMode ? form.delegateType : 'solo',
          delegationName: form.delegationName || null,
          headDelegateId: form.headDelegateId || null,
          isHeadDelegate: form.delegateType === 'head',
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create delegate')
      setSuccess(`Account created for ${form.firstName} ${form.lastName}. Login email sent.`)
      closeForm()
      fetchDelegates()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function removeDelegate(id, profileId) {
    if (!confirm('Remove this guest delegate? Their account will be deleted.')) return
    await fetch('/.netlify/functions/admin-get-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profileId })
    })
    await supabase.from('guest_delegates').delete().eq('id', id)
    fetchDelegates()
  }

  async function resendCredentials(delegate) {
    try {
      const res = await fetch('/.netlify/functions/create-guest-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: delegate.login_email,
          firstName: delegate.first_name,
          lastName: delegate.last_name,
          school: delegate.school,
          eventId: event.id,
          committeeId: delegate.committee_id,
          assignment: delegate.assignment,
          createdBy: profile.id,
          resend: true,
        })
      })
      if (res.ok) {
        setSuccess(`Credentials resent to ${delegate.login_email}`)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // ── XLSX Import ──────────────────────────────────────────────

  function downloadTemplate() {
    const headers = delegationMode
      ? ['first_name', 'last_name', 'email', 'school', 'delegate_type', 'delegation_name', 'committee_name', 'assignment']
      : ['first_name', 'last_name', 'email', 'school', 'committee_name', 'assignment']

    const example = delegationMode
      ? ['Jane', 'Smith', 'jane@school.edu', 'State University', 'head', 'State University', 'Security Council', 'United States']
      : ['Jane', 'Smith', 'jane@school.edu', 'State University', 'Security Council', 'United States']

    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Delegates')
    XLSX.writeFile(wb, 'guest-delegate-template.xlsx')
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

      const errors = []
      const validated = rows.map((row, i) => {
        const rowErrors = []
        if (!row.first_name) rowErrors.push('Missing first name')
        if (!row.last_name) rowErrors.push('Missing last name')
        if (!row.email || !row.email.includes('@')) rowErrors.push('Invalid email')
        if (delegationMode && row.delegate_type && !['head', 'member', 'solo'].includes(row.delegate_type)) {
          rowErrors.push('delegate_type must be head, member, or solo')
        }
        if (rowErrors.length > 0) errors.push({ row: i + 2, errors: rowErrors })
        return {
          ...row,
          delegate_type: delegationMode ? (row.delegate_type || 'solo') : 'solo',
          _errors: rowErrors,
          _valid: rowErrors.length === 0,
        }
      })

      setImportRows(validated)
      setImportErrors(errors)
    }
    reader.readAsBinaryString(file)
  }

  async function handleImport() {
    const validRows = importRows.filter(r => r._valid)
    if (!validRows.length) return
    setImporting(true)
    setImportProgress(0)

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      const committee = committees.find(c => c.name.toLowerCase() === (row.committee_name ?? '').toLowerCase())

      try {
        await fetch('/.netlify/functions/create-guest-delegate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            school: row.school || null,
            eventId: event.id,
            committeeId: committee?.id || null,
            assignment: row.assignment || null,
            createdBy: profile.id,
            delegateType: row.delegate_type,
            delegationName: row.delegation_name || null,
            isHeadDelegate: row.delegate_type === 'head',
          })
        })
      } catch (err) {
        console.error(`Failed to create delegate for ${row.email}:`, err)
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100))
    }

    setImporting(false)
    setShowImport(false)
    setImportRows([])
    setImportErrors([])
    if (fileRef.current) fileRef.current.value = ''
    setSuccess(`Imported ${validRows.length} delegate${validRows.length !== 1 ? 's' : ''} successfully.`)
    setTimeout(() => setSuccess(''), 5000)
    fetchDelegates()
  }

  // ── Filters ──────────────────────────────────────────────────

  const filtered = delegates.filter(d => {
    const matchesSearch = search === '' ||
      `${d.first_name} ${d.last_name} ${d.login_email}`.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' ||
      (filter === 'assigned' ? d.committee_id : !d.committee_id) ||
      filter === d.delegate_type
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Guest Delegates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create temporary accounts for outside delegates attending {event?.name}.
            {delegationMode && <span className="ml-2 text-xs font-bold text-[#b8963e] bg-[#fdf6e3] px-2 py-0.5 rounded-full">Delegation Mode</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="border border-[#1e3a6e] text-[#1e3a6e] font-semibold text-sm px-4 py-2 rounded hover:bg-[#e8eef7] transition-colors">
            Bulk Import
          </button>
          <button onClick={() => setShowForm(true)}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-4 py-2 rounded hover:bg-[#2d538f] transition-colors">
            + Add Delegate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Delegates', value: delegates.length },
          { label: 'Assigned', value: delegates.filter(d => d.committee_id).length },
          ...(delegationMode ? [
            { label: 'Delegations', value: Object.keys(delegationsByName).length },
            { label: 'Solo', value: soloDelegates.length },
          ] : [
            { label: 'Unassigned', value: delegates.filter(d => !d.committee_id).length },
          ])
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-bold font-serif text-[#1e3a6e]">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{success}</div>
      )}

      {/* Add delegate modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Add Guest Delegate</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Delegate type — only shown in delegation mode */}
                {delegationMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delegate Type</label>
                    <div className="flex gap-2">
                      {['head', 'member', 'solo'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, delegateType: t }))}
                          className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-all capitalize
                            ${form.delegateType === t ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}
                        >
                          {TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {form.delegateType === 'head' && 'Leads a school delegation. Can invite team members after setup.'}
                      {form.delegateType === 'member' && 'Part of an existing school delegation. Assign to a Head Delegate below.'}
                      {form.delegateType === 'solo' && 'Independent delegate not affiliated with a school delegation. Falls under staff for assignment.'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" name="firstName" required value={form.firstName} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" name="lastName" required value={form.lastName} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" name="email" required value={form.email} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    placeholder="delegate@school.edu" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School / Institution</label>
                  <input type="text" name="school" value={form.school} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                    placeholder="Their home institution" />
                </div>

                {/* Delegation fields — only in delegation mode */}
                {delegationMode && (form.delegateType === 'head' || form.delegateType === 'member') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delegation Name {form.delegateType === 'head' ? '(your school\'s team name)' : ''}
                    </label>
                    {form.delegateType === 'member' && headDelegates.length > 0 ? (
                      <select name="delegationName" value={form.delegationName} onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                        <option value="">Select delegation...</option>
                        {[...new Set(headDelegates.map(d => d.delegation_name).filter(Boolean))].map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" name="delegationName" value={form.delegationName} onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                        placeholder="e.g. State University Delegation" />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Committee (optional)</label>
                  <select name="committeeId" value={form.committeeId} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] bg-white">
                    <option value="">No committee assigned</option>
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {form.committeeId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignment (country, portfolio, etc.)</label>
                    <input type="text" name="assignment" value={form.assignment} onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                      placeholder="e.g. United States, Crisis Director" />
                  </div>
                )}

                <div className="bg-[#e8eef7] border border-[#1e3a6e]/20 rounded-lg p-3">
                  <p className="text-xs text-[#1e3a6e]">
                    A temporary account will be created and login credentials sent to the delegate's email.
                    {delegationMode && form.delegateType === 'head' && ' The Head Delegate will receive a special link to invite their team members.'}
                    {delegationMode && form.delegateType === 'solo' && ' This delegate will appear under staff assignment in the attendees view.'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={submitting}
                    className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create & Send Credentials'}
                  </button>
                  <button type="button" onClick={closeForm}
                    className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Bulk Import Delegates</h2>
              <button onClick={() => { setShowImport(false); setImportRows([]); setImportErrors([]) }}
                className="text-gray-400 hover:text-gray-600 text-lg">&#x2715;</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Download the template, fill it out, then upload it here.</p>
                <button onClick={downloadTemplate}
                  className="text-xs border border-[#1e3a6e] text-[#1e3a6e] font-semibold px-4 py-2 rounded hover:bg-[#e8eef7] transition-colors">
                  Download Template
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload XLSX File</label>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} ref={fileRef}
                  className="text-sm text-gray-600" />
              </div>

              {importRows.length > 0 && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{importRows.length} rows found</p>
                      {importErrors.length > 0 && (
                        <span className="text-xs font-bold text-red-500">{importErrors.length} row{importErrors.length !== 1 ? 's' : ''} with errors</span>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Name</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Email</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">School</th>
                            {delegationMode && <th className="px-3 py-2 text-left font-semibold text-gray-600">Type</th>}
                            {delegationMode && <th className="px-3 py-2 text-left font-semibold text-gray-600">Delegation</th>}
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Committee</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {importRows.map((row, i) => (
                            <tr key={i} className={row._valid ? '' : 'bg-red-50'}>
                              <td className="px-3 py-2">{row.first_name} {row.last_name}</td>
                              <td className="px-3 py-2 text-gray-500">{row.email}</td>
                              <td className="px-3 py-2 text-gray-500">{row.school}</td>
                              {delegationMode && <td className="px-3 py-2 capitalize">{row.delegate_type}</td>}
                              {delegationMode && <td className="px-3 py-2 text-gray-500">{row.delegation_name}</td>}
                              <td className="px-3 py-2 text-gray-500">{row.committee_name}</td>
                              <td className="px-3 py-2">
                                {row._valid ? (
                                  <span className="text-green-600 font-semibold">✓ Valid</span>
                                ) : (
                                  <span className="text-red-500 font-semibold" title={row._errors.join(', ')}>✗ {row._errors[0]}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {importing && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Importing...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#1e3a6e] h-2 rounded-full transition-all" style={{ width: `${importProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={handleImport} disabled={importing || importRows.filter(r => r._valid).length === 0}
                      className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
                      {importing ? 'Importing...' : `Import ${importRows.filter(r => r._valid).length} Valid Delegates`}
                    </button>
                    <button onClick={() => { setImportRows([]); setImportErrors([]); if (fileRef.current) fileRef.current.value = '' }}
                      className="border border-gray-200 text-gray-600 font-semibold text-sm px-6 py-2.5 rounded hover:border-gray-400 transition-colors">
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search delegates..."
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors w-64" />
        <div className="flex gap-2 flex-wrap">
          {['all', 'assigned', 'unassigned', ...(delegationMode ? ['head', 'member', 'solo'] : [])].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize
                ${filter === f ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]' : 'border-gray-200 text-gray-600 hover:border-[#1e3a6e]'}`}>
              {f === 'head' ? 'Head Delegates' : f === 'member' ? 'Members' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Delegates list — delegation mode shows grouped view */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : delegationMode && filter === 'all' && search === '' ? (
        <div className="space-y-6">
          {/* Delegations grouped */}
          {Object.entries(delegationsByName).map(([name, members]) => (
            <div key={name} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#1e3a6e] px-6 py-3 flex items-center justify-between">
                <p className="font-semibold text-white">{name}</p>
                <span className="text-xs text-white/50">{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {members.sort((a, b) => (a.delegate_type === 'head' ? -1 : 1)).map(delegate => (
                  <DelegateRow key={delegate.id} delegate={delegate} onResend={resendCredentials} onRemove={removeDelegate} showType />
                ))}
              </div>
            </div>
          ))}

          {/* Solo delegates */}
          {soloDelegates.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-700 px-6 py-3 flex items-center justify-between">
                <p className="font-semibold text-white">Unaffiliated / Solo Delegates</p>
                <span className="text-xs text-white/50">{soloDelegates.length} delegate{soloDelegates.length !== 1 ? 's' : ''} — staff assigned</span>
              </div>
              <div className="divide-y divide-gray-100">
                {soloDelegates.map(delegate => (
                  <DelegateRow key={delegate.id} delegate={delegate} onResend={resendCredentials} onRemove={removeDelegate} showType />
                ))}
              </div>
            </div>
          )}

          {delegates.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">No guest delegates yet. Add one to get started.</p>
            </div>
          )}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(delegate => (
              <DelegateRow key={delegate.id} delegate={delegate} onResend={resendCredentials} onRemove={removeDelegate} showType={delegationMode} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">
            {search || filter !== 'all' ? 'No delegates match your search.' : 'No guest delegates yet. Add one to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}

function DelegateRow({ delegate, onResend, onRemove, showType }) {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-full bg-[#e8eef7] border border-[#b8963e] flex items-center justify-center text-xs font-bold text-[#1e3a6e] flex-shrink-0">
        {delegate.first_name?.charAt(0)}{delegate.last_name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">
            {delegate.first_name} {delegate.last_name}
          </p>
          {showType && delegate.delegate_type && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[delegate.delegate_type]}`}>
              {TYPE_LABELS[delegate.delegate_type]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <p className="text-xs text-gray-400">{delegate.login_email}</p>
          {delegate.school && <p className="text-xs text-gray-400">{delegate.school}</p>}
          {delegate.committees?.name && (
            <span className="text-xs font-semibold text-[#b8963e]">{delegate.committees.name}</span>
          )}
          {delegate.assignment && (
            <span className="text-xs text-gray-500">— {delegate.assignment}</span>
          )}
          {!delegate.committee_id && (
            <span className="text-xs text-gray-400 italic">Unassigned</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={() => onResend(delegate)} className="text-xs text-[#1e3a6e] font-semibold hover:underline">
          Resend
        </button>
        <button onClick={() => onRemove(delegate.id, delegate.profile_id)} className="text-xs text-red-400 font-semibold hover:underline">
          Remove
        </button>
      </div>
    </div>
  )
}