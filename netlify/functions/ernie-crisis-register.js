const { createClient } = require('@supabase/supabase-js')
const { sendEmail } = require('./send-email')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body)
    const {
      registration_type,
      first_name,
      last_name,
      email,
      school,
      experience_level,
      team_name,
      team_size,
      faculty_advisor_name,
      faculty_advisor_email,
      additional_info,
      age_confirmed,
      tos_accepted,
    } = body

    if (!registration_type || !first_name || !last_name || !email || !school) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    if (!age_confirmed || !tos_accepted) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Must confirm age and accept terms' }) }
    }

    // Store in Supabase
    const { error: dbError } = await supabase
      .from('ernie_crisis_registrations')
      .insert({
        registration_type,
        first_name,
        last_name,
        email,
        school,
        experience_level: experience_level ?? null,
        team_name: team_name ?? null,
        team_size: team_size ? parseInt(team_size) : null,
        faculty_advisor_name: faculty_advisor_name ?? null,
        faculty_advisor_email: faculty_advisor_email ?? null,
        additional_info: additional_info ?? null,
        age_confirmed: !!age_confirmed,
        tos_accepted: !!tos_accepted,
        status: 'registered',
      })

    if (dbError) throw dbError

    // Notify admins
    await sendEmail({
      to: 'info@eraumun.com',
      subject: `New Ernie Crisis Registration - ${registration_type === 'team' ? team_name ?? 'Team' : `${first_name} ${last_name}`}`,
      html: `
        <h2>New Ernie Crisis Simulation Registration</h2>
        <p><strong>Type:</strong> ${registration_type === 'team' ? 'Team' : 'Individual'}</p>
        <p><strong>Name:</strong> ${first_name} ${last_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>School:</strong> ${school}</p>
        ${team_name ? `<p><strong>Team Name:</strong> ${team_name}</p>` : ''}
        ${team_size ? `<p><strong>Team Size:</strong> ${team_size}</p>` : ''}
        ${experience_level ? `<p><strong>Experience:</strong> ${experience_level}</p>` : ''}
        ${faculty_advisor_name ? `<p><strong>Faculty Advisor:</strong> ${faculty_advisor_name} (${faculty_advisor_email})</p>` : ''}
        ${additional_info ? `<p><strong>Additional Info:</strong> ${additional_info}</p>` : ''}
      `,
    })

    // Confirm to registrant
    await sendEmail({
      to: email,
      subject: 'Ernie Crisis Simulation — Registration Received',
      html: `
        <h2>Thanks for registering, ${first_name}!</h2>
        <p>We have received your registration for the Ernie Crisis Simulation hosted by ERAU Model United Nations.</p>
        <p>We will be in touch with confirmation details, event information, and next steps.</p>
        ${registration_type === 'team' ? `<p>Your team <strong>${team_name}</strong> has been registered.</p>` : ''}
        <p>If you have any questions in the meantime, contact us at <a href="mailto:info@eraumun.com">info@eraumun.com</a>.</p>
        <br>
        <p>Best,<br>ERAU Model United Nations</p>
      `,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('Registration error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}