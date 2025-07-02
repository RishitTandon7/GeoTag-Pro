// Webhook handler for Stripe subscription events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import Stripe from "npm:stripe@12.16.0"

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

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  })

  try {
    // Get stripe signature from headers
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Webhook Error: No signature provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get the raw request body
    const body = await req.text()
    
    // Verify the webhook signature
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    let event
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        // Get user ID from metadata
        const userId = session.metadata.userId
        
        if (!userId) {
          throw new Error('No userId in session metadata')
        }
        
        // Get subscription details
        const subscriptionId = session.subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        
        // Update user's subscription status
        await supabaseClient
          .from('profiles')
          .update({
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            subscription_tier: 'premium',
            subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('id', userId)
        
        // Record the payment
        await supabaseClient
          .from('payment_history')
          .insert({
            user_id: userId,
            amount: session.amount_total / 100, // Convert from cents
            currency: session.currency,
            status: 'completed',
            payment_method: session.payment_method_types[0],
            payment_intent_id: session.payment_intent,
            description: 'Premium subscription'
          })
        
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId
        
        if (!userId) {
          // Try to find the user by customer ID
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('customer_id', subscription.customer)
            .single()
          
          if (profile) {
            await supabaseClient
              .from('profiles')
              .update({
                subscription_status: subscription.status,
                subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
                subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
              })
              .eq('id', profile.id)
          }
        } else {
          await supabaseClient
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', userId)
        }
        
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata.userId
        
        if (!userId) {
          // Try to find the user by customer ID
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('customer_id', subscription.customer)
            .single()
          
          if (profile) {
            await supabaseClient
              .from('profiles')
              .update({
                subscription_status: 'canceled',
                subscription_tier: 'free'
              })
              .eq('id', profile.id)
          }
        } else {
          await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free'
            })
            .eq('id', userId)
        }
        
        break
      }
    }
    
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${error.message}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})