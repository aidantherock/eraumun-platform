import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function PortalProfile() {
  const { profile, userRoles, refreshProfile } = useAuth()
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [awards, setAwards] = useState([])
  const [eventHistory, setEventHistory] = useState([])
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        school: profile.school ?? '',
        bio: profile.bio ?? '',
        twitter_url: profile.twitter_url ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        instagram_url: profile.instagram_url ?? '',
        website_url: profile.website_url ?? '',
        phone: profile.phone ?? '',
        show_contact_info: profile.show_contact_info ?? false,
      })
      fetchAwards()
      fetchEventHistory()
    }
  }, [profile])

  async function fetchAwards() {
    const { data } = await supabase
      .from('awards')
      .select('*')
      .eq('user_id', profile.id)
      .order('awarded_at', { ascending: false })
    setAwards(data ?? [])
  }

  async function fetchEventHistory() {
    const { data } = await supabase
      .from('user_event_roles')
      .select('*, event_roles(*, events(*))')
      .eq('user_id', profile.id)
    setEventHistory(data ?? [])
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)

    const { error: dbError } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', profile.id)

    if (dbError) {
      setError('Failed to save. Please try again.')
    } else {
      setSaved(true)
      await refreshProfile()
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, or WebP images are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    await refreshProfile()
    setUploading(false)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSaved(false)

    if (passwordForm.new.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (!/[0-9]/.test(passwordForm.new)) {
      setPasswordError('Password must contain at least one number.')
      return
    }
    if (!/[^a-zA-Z0-9]/.test(passwordForm.new)) {
      setPasswordError('Password must contain at least one special character.')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Passwords do not match.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
    if (error) {
      setPasswordError('Failed to update password. Please try again.')
    } else {
      setPasswordSaved(true)
      setPasswordForm({ current: '', new: '', confirm: '' })
      setTimeout(() => setPasswordSaved(false), 3000)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">

      <div>
        <h1 className="font-serif text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information and preferences.</p>
      </div>

      {/* Avatar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#e8eef7] border-2 border-[#b8963e] flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-2xl font-bold text-[#1e3a6e]">
                {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <label className="bg-[#1e3a6e] text-white text-sm font-semibold px-4 py-2 rounded cursor-pointer hover:bg-[#2d538f] transition-colors inline-block">
              {uploading ? 'Uploading...' : 'Upload Photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
            </label>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-5">Personal Information</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
        )}
        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">Profile saved successfully.</div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" name="first_name" value={form.first_name ?? ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" name="last_name" value={form.last_name ?? ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School / Institution</label>
            <input type="text" name="school" value={form.school ?? ''} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea name="bio" value={form.bio ?? ''} onChange={handleChange} rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors resize-none"
              placeholder="Tell us about yourself..." />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Social Media & Contact (Optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'twitter_url', label: 'Twitter / X URL' },
                { key: 'linkedin_url', label: 'LinkedIn URL' },
                { key: 'instagram_url', label: 'Instagram URL' },
                { key: 'website_url', label: 'Personal Website' },
                { key: 'phone', label: 'Phone Number' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input type="text" name={field.key} value={form[field.key] ?? ''} onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors" />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" name="show_contact_info" checked={form.show_contact_info ?? false} onChange={handleChange}
                className="accent-[#1e3a6e]" />
              <span className="text-sm text-gray-600">Show contact info on my public profile</span>
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Role info (read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Roles & Membership</h2>
        <div className="flex flex-wrap gap-2">
          {userRoles.length > 0 ? userRoles.map(role => (
            <span key={role.id} className="text-xs font-semibold bg-[#e8eef7] text-[#1e3a6e] px-3 py-1.5 rounded-full">
              {role.name}
            </span>
          )) : (
            <p className="text-sm text-gray-400">No roles assigned yet.</p>
          )}
        </div>
      </div>

      {/* Awards */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Awards</h2>
        {awards.length > 0 ? (
          <div className="flex flex-col divide-y divide-gray-100">
            {awards.map(award => (
              <div key={award.id} className="py-3">
                <p className="text-sm font-semibold text-gray-900">{award.title}</p>
                {award.description && <p className="text-xs text-gray-500 mt-0.5">{award.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(award.awarded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No awards yet.</p>
        )}
      </div>

      {/* Event history */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Event History</h2>
        {eventHistory.length > 0 ? (
          <div className="flex flex-col divide-y divide-gray-100">
            {eventHistory.map(item => (
              <div key={item.id} className="py-3">
                <p className="text-sm font-semibold text-gray-900">
                  {item.event_roles?.events?.name ?? 'Event'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.event_roles?.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.assigned_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No events registered yet.</p>
        )}
      </div>

      {/* Password change */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-5">Change Password</h2>
        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{passwordError}</div>
        )}
        {passwordSaved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">Password updated successfully.</div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: 'new', label: 'New Password' },
            { key: 'confirm', label: 'Confirm New Password' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type="password"
                value={passwordForm[field.key]}
                onChange={e => setPasswordForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a6e] transition-colors"
                placeholder="••••••••"
              />
            </div>
          ))}
          <button type="submit"
            className="bg-[#1e3a6e] text-white font-semibold text-sm px-6 py-2.5 rounded hover:bg-[#2d538f] transition-colors">
            Update Password
          </button>
        </form>
      </div>

    </div>
  )
}