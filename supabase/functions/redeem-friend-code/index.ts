import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "OPTIONS, POST, GET"
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get request data
    const { code } = await req.json()
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    // Get user from the auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.split(' ')[1])
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Error fetching user', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the code exists and is valid
    const { data: friendCode, error: codeError } = await supabaseClient
      .from('friend_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .is('redeemed_by', null)
      .single()
    
    if (codeError || !friendCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid or already used friend code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the friend code to mark it as redeemed
    const { error: updateCodeError } = await supabaseClient
      .from('friend_codes')
      .update({
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', friendCode.id)
    
    if (updateCodeError) {
      return new Response(
        JSON.stringify({ error: 'Error redeeming friend code', details: updateCodeError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the user's subscription tier to 'friend'
    const { error: updateProfileError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_tier: 'friend',
        subscription_status: 'active'
      })
      .eq('id', user.id)
    
    if (updateProfileError) {
      return new Response(
        JSON.stringify({ error: 'Error updating profile', details: updateProfileError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Friend code redeemed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})