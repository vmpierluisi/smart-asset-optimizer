// src/utils/aiApiClient.ts

// Get environment variables from Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

type Message = {
  role: string;
  content: string;
};

interface AIRequestPayload {
  messages: Message[];
  cardContext?: any;
}

/**
 * Sends a request to the AI assistant through Supabase Edge Function and returns the raw Response object for streaming
 */
export async function sendAIRequest(payload: AIRequestPayload): Promise<Response> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing environment variables:', { 
      SUPABASE_URL: !!SUPABASE_URL, 
      SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY 
    });
    throw new Error('Supabase URL or Anon Key is missing from environment variables');
  }

  const url = `${SUPABASE_URL}/functions/v1/stock-analysis-ai`;
  console.log('Sending AI request to:', url);
  console.log('Request payload:', {
    messages: payload.messages,
    contextSize: payload.cardContext ? Object.keys(payload.cardContext).length : 0,
    taggedSections: payload.cardContext?.taggedSections || []
  });
  
  try {
    console.log('Initiating fetch request...');
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          // Add explicit accept header for streaming responses
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload)
      }
    );

    console.log('AI response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    // Check if the response is ok
    if (!response.ok) {
      // Try to get error text, but don't fail if it's not JSON
      try {
        const errorText = await response.text(); 
        console.error('AI request error details:', errorText);
        
        // Try to parse as JSON to get a structured error
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || `Server responded with ${response.status}`);
        } catch (parseErr) {
          // If it's not JSON, use the raw text
          throw new Error(errorText || `Server responded with ${response.status}`);
        }
      } catch (textError) {
        console.error('Could not read error response text:', textError);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    // Verify that the response has a body
    if (!response.body) {
      console.error('Response is missing body stream');
      throw new Error('Response body stream is missing');
    }
    
    // Verify the content type is correct for streaming
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/event-stream')) {
      console.warn('Response content type is not text/event-stream:', contentType);
      // We'll continue anyway as the backend might not set the correct content type
    }

    // Return the raw response object
    console.log('AI response received successfully, returning stream.');
    return response; 
  } catch (error) {
    console.error('Error in AI request function:', error);
    // Re-throw the error so the component can handle it
    throw error;
  }
}
