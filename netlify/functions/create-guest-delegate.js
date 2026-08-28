const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const {
      email,
      firstName,
      lastName,
      school,
      eventId,
      committeeId,
      assignment,
      createdBy,
    } = JSON.parse(event.body)

    if (!email || !firstName || !lastName || !eventId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    })

    if (authError) throw new Error(authError.message)

    const userId = authData.user.id

    // Create profile — auto approved
    await supabase.from('profiles').upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      school: school ?? null,
      status: 'approved',
      onboarding_complete: true,
      organization_id: (await supabase.from('organizations').select('id').single()).data?.id,
    })

    // Get or create event role
    let { data: eventRole } = await supabase
      .from('event_roles')
      .select('id')
      .eq('event_id', eventId)
      .single()

    if (!eventRole) {
      const { data: newRole } = await supabase
        .from('event_roles')
        .insert({ event_id: eventId, name: 'Attendee' })
        .select()
        .single()
      eventRole = newRole
    }

    // Assign event role
    await supabase.from('user_event_roles').insert({
      user_id: userId,
      event_role_id: eventRole.id,
      approved: true,
    })

    // Assign committee role if provided
    if (committeeId) {
      await supabase.from('committee_roles').insert({
        committee_id: committeeId,
        user_id: userId,
        role: 'delegate',
        assignment: assignment ?? null,
      })
    }

    // Store guest delegate record
    await supabase.from('guest_delegates').insert({
      event_id: eventId,
      profile_id: userId,
      created_by: createdBy,
      login_email: email,
      first_name: firstName,
      last_name: lastName,
      school: school ?? null,
      committee_id: committeeId ?? null,
      assignment: assignment ?? null,
      temporary_password: tempPassword,
    })

    // Get event name
    const { data: eventData } = await supabase
      .from('events')
      .select('name')
      .eq('id', eventId)
      .single()

    // Send login email
    await resend.emails.send({
      from: 'ERAU-MUN <noreply@eraumun.com>',
      to: email,
      subject: `Your login for ${eventData?.name ?? 'ERAU-MUN'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f5f5f5; padding: 32px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
            <div style="background: #1e3a6e; padding: 32px; text-align: center;">
              <h1 style="color: white; font-size: 24px; margin: 0;">ERAU Model United Nations</h1>
              <p style="color: #d4af62; margin: 8px 0 0;">Conference Access</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1e3a6e;">Welcome, ${firstName}!</h2>
              <p style="color: #444; line-height: 1.6;">
                You have been registered for <strong>${eventData?.name ?? 'an ERAU-MUN event'}</strong>.
                Use the credentials below to access the delegate portal.
              </p>
              ${committeeId ? `<p style="color: #444;">Your committee assignment: <strong>${assignment ?? 'See portal'}</strong></p>` : ''}
              <div style="background: #e8eef7; border-left: 4px solid #1e3a6e; border-radius: 4px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #444;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0; font-size: 14px; color: #444;"><strong>Temporary Password:</strong> ${tempPassword}</p>
              </div>
              <p style="color: #666; font-size: 14px;">Please change your password after your first login.</p>
              <a href="https://eraumun.com/login" style="display: inline-block; background: #1e3a6e; color: white; font-weight: 600; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin-top: 8px;">
                Access Portal
              </a>
            </div>
            <div style="padding: 24px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">ERAU Model United Nations · eraumun.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, userId, tempPassword }),
      headers: { 'Content-Type': 'application/json' }
    }
  } catch (err) {
    console.error('Create guest delegate error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { 'Content-Type': 'application/json' }
    }
  }
}
