const { createClient } = require('@supabase/supabase-js')
const { sendEmail } = require('./send-email')
const templates = require('./emails/templates')

const supabase = createClient(
  'https://vtwogeznktkaqqvndduh.supabase.co',
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

    // Check capacity — waitlist if over 100
    const { count } = await supabase
      .from('ernie_crisis_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'registered')

    const isWaitlisted = count >= 100

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
        status: isWaitlisted ? 'waitlisted' : 'registered',
      })

    if (dbError) throw dbError

    // Send confirmation email to registrant
    if (isWaitlisted) {
      const template = templates.ernieCrisisWaitlisted({ firstName: first_name })
      await sendEmail({ to: email, ...template })
    } else {
      const template = templates.ernieCrisisRegistration({
        firstName: first_name,
        registrationType: registration_type,
        teamName: team_name ?? null,
      })
      await sendEmail({ to: email, ...template })
    }

    // Notify admins
    const { data: eboard } = await supabase
      .from('profiles')
      .select('email, user_roles(roles(level))')
      .eq('status', 'approved')

    const eboardEmails = (eboard ?? [])
      .filter(p => p.user_roles?.some(ur => (ur.roles?.level ?? 0) >= 80))
      .map(p => p.email)

    for (const adminEmail of eboardEmails) {
      await sendEmail({
        to: adminEmail,
        subject: `New Ernie Crisis Registration - ${registration_type === 'team' ? team_name ?? 'Team' : `${first_name} ${last_name}`}`,
        html: `
          <h2>New Ernie Crisis Simulation Registration</h2>
          <p><strong>Type:</strong> ${registration_type === 'team' ? 'Team' : 'Individual'}</p>
          <p><strong>Name:</strong> ${first_name} ${last_name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>School:</strong> ${school}</p>
          <p><strong>Status:</strong> ${isWaitlisted ? 'Waitlisted' : 'Registered'}</p>
          ${team_name ? `<p><strong>Team Name:</strong> ${team_name}</p>` : ''}
          ${team_size ? `<p><strong>Team Size:</strong> ${team_size}</p>` : ''}
          ${experience_level ? `<p><strong>Experience:</strong> ${experience_level}</p>` : ''}
          ${faculty_advisor_name ? `<p><strong>Faculty Advisor:</strong> ${faculty_advisor_name} (${faculty_advisor_email})</p>` : ''}
          ${additional_info ? `<p><strong>Additional Info:</strong> ${additional_info}</p>` : ''}
        `,
      })
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, waitlisted: isWaitlisted }),
    }
  } catch (err) {
    console.error('Registration error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}