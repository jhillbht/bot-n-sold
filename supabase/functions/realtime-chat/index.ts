import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPI_API_KEY = Deno.env.get('VAPI_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const upgrade = req.headers.get('upgrade') || ''
  if (upgrade.toLowerCase() != 'websocket') {
    return new Response('Expected websocket', { 
      status: 400,
      headers: corsHeaders
    })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)

  socket.onopen = () => {
    console.log('Client connected to Edge Function')
    
    // Connect to VAPI WebSocket with proper configuration
    const vapiWS = new WebSocket('wss://api.vapi.ai/ws', [
      `vapi-api-key.${VAPI_API_KEY}`,
      'vapi-protocol.v1'
    ])

    vapiWS.onopen = () => {
      console.log('Connected to VAPI')
      
      // Send initial configuration for the widget
      const config = {
        type: "session.update",
        session: {
          assistant_id: "03c8458b-0abb-4d0a-98f6-456f99cb5000",
          input_audio_config: {
            sample_rate: 24000,
            channels: 1
          },
          output_audio_config: {
            sample_rate: 24000,
            channels: 1
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          }
        }
      }
      vapiWS.send(JSON.stringify(config))

      // Forward messages from client to VAPI
      socket.onmessage = (e) => {
        console.log('Received message from client:', e.data)
        if (vapiWS.readyState === WebSocket.OPEN) {
          vapiWS.send(e.data)
        }
      }
    }

    // Forward messages from VAPI to client
    vapiWS.onmessage = (e) => {
      console.log('Received message from VAPI:', e.data)
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(e.data)
      }
    }

    vapiWS.onerror = (e) => {
      console.error('VAPI WebSocket error:', e)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'VAPI connection error'
      }))
    }

    vapiWS.onclose = () => {
      console.log('VAPI WebSocket closed')
      socket.send(JSON.stringify({
        type: 'error',
        message: 'VAPI connection closed'
      }))
    }
  }

  socket.onerror = (e) => console.error('Client WebSocket error:', e)
  socket.onclose = () => console.log('Client disconnected')

  return response
})