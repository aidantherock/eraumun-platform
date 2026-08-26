const { Resend } = require('resend')
const { createClient } = require('@supabase/supabase-js')
const templates = require('./emails/templates')

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  'https://vtwogeznktkaqqvndduh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sendEmail({ to, subject, html }) {
  return resend.emails.send({
    from: 'ERAU-MUN <noreply@eraumun.com>',
    to,
    subject,
    html,
  })
}

// ── Flow 1: Event Reminder (24hrs before) ──────────────────────
async function eventReminders() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: events } = await supabase
    .from('events')
    .select('*, event_roles(*)')
    .eq('start_date', tomorrowStr)
    .eq('is_cancelled', false)

  if (!events?.length) return

  for (const event of events) {
    const { data: registrations } = await supabase
      .from('user_event_roles')
      .select('profiles(email, first_name), event_roles(event_id)')
      .eq('event_roles.event_id', event.id)
      .eq('approved', true)

    for (const reg of registrations ?? []) {
      const profile = reg.profiles
      if (!profile?.email) continue
      const template = templates.eventReminder({
        firstName: profile.first_name ?? 'there',
        eventName: event.name,
        eventDate: new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        eventTime: event.event_time ?? null,
        eventLocation: event.event_location ?? event.location ?? null,
        portalUrl: 'https://eraumun.com',
      })
      await sendEmail({ to: profile.email, ...template })
    }
  }
}

// ── Flow 2: Invite Expiry Warning (7 days before) ──────────────
async function inviteExpiryWarnings() {
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const dateStr = sevenDaysFromNow.toISOString().split('T')[0]

  const { data: invites } = await supabase
    .from('invite_tokens')
    .select('*')
    .is('accepted_at', null)
    .is('cancelled_at', null)
    .gte('expires_at', new Date().toISOString())
    .lte('expires_at', sevenDaysFromNow.toISOString())

  for (const invite of invites ?? []) {
    const daysLeft = Math.ceil((new Date(invite.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    const template = templates.inviteExpiring({
      email: invite.email,
      daysLeft,
      inviteUrl: `https://eraumun.com/invite/${invite.token}`,
    })
    await sendEmail({ to: invite.email, ...template })
  }
}

// ── Flow 3: Pending Approval Reminder (daily to Eboard) ────────
async function pendingApprovalReminder() {
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (!count || count === 0) return

  const { data: eboard } = await supabase
    .from('profiles')
    .select('email, user_roles(roles(level))')
    .eq('status', 'approved')

  const eboardMembers = (eboard ?? []).filter(p =>
    p.user_roles?.some(ur => (ur.roles?.level ?? 0) >= 80)
  )

  const template = templates.pendingApprovalReminder({
    count,
    portalUrl: 'https://eraumun.com',
  })

  for (const member of eboardMembers) {
    await sendEmail({ to: member.email, ...template })
  }
}

// ── Flow 4: Onboarding Day 3 ───────────────────────────────────
async function onboardingDay3() {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0]

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .eq('onboarding_complete', false)
    .gte('created_at', threeDaysAgo.toISOString())
    .lte('created_at', new Date(threeDaysAgo.getTime() + 86400000).toISOString())

  for (const user of users ?? []) {
    const template = templates.onboardingDay3({ firstName: user.first_name ?? 'there' })
    await sendEmail({ to: user.email, ...template })
  }
}

// ── Flow 5: Post-Conference Feedback ──────────────────────────
async function postConferenceFeedback() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: closedEvents } = await supabase
    .from('events')
    .select('*, event_roles(*)')
    .eq('end_date', yesterdayStr)
    .eq('status', 'closed')

  for (const event of closedEvents ?? []) {
    // Check if feedback already sent
    const { count: feedbackCount } = await supabase
      .from('post_conference_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)

    if (feedbackCount > 0) continue

    const { data: registrations } = await supabase
      .from('user_event_roles')
      .select('profiles(email, first_name), event_roles(event_id)')
      .eq('event_roles.event_id', event.id)
      .eq('approved', true)

    for (const reg of registrations ?? []) {
      const profile = reg.profiles
      if (!profile?.email) continue
      const template = templates.postConferenceFeedback({
        firstName: profile.first_name ?? 'there',
        eventName: event.name,
        feedbackUrl: `https://eraumun.com/portal/events`,
      })
      await sendEmail({ to: profile.email, ...template })
    }
  }
}

// ── Main handler ───────────────────────────────────────────────
exports.handler = async () => {
  console.log('Running scheduled email flows...')

  try {
    await Promise.allSettled([
      eventReminders(),
      inviteExpiryWarnings(),
      pendingApprovalReminder(),
      onboardingDay3(),
      postConferenceFeedback(),
    ])
    console.log('All flows completed.')
    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('Scheduled flows error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}