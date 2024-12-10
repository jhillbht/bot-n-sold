import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get environment variables
const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

if (!VAPI_API_KEY) {
  console.error('Missing required environment variable VAPI_API_KEY')
}

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { assistantId } = await req.json()
    
    if (!assistantId) {
      throw new Error('assistantId is required')
    }
    
    // Create a new call using Vapi API
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        caller: {
          phone_number: "+12345678900" // Replace with actual phone number when needed
        }
      })
    })

    const data = await response.json()
    console.log('Vapi call response:', data)

    // Store call information in Supabase
    const { data: callData, error: dbError } = await supabaseAdmin
      .from('calls')
      .insert([
        {
          assistant_id: assistantId,
          status: 'queued',
          metadata: data
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify(callData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})