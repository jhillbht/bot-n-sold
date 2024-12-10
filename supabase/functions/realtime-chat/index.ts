import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY')
}

const supabaseAdmin = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
)

serve(async (req) => {
  const upgrade = req.headers.get('upgrade') || ''
  
  if (upgrade.toLowerCase() != 'websocket') {
    return new Response('Expected websocket', { status: 400 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)

  socket.onopen = () => {
    console.log('Client connected')
    const openaiWS = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', [
      'realtime',
      `openai-insecure-api-key.${OPENAI_API_KEY}`,
      'openai-beta.realtime-v1',
    ])

    openaiWS.onopen = () => {
      console.log('Connected to OpenAI')
      
      // Send initial session configuration
      openaiWS.send(JSON.stringify({
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: "You are a business advisor AI assistant. Help users with business valuations, selling their business, and other business-related queries. Your responses should be professional and focused on business topics.",
          voice: "alloy",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          }
        }
      }))

      socket.onmessage = (e) => {
        if (openaiWS.readyState === 1) {
          openaiWS.send(e.data)
        }
      }
    }

    openaiWS.onmessage = (e) => {
      socket.send(e.data)
    }

    openaiWS.onerror = (e) => console.error('OpenAI WebSocket error:', e)
    openaiWS.onclose = () => console.log('OpenAI WebSocket closed')
  }

  socket.onerror = (e) => console.error('Client WebSocket error:', e)
  socket.onclose = () => console.log('Client disconnected')

  return response
})