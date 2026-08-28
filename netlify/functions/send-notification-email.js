const { Resend } = require('resend')
const { createClient } = require('@supabase/supabase-js')
const templates = require('./emails/templates')

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function sendEmail({ to, subject, html }) {
  console.log('Sending email to:', to, 'Subject:', subject)
  const result = await resend.emails.send({
    from: 'ERAU-MUN <noreply@eraumun.com>',
    to,
    subject,
    html,
  })
  console.log('Resend result:', JSON.stringify(result))
  return result
}

exports.handler = async (event) => {
  console.log('send-notification-email called:', event.httpMethod)
  console.log('Body:', event.body?.substring(0, 200))

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { type, data } = JSON.parse(event.body)
    console.log('Email type:', type, 'Data:', JSON.stringify(data))

    switch (type) {
      case 'welcome': {
        const { email, firstName } = data
        const template = templates.welcome({ firstName })
        await sendEmail({ to: email, ...template })
        break
      }

      case 'account_approved': {
        const { email, firstName } = data
        const template = templates.accountApproved({ firstName })
        await sendEmail({ to: email, ...template })
        break
      }

      case 'account_invited': {
        const { email, inviterName, roleName, token } = data
        const inviteUrl = `https://eraumun.com/invite/${token}`
        const template = templates.accountInvited({ inviterName, roleName, inviteUrl })
        await sendEmail({ to: email, ...template })
        break
      }

      case 'ernie_crisis_registration': {
        const { email, firstName, registrationType, teamName } = data
        const template = templates.ernieCrisisRegistration({ firstName, registrationType, teamName })
        await sendEmail({ to: email, ...template })
        break
      }

      case 'ernie_crisis_waitlisted': {
        const { email, firstName } = data
        const template = templates.ernieCrisisWaitlisted({ firstName })
        await sendEmail({ to: email, ...template })
        break
      }

      case 'ernie_crisis_confirmed': {
        const { email, firstName, eventDate, eventLocation } = data
        const template = templates.ernieCrisisConfirmed({ firstName, eventDate, eventLocation })
        await sendEmail({ to: email, ...template })
        break
      }

      case 'new_report': {
        const { formType, submittedBy, message, isAnonymous } = data
        const { data: eboard } = await supabase
          .from('profiles')
          .select('email, user_roles(roles(level))')
          .eq('status', 'approved')

        const eboardEmails = (eboard ?? [])
          .filter(p => p.user_roles?.some(ur => (ur.roles?.level ?? 0) >= 80))
          .map(p => p.email)

        const template = templates.newReport({ formType, submittedBy, message, isAnonymous })
        for (const adminEmail of eboardEmails) {
          await sendEmail({ to: adminEmail, ...template })
        }
        break
      }

      default:
        console.log('Unknown email type:', type)
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown email type: ${type}` }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('Email function error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
