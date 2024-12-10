import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!VAPI_API_KEY) {
  console.error('Missing VAPI_API_KEY')
}

const supabaseAdmin = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const upgrade = req.headers.get('upgrade') || ''
  
  if (upgrade.toLowerCase() != 'websocket') {
    return new Response('Expected websocket', { status: 400 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)

  socket.onopen = () => {
    console.log('Client connected to realtime-chat')
    const vapiWS = new WebSocket('wss://api.vapi.ai/ws', [
      `vapi-api-key.${VAPI_API_KEY}`,
    ])

    vapiWS.onopen = () => {
      console.log('Connected to Vapi')
      
      // Send initial configuration
      vapiWS.send(JSON.stringify({
        type: "session.update",
        session: {
          assistant_id: "business-advisor",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_config: {
            sample_rate: 24000,
            channels: 1
          },
          output_audio_config: {
            sample_rate: 24000,
            channels: 1
          }
        }
      }))

      socket.onmessage = (e) => {
        console.log('Received message from client:', e.data)
        if (vapiWS.readyState === 1) {
          vapiWS.send(e.data)
        } else {
          socket.send(
            JSON.stringify({
              type: 'error',
              msg: 'Vapi connection not ready',
            })
          )
        }
      }
    }

    vapiWS.onmessage = (e) => {
      console.log('Received message from Vapi:', e.data)
      socket.send(e.data)
    }

    vapiWS.onerror = (e) => {
      console.error('Vapi WebSocket error:', e)
      socket.send(JSON.stringify({
        type: 'error',
        msg: 'Vapi connection error',
      }))
    }
    
    vapiWS.onclose = () => {
      console.log('Vapi WebSocket closed')
      socket.send(JSON.stringify({
        type: 'error',
        msg: 'Vapi connection closed',
      }))
    }
  }

  socket.onerror = (e) => console.error('Client WebSocket error:', e)
  socket.onclose = () => console.log('Client disconnected')

  return response
})