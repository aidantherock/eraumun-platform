const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://vtwogeznktkaqqvndduh.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile) return { statusCode: 404, body: 'User not found' }

  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('slug', 'president')
    .single()

  await supabase.from('profiles').update({ status: 'approved' }).eq('id', profile.id)
  await supabase.from('user_roles').upsert({ user_id: profile.id, role_id: role.id })

  return { statusCode: 200, body: JSON.stringify({ success: true }) }
}