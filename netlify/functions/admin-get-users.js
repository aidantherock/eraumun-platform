const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://vtwogeznktkaqqvndduh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(*, roles(*))')
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}