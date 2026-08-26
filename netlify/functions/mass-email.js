const { Resend } = require('resend')
const { createClient } = require('@supabase/supabase-js')
const templates = require('./emails/templates')

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  'https://vtwogeznktkaqqvndduh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { subject, content, target, roleSlug, eventId, senderName, senderId } = JSON.parse(event.body)

    if (!subject || !content || !target) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    // Verify sender is eboard+
    const { data: sender } = await supabase
      .from('user_roles')
      .select('roles(level)')
      .eq('user_id', senderId)

    const maxLevel = Math.max(...(sender?.map(s => s.roles?.level ?? 0) ?? [0]))
    if (maxLevel < 80) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    // Get recipients based on target
    let recipients = []

    if (target === 'all') {
      const { data } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('status', 'approved')
      recipients = data ?? []

    } else if (target === 'role' && roleSlug) {
      const { data } = await supabase
        .from('profiles')
        .select('email, first_name, user_roles(roles(slug))')
        .eq('status', 'approved')
      recipients = (data ?? []).filter(p =>
        p.user_roles?.some(ur => ur.roles?.slug === roleSlug)
      )

    } else if (target === 'event' && eventId) {
      const { data } = await supabase
        .from('user_event_roles')
        .select('profiles(email, first_name), event_roles(event_id)')
        .eq('event_roles.event_id', eventId)
      recipients = (data ?? []).map(d => d.profiles).filter(Boolean)

    } else if (target === 'eboard') {
      const { data } = await supabase
        .from('profiles')
        .select('email, first_name, user_roles(roles(level))')
        .eq('status', 'approved')
      recipients = (data ?? []).filter(p =>
        p.user_roles?.some(ur => (ur.roles?.level ?? 0) >= 80)
      )
    }

    if (recipients.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ success: true, sent: 0 }) }
    }

    // Send emails in batches of 10
    const template = templates.massEmail({ subject, content, senderName })
    const batchSize = 10
    let sent = 0

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      await Promise.all(batch.map(recipient =>
        resend.emails.send({
          from: 'ERAU-MUN <noreply@eraumun.com>',
          to: recipient.email,
          subject: template.subject,
          html: template.html,
        })
      ))
      sent += batch.length
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      performed_by: senderId,
      action: `mass_email_sent`,
      entity_type: 'email',
      metadata: { subject, target, roleSlug, eventId, sent },
    })

    return { statusCode: 200, body: JSON.stringify({ success: true, sent }) }
  } catch (err) {
    console.error('Mass email error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}