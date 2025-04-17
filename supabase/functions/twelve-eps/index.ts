// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts';

console.log("Hello from twelve-eps function!")

// Define types for consistency
interface EarningReport {
  date: string;
  time: string;
  eps_estimate: number;
  eps_actual: number;
  difference: number;
  surprise_prc: number;
}

interface EarningsData {
  meta: {
    symbol: string;
    name: string;
    currency: string;
    exchange: string;
    mic_code: string;
    exchange_timezone: string;
  };
  earnings: EarningReport[];
  status: string;
}

// For debugging only - check that we can access environment variables
const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
console.log("API Key availability:", apiKey ? "Available" : "Not available");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API key from environment variable
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      console.error('API key not found in environment variables');
      
      // For local development, you might want to return mock data
      if (Deno.env.get('ENVIRONMENT') === 'development' || import.meta.url.includes('localhost')) {
        console.log('Using mock data for development');
        return new Response(
          JSON.stringify({
            meta: {
              symbol: "AAPL",
              name: "Apple Inc",
              currency: "USD",
              exchange: "NASDAQ",
              mic_code: "XNAS",
              exchange_timezone: "America/New_York"
            },
            earnings: [
              {
                date: "2023-12-31",
                time: "After Hours",
                eps_estimate: 2.09,
                eps_actual: 2.55,
                difference: 0.46,
                surprise_prc: 22.01
              },
              {
                date: "2023-09-30",
                time: "After Hours",
                eps_estimate: 4.54,
                eps_actual: 4.99,
                difference: 0.45,
                surprise_prc: 9.91
              },
              {
                date: "2023-06-30",
                time: "After Hours",
                eps_estimate: 2.84,
                eps_actual: 3.03,
                difference: 0.19,
                surprise_prc: 6.69
              },
              {
                date: "2023-03-31",
                time: "After Hours",
                eps_estimate: 2.10,
                eps_actual: 2.18,
                difference: 0.08,
                surprise_prc: 3.81
              }
            ],
            status: "ok"
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      throw new Error('API key not found');
    }

    // Parse the request to get the symbol
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Fetching earnings data for ${symbol}`);

    // Fetch data from Twelve Data API - use a simpler approach with direct URL construction
    const apiEndpoint = 'https://api.twelvedata.com/earnings';
    const queryString = `symbol=${encodeURIComponent(symbol)}&period=latest&outputsize=4&dp=2&apikey=${apiKey}`;
    const requestUrl = `${apiEndpoint}?${queryString}`;
    
    console.log(`Requesting URL: ${requestUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);

    const response = await fetch(requestUrl);
    
    // Log the response status
    console.log(`API Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${errorText}`);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug the response structure
    console.log(`Response data structure: ${JSON.stringify(Object.keys(data))}`);
    
    // Check if the response has the expected structure
    if (data.status === 'error') {
      console.error(`API returned error: ${data.message}`);
      throw new Error(`API Error: ${data.message}`);
    }
    
    // Make sure we have an earnings array in the expected format
    // The API might return data in a different structure than expected
    const formattedData: EarningsData = {
      meta: {
        symbol: symbol,
        name: data.meta?.name || symbol,
        currency: data.meta?.currency || 'USD',
        exchange: data.meta?.exchange || '',
        mic_code: data.meta?.mic_code || '',
        exchange_timezone: data.meta?.exchange_timezone || ''
      },
      earnings: [],
      status: 'ok'
    };
    
    // Handle case where earnings might be a single object instead of an array
    if (data.earnings) {
      if (Array.isArray(data.earnings)) {
        // Good case: already an array
        formattedData.earnings = data.earnings;
        console.log(`Found ${data.earnings.length} earnings reports in array format`);
      } else if (typeof data.earnings === 'object') {
        // Case: it's an object, convert to array
        console.log('Earnings is an object, converting to array');
        formattedData.earnings = [data.earnings as EarningReport];
      }
    } else {
      // Handle case where the data structure might be flat, with earnings fields at the top level
      // This is a guess based on possibly seeing a different structure than expected
      const possibleEarningsFields = ['date', 'time', 'eps_estimate', 'eps_actual', 'difference', 'surprise_prc'];
      
      if (possibleEarningsFields.some(field => field in data)) {
        console.log('Converting flat structure to earnings array');
        formattedData.earnings = [{
          date: data.date || '',
          time: data.time || '',
          eps_estimate: parseFloat(data.eps_estimate) || 0,
          eps_actual: parseFloat(data.eps_actual) || 0,
          difference: parseFloat(data.difference) || 0,
          surprise_prc: parseFloat(data.surprise_prc) || 0
        }];
      }
    }
    
    // If we have meta fields at the top level, use them
    if (data.symbol && !data.meta) {
      formattedData.meta.symbol = data.symbol;
      formattedData.meta.name = data.name || symbol;
      formattedData.meta.currency = data.currency || 'USD';
      formattedData.meta.exchange = data.exchange || '';
      formattedData.meta.mic_code = data.mic_code || '';
      formattedData.meta.exchange_timezone = data.exchange_timezone || '';
    }
    
    console.log(`Final earnings count: ${formattedData.earnings.length}`);
    
    // Return the properly formatted response
    return new Response(
      JSON.stringify(formattedData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in twelve-eps function:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/twelve-eps' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"symbol":"AAPL"}'

*/