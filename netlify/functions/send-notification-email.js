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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { type, data } = JSON.parse(event.body)

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
        // Notify all eboard members
        const { formType, submittedBy, message, isAnonymous } = data
        const { data: eboard } = await supabase
          .from('profiles')
          .select('email')
          .in('id', supabase.from('user_roles').select('user_id').gte('roles.level', 80))

        const template = templates.newReport({ formType, submittedBy, message, isAnonymous })
        for (const member of eboard ?? []) {
          await sendEmail({ to: member.email, ...template })
        }
        break
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown email type: ${type}` }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('Email error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}