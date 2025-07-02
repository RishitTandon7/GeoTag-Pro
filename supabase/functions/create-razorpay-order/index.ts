// Razorpay order creation function - Test Mode for Students

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
    const { plan, returnUrl } = await req.json()
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
    
    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching profile', details: profileError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For Test Mode: Use hardcoded Razorpay test credentials
    const razorpayKeyId = "rzp_test_eKL6FdUJcHaBbZ"
    const razorpayKeySecret = "tL1NGAe8XDuMnChvmYVPPtIC"
    
    // Calculate amount based on plan
    const amount = plan === 'yearly' ? 48000 : 5000 // in paisa (480 or 50 INR)
    
    // Create Razorpay order
    const orderData = {
      amount: amount,
      currency: 'INR',
      receipt: `order_rcpt_${user.id.substring(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        plan: plan,
        email: user.email
      }
    }
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      },
      body: JSON.stringify(orderData)
    })
    
    const orderResponse = await response.json()
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Error creating Razorpay order', details: orderResponse.error }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({
        order_id: orderResponse.id,
        amount: orderResponse.amount,
        currency: orderResponse.currency
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