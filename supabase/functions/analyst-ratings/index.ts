import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com/api'

interface AnalystRating {
  symbol: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    console.log('Received request:', JSON.stringify(body));
    
    const { symbol } = body;
    if (!symbol) throw new Error('Missing stock symbol')
    
    if (!FMP_API_KEY) throw new Error('Missing FMP API key')

    // Test with a fixed response matching the sample data if enabled
    if (Deno.env.get('USE_SAMPLE_DATA') === 'true') {
      console.log('Using sample data response for testing');
      const sampleRating = {
        symbol: symbol,
        strongBuy: 1,
        buy: 29,
        hold: 11,
        sell: 4,
        strongSell: 0,
        consensus: "Buy"
      };
      
      // Return test data in expected format
      return new Response(JSON.stringify([sampleRating]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Prepare URLs for API calls
    const ratingsUrl = `${FMP_BASE_URL}/stable/grades-consensus?symbol=${symbol}&apikey=${FMP_API_KEY}`;
    
    console.log('Fetching data from:', ratingsUrl.replace(FMP_API_KEY, 'API_KEY_HIDDEN'));

    // Fetch ratings data
    const ratingsResponse = await fetch(ratingsUrl);

    if (!ratingsResponse.ok) {
      console.warn(`Failed to fetch ratings for ${symbol}: ${ratingsResponse.status} ${await ratingsResponse.text()}`);
      throw new Error(`Failed to fetch ratings for ${symbol}: ${ratingsResponse.status}`);
    }

    const ratingsData = await ratingsResponse.json();
    
    console.log('Raw ratings data:', JSON.stringify(ratingsData));

    // If we didn't get any data, return an empty array
    if (!Array.isArray(ratingsData) || ratingsData.length === 0) {
      console.log(`No analyst ratings found for ${symbol}`);
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Process data
    const latestRating = ratingsData[0]; // Get the consensus data
    console.log('Latest rating:', JSON.stringify(latestRating));
    
    // Create response in the expected array format
    const response: AnalystRating[] = [{
      symbol: symbol,
      strongBuy: latestRating.strongBuy ?? 0,
      buy: latestRating.buy ?? 0,
      hold: latestRating.hold ?? 0,
      sell: latestRating.sell ?? 0,
      strongSell: latestRating.strongSell ?? 0,
      consensus: latestRating.consensus ?? 'N/A'
    }];
    
    console.log('Final response:', JSON.stringify(response));
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 