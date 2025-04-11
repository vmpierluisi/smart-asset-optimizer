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
  
  try {
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    console.log('AI response status:', response.status);
    
    // Don't parse JSON here. Check if the response is ok and return it.
    if (!response.ok) {
      // Try to get error text, but don't fail if it's not JSON
      const errorText = await response.text().catch(() => `Server error: ${response.status}`); 
      console.error('AI request error:', response.status, errorText);
      throw new Error(errorText || `Server responded with ${response.status}`);
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
