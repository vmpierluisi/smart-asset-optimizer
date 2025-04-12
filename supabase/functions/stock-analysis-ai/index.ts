import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || ''
const SITE_URL = 'https://smart-asset-optimizer.vercel.app' // Update this with your actual site URL
const SITE_NAME = 'Smart Asset Optimizer' // Update this with your actual site name

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, cardContext } = await req.json()

    // Prepare the conversation with context
    let prompt = ''
    
    // Add system message with card context
    if (cardContext) {
      prompt += `You are an AI assistant specialized in finance and stock analysis. 
      You're helping explain financial data from a stock analysis dashboard.
      
      Here's the context from the card the user is viewing: ${JSON.stringify(cardContext)}
      
      Provide concise, insightful explanations about this financial data. Use plain language while maintaining accuracy.
      Keep initial responses short (2-3 sentences) but informative. Be ready to answer follow-up questions with more detail.\n\n`
    }
    
    // Add user messages
    messages.forEach((msg: { role: string; content: string }) => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`
    })

    // Create ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Request to OpenRouter API with streaming enabled
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': SITE_URL,
              'X-Title': SITE_NAME,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash-001',
              messages: [{ role: 'user', content: prompt }],
              stream: true,
            }),
          });

          // Check if the request to OpenRouter failed
          if (!response.ok) {
            const errorBody = await response.text();
            const errorMsg = `OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`;
            console.error(errorMsg);
            
            // Send error as a properly formatted SSE message
            const errorEvent = `data: ${JSON.stringify({
              choices: [{
                delta: { content: `Error: ${response.statusText}` }
              }]
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(errorEvent));
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          if (!response.body) {
            throw new Error('Response body is null');
          }

          // Process the stream
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            // Forward the chunk directly to the client
            controller.enqueue(value);
          }

          // Signal completion
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          
          // Send error as a properly formatted SSE message
          const errorEvent = `data: ${JSON.stringify({
            choices: [{
              delta: { content: `Error: ${error.message}` }
            }]
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorEvent));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        }
      }
    });

    // Return the streaming response
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in Edge Function:', error);
    // Return a JSON error response if something goes wrong before streaming starts
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
}) 