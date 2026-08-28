const { Resend } = require('resend')
const { createClient } = require('@supabase/supabase-js')
const templates = require('./emails/templates')

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
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

async function alreadySentToday(flowKey, entityId = null) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action', flowKey)
    .gte('created_at', todayStart.toISOString())

  if (entityId) query = query.eq('entity_id', entityId)

  const { count } = await query
  return count > 0
}

async function logSent(flowKey, entityId = null) {
  const payload = {
    action: flowKey,
    entity_type: 'scheduled_flow',
    metadata: { sent_at: new Date().toISOString() },
  }
  if (entityId) payload.entity_id = entityId
  await supabase.from('audit_logs').insert(payload)
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
      .select('user_id, profiles(email, first_name), event_roles(event_id)')
      .eq('event_roles.event_id', event.id)
      .eq('approved', true)

    for (const reg of registrations ?? []) {
      const profile = reg.profiles
      if (!profile?.email) continue

      const flowKey = `event_reminder:${event.id}`
      if (await alreadySentToday(flowKey, reg.user_id)) continue

      const template = templates.eventReminder({
        firstName: profile.first_name ?? 'there',
        eventName: event.name,
        eventDate: new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        }),
        eventTime: event.event_time ?? null,
        eventLocation: event.event_location ?? event.location ?? null,
        portalUrl: 'https://eraumun.com',
      })
      await sendEmail({ to: profile.email, ...template })
      await logSent(flowKey, reg.user_id)
    }
  }
}

// ── Flow 2: Invite Expiry Warning (7 days before) ──────────────
async function inviteExpiryWarnings() {
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const { data: invites } = await supabase
    .from('invite_tokens')
    .select('*')
    .is('accepted_at', null)
    .is('cancelled_at', null)
    .gte('expires_at', new Date().toISOString())
    .lte('expires_at', sevenDaysFromNow.toISOString())

  for (const invite of invites ?? []) {
    const flowKey = `invite_expiry:${invite.id}`
    if (await alreadySentToday(flowKey)) continue

    const daysLeft = Math.ceil(
      (new Date(invite.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
    )
    const template = templates.inviteExpiring({
      email: invite.email,
      daysLeft,
      inviteUrl: `https://eraumun.com/invite/${invite.token}`,
    })
    await sendEmail({ to: invite.email, ...template })
    await logSent(flowKey)
  }
}

// ── Flow 3: Pending Approval Reminder (daily to Eboard) ────────
async function pendingApprovalReminder() {
  if (await alreadySentToday('pending_approval_reminder')) return

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

  await logSent('pending_approval_reminder')
}

// ── Flow 4: Onboarding Day 3 ───────────────────────────────────
async function onboardingDay3() {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .eq('onboarding_complete', false)
    .gte('created_at', threeDaysAgo.toISOString())
    .lte('created_at', new Date(threeDaysAgo.getTime() + 86400000).toISOString())

  for (const user of users ?? []) {
    if (await alreadySentToday('onboarding_day3', user.id)) continue

    const template = templates.onboardingDay3({
      firstName: user.first_name ?? 'there'
    })
    await sendEmail({ to: user.email, ...template })
    await logSent('onboarding_day3', user.id)
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
    const flowKey = `post_conference_feedback:${event.id}`
    if (await alreadySentToday(flowKey)) continue

    const { data: registrations } = await supabase
      .from('user_event_roles')
      .select('user_id, profiles(email, first_name), event_roles(event_id)')
      .eq('event_roles.event_id', event.id)
      .eq('approved', true)

    for (const reg of registrations ?? []) {
      const profile = reg.profiles
      if (!profile?.email) continue

      const template = templates.postConferenceFeedback({
        firstName: profile.first_name ?? 'there',
        eventName: event.name,
        feedbackUrl: 'https://eraumun.com/portal/events',
      })
      await sendEmail({ to: profile.email, ...template })
    }

    await logSent(flowKey)
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

