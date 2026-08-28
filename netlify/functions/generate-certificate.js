const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { userId, eventId } = event.queryStringParameters ?? {}
    if (!userId || !eventId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId or eventId' }) }
    }

    // Fetch all required data
    const [
      { data: profile },
      { data: eventData },
      { data: committeeRoles },
      { data: awards },
    ] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, school').eq('id', userId).single(),
      supabase.from('events').select('name, start_date, end_date, location').eq('id', eventId).single(),
      supabase.from('committee_roles')
        .select('role, assignment, committees(name, type)')
        .eq('user_id', userId)
        .in('committee_id',
          (await supabase.from('committees').select('id').eq('event_id', eventId)).data?.map(c => c.id) ?? []
        ),
      supabase.from('awards')
        .select('award_type')
        .eq('user_id', userId)
        .in('committee_id',
          (await supabase.from('committees').select('id').eq('event_id', eventId)).data?.map(c => c.id) ?? []
        ),
    ])

    if (!profile || !eventData) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Profile or event not found' }) }
    }

    const fullName = `${profile.first_name} ${profile.last_name}`
    const school = profile.school ?? 'Embry-Riddle Aeronautical University'
    const eventName = eventData.name
    const startDate = eventData.start_date
      ? new Date(eventData.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : ''
    const endDate = eventData.end_date
      ? new Date(eventData.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : ''
    const dateRange = endDate && endDate !== startDate ? `${startDate} – ${endDate}` : startDate
    const location = eventData.location ?? ''
    const issueDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    const primaryRole = committeeRoles?.[0]
    const roleLabel = primaryRole?.role?.replace('_', ' ') ?? 'Delegate'
    const committeeName = primaryRole?.committees?.name ?? ''
    const assignment = primaryRole?.assignment ?? ''
    const awardsList = awards?.map(a => a.award_type) ?? []

    // Generate SVG certificate
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1056" height="816" viewBox="0 0 1056 816" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="navyGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e3a6e"/>
      <stop offset="100%" stop-color="#0f2040"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b8963e"/>
      <stop offset="50%" stop-color="#d4af62"/>
      <stop offset="100%" stop-color="#b8963e"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1056" height="816" fill="#fafaf8"/>

  <!-- Navy border frame -->
  <rect x="0" y="0" width="1056" height="816" fill="url(#navyGrad)"/>
  <rect x="20" y="20" width="1016" height="776" fill="#fafaf8"/>
  <rect x="32" y="32" width="992" height="752" fill="none" stroke="#b8963e" stroke-width="1.5"/>

  <!-- Gold accent bars -->
  <rect x="20" y="100" width="1016" height="6" fill="url(#goldGrad)"/>
  <rect x="20" y="710" width="1016" height="6" fill="url(#goldGrad)"/>

  <!-- Header -->
  <text x="528" y="72" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#b8963e" letter-spacing="6">EMBRY-RIDDLE AERONAUTICAL UNIVERSITY</text>
  <text x="528" y="88" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#b8963e" letter-spacing="4">MODEL UNITED NATIONS</text>

  <!-- Certificate title -->
  <text x="528" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#666" letter-spacing="8">CERTIFICATE OF</text>
  <text x="528" y="210" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="bold" fill="#1e3a6e" letter-spacing="4">PARTICIPATION</text>

  <!-- Decorative line -->
  <line x1="228" y1="230" x2="828" y2="230" stroke="#b8963e" stroke-width="1"/>
  <circle cx="528" cy="230" r="4" fill="#b8963e"/>
  <circle cx="228" cy="230" r="3" fill="#b8963e"/>
  <circle cx="828" cy="230" r="3" fill="#b8963e"/>

  <!-- Presented to -->
  <text x="528" y="280" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#888" letter-spacing="2">This certificate is proudly presented to</text>

  <!-- Recipient name -->
  <text x="528" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="#1e3a6e">${fullName}</text>

  <!-- School -->
  <text x="528" y="370" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#888">${school}</text>

  <!-- Decorative line -->
  <line x1="328" y1="390" x2="728" y2="390" stroke="#d4af62" stroke-width="0.5"/>

  <!-- Body text -->
  <text x="528" y="430" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#444">
    in recognition of participation as
  </text>
  <text x="528" y="458" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#1e3a6e" text-transform="capitalize">
    ${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)}${assignment ? ` — ${assignment}` : ''}
  </text>
  ${committeeName ? `<text x="528" y="484" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#666">${committeeName}</text>` : ''}

  <text x="528" y="${committeeName ? '520' : '500'}" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#444">
    at
  </text>
  <text x="528" y="${committeeName ? '548' : '528'}" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#1e3a6e">
    ${eventName}
  </text>
  ${dateRange ? `<text x="528" y="${committeeName ? '574' : '554'}" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#888">${dateRange}${location ? ` · ${location}` : ''}</text>` : ''}

  ${awardsList.length > 0 ? `
  <!-- Awards -->
  <rect x="328" y="${committeeName ? '600' : '580'}" width="400" height="36" rx="4" fill="#fdf6e3" stroke="#b8963e" stroke-width="1"/>
  <text x="528" y="${committeeName ? '623' : '603'}" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#b8963e" font-weight="bold">
    🏆 ${awardsList.join(' · ')}
  </text>
  ` : ''}

  <!-- Signature line -->
  <line x1="180" y1="740" x2="420" y2="740" stroke="#1e3a6e" stroke-width="1"/>
  <line x1="636" y1="740" x2="876" y2="740" stroke="#1e3a6e" stroke-width="1"/>

  <text x="300" y="758" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#666">President, ERAU-MUN</text>
  <text x="756" y="758" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#666">Vice President, ERAU-MUN</text>

  <!-- Issue date -->
  <text x="528" y="758" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#999">Issued ${issueDate}</text>

  <!-- Corner ornaments -->
  <text x="52" y="68" font-size="20" fill="#b8963e" opacity="0.4">✦</text>
  <text x="990" y="68" font-size="20" fill="#b8963e" opacity="0.4" text-anchor="end">✦</text>
  <text x="52" y="784" font-size="20" fill="#b8963e" opacity="0.4">✦</text>
  <text x="990" y="784" font-size="20" fill="#b8963e" opacity="0.4" text-anchor="end">✦</text>
</svg>`

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="ERAU-MUN-Certificate-${fullName.replace(/\s+/g, '-')}.svg"`,
        'Cache-Control': 'no-cache',
      },
      body: svg,
    }
  } catch (err) {
    console.error('Certificate error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
