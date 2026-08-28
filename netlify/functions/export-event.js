const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function toCSV(rows, headers) {
  if (!rows?.length) return headers.join(',') + '\n'
  const lines = [headers.join(',')]
  for (const row of rows) {
    const line = headers.map(h => {
      const val = row[h] ?? ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
    })
    lines.push(line.join(','))
  }
  return lines.join('\n')
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const eventId = event.queryStringParameters?.eventId
    if (!eventId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing eventId' }) }

    // Fetch all event data in parallel
    const [
      { data: eventData },
      { data: committees },
      { data: eventRoles },
      { data: schedule },
      { data: files },
      { data: feedback },
      { data: guestDelegates },
    ] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('committees').select('*').eq('event_id', eventId),
      supabase.from('event_roles').select('id').eq('event_id', eventId),
      supabase.from('event_schedule').select('*').eq('event_id', eventId).order('day').order('start_time'),
      supabase.from('event_files').select('*').eq('event_id', eventId),
      supabase.from('post_conference_feedback').select('*').eq('event_id', eventId),
      supabase.from('guest_delegates').select('*, committees(name)').eq('event_id', eventId),
    ])

    // Get attendees
    const eventRoleIds = eventRoles?.map(r => r.id) ?? []
    const { data: attendees } = eventRoleIds.length > 0
      ? await supabase
          .from('user_event_roles')
          .select('*, profiles(first_name, last_name, email, school), event_roles(name)')
          .in('event_role_id', eventRoleIds)
      : { data: [] }

    // Get committee roles
    const committeeIds = committees?.map(c => c.id) ?? []
    const { data: committeeRoles } = committeeIds.length > 0
      ? await supabase
          .from('committee_roles')
          .select('*, profiles(first_name, last_name, email, school), committees(name)')
          .in('committee_id', committeeIds)
      : { data: [] }

    // Get submissions
    const { data: submissions } = committeeIds.length > 0
      ? await supabase
          .from('submissions')
          .select('*, profiles(first_name, last_name), committees(name), document_types(name)')
          .in('committee_id', committeeIds)
          .order('created_at', { ascending: false })
      : { data: [] }

    // Get votes
    const { data: votes } = committeeIds.length > 0
      ? await supabase
          .from('votes')
          .select('*, committees(name)')
          .in('committee_id', committeeIds)
      : { data: [] }

    // Get awards
    const { data: awards } = committeeIds.length > 0
      ? await supabase
          .from('awards')
          .select('*, profiles(first_name, last_name), committees(name)')
          .in('committee_id', committeeIds)
      : { data: [] }

    // Build CSV exports
    const exports = {
      event: toCSV([eventData], ['name', 'status', 'location', 'start_date', 'end_date', 'description']),

      attendees: toCSV(
        (attendees ?? []).map(a => ({
          first_name: a.profiles?.first_name,
          last_name: a.profiles?.last_name,
          email: a.profiles?.email,
          school: a.profiles?.school,
          approved: a.approved,
          registered_at: a.assigned_at,
        })),
        ['first_name', 'last_name', 'email', 'school', 'approved', 'registered_at']
      ),

      committees: toCSV(
        (committees ?? []).map(c => ({
          name: c.name,
          type: c.type,
          topic: c.topic,
          description: c.description,
        })),
        ['name', 'type', 'topic', 'description']
      ),

      committee_roster: toCSV(
        (committeeRoles ?? []).map(cr => ({
          committee: cr.committees?.name,
          first_name: cr.profiles?.first_name,
          last_name: cr.profiles?.last_name,
          email: cr.profiles?.email,
          school: cr.profiles?.school,
          role: cr.role,
          assignment: cr.assignment,
        })),
        ['committee', 'first_name', 'last_name', 'email', 'school', 'role', 'assignment']
      ),

      submissions: toCSV(
        (submissions ?? []).map(s => ({
          committee: s.committees?.name,
          document_type: s.document_types?.name,
          title: s.title,
          author: `${s.profiles?.first_name} ${s.profiles?.last_name}`,
          status: s.status,
          submitted_at: s.created_at,
        })),
        ['committee', 'document_type', 'title', 'author', 'status', 'submitted_at']
      ),

      votes: toCSV(
        (votes ?? []).map(v => ({
          committee: v.committees?.name,
          title: v.title,
          type: v.vote_type,
          status: v.status,
          result: v.result,
          created_at: v.created_at,
        })),
        ['committee', 'title', 'type', 'status', 'result', 'created_at']
      ),

      awards: toCSV(
        (awards ?? []).map(a => ({
          committee: a.committees?.name,
          recipient: `${a.profiles?.first_name} ${a.profiles?.last_name}`,
          award: a.award_type,
          notes: a.notes,
          awarded_at: a.created_at,
        })),
        ['committee', 'recipient', 'award', 'notes', 'awarded_at']
      ),

      schedule: toCSV(
        (schedule ?? []).map(s => ({
          day: s.day,
          start_time: s.start_time,
          end_time: s.end_time,
          title: s.title,
          type: s.type,
          location: s.location,
          description: s.description,
        })),
        ['day', 'start_time', 'end_time', 'title', 'type', 'location', 'description']
      ),

      guest_delegates: toCSV(
        (guestDelegates ?? []).map(d => ({
          first_name: d.first_name,
          last_name: d.last_name,
          email: d.login_email,
          school: d.school,
          committee: d.committees?.name,
          assignment: d.assignment,
          created_at: d.created_at,
        })),
        ['first_name', 'last_name', 'email', 'school', 'committee', 'assignment', 'created_at']
      ),

      feedback: toCSV(
        (feedback ?? []).map(f => ({
          rating: f.rating,
          comments: f.comments,
          submitted_at: f.created_at,
        })),
        ['rating', 'comments', 'submitted_at']
      ),
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        eventName: eventData?.name,
        exports,
        summary: {
          attendees: attendees?.length ?? 0,
          committees: committees?.length ?? 0,
          submissions: submissions?.length ?? 0,
          votes: votes?.length ?? 0,
          awards: awards?.length ?? 0,
          guestDelegates: guestDelegates?.length ?? 0,
          feedback: feedback?.length ?? 0,
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    }
  } catch (err) {
    console.error('Export error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: { 'Content-Type': 'application/json' }
    }
  }
}
