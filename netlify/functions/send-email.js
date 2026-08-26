const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail({ to, subject, html, replyTo }) {
  return resend.emails.send({
    from: 'ERAU-MUN <noreply@eraumun.com>',
    to,
    subject,
    html,
    reply_to: replyTo,
  })
}

module.exports = { sendEmail }