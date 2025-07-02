// Generate friend code function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "OPTIONS, POST, GET"
}

// Generate random code of specified length (default 8 characters)
const generateRandomCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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

    // Check if user is the admin (Rishit's account)
    // You'd typically do this by checking a special admin flag or specific user ID
    // For this example, we'll use the email for simplicity
    if (user.email !== 'rishit@example.com' && user.email !== 'rishittandon7@gmail.com') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Only the administrator can generate friend codes.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { count = 1, format = "XXXX-XXXX" } = await req.json();
    
    if (count < 1 || count > 50) {
      return new Response(
        JSON.stringify({ error: 'Count must be between 1 and 50' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate the requested number of codes
    const generatedCodes = [];
    for (let i = 0; i < count; i++) {
      // Generate code based on format (replace X with random chars)
      let formattedCode = format;
      while (formattedCode.includes('X')) {
        formattedCode = formattedCode.replace('X', generateRandomCode(1));
      }
      
      // Insert the code into the friend_codes table
      const { data: codeData, error: codeError } = await supabaseClient
        .from('friend_codes')
        .insert({
          code: formattedCode,
          created_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();
      
      if (codeError) {
        // Log the error but continue generating other codes
        console.error('Error generating code:', codeError);
        continue;
      }
      
      generatedCodes.push(codeData);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        codes: generatedCodes,
        count: generatedCodes.length
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