// Cancel Razorpay subscription function - Test Mode for Students

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

    // Get profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Error fetching profile', details: profileError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has an active subscription
    if (profile.subscription_tier !== 'premium' || profile.subscription_status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'No active subscription to cancel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Since we're in test mode, we'll simply update the user's subscription status
    // In a real implementation, you'd call the Razorpay API to cancel the subscription
    
    console.log("Test mode: Canceling subscription for user", user.id);

    // Update user profile to mark subscription as canceled
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_tier: 'free'
      })
      .eq('id', user.id)
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Error updating profile', details: updateError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription canceled successfully. (Test Mode)' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})