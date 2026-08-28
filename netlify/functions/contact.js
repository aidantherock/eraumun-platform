const { createClient } = require('@supabase/supabase-js')
const { sendEmail } = require('./send-email')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FORM_LABELS = {
  general: 'General Inquiry',
  membership: 'Membership Question',
  sponsorship: 'Sponsorship Inquiry',
  adopt_a_delegate: 'Adopt-a-Delegate',
  media_press: 'Media & Press',
  erniemun_conference: 'ErnieMUN / Conference Question',
  conference_invitation: 'Conference Invitation',
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body)
    const { form_type, name, email, school, subject, message } = body

    if (!form_type || !name || !email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    // Store in Supabase
    const { error: dbError } = await supabase
      .from('public_contact_forms')
      .insert({
        form_type,
        name,
        email,
        school: school ?? null,
        subject: subject ?? null,
        message,
        metadata: body,
      })

    if (dbError) throw dbError

    // Send notification email to admins
    await sendEmail({
      to: 'info@eraumun.com',
      subject: `New ${FORM_LABELS[form_type] ?? 'Contact'} from ${name}`,
      replyTo: email,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Type:</strong> ${FORM_LABELS[form_type] ?? form_type}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${school ? `<p><strong>School/Org:</strong> ${school}</p>` : ''}
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    // Send confirmation email to submitter
    await sendEmail({
      to: email,
      subject: 'We received your message — ERAU-MUN',
      html: `
        <h2>Thanks for reaching out, ${name}!</h2>
        <p>We received your message and will get back to you as soon as possible.</p>
        <p>If you have any urgent questions, feel free to email us directly at <a href="mailto:info@eraumun.com">info@eraumun.com</a>.</p>
        <br>
        <p>Best,<br>ERAU Model United Nations</p>
      `,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('Contact form error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
