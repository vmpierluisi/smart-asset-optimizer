import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Parse request body
    const { symbol, startDate, endDate } = await req.json();
    
    if (!symbol || typeof symbol !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Symbol must be a valid string' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!FMP_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'FMP API key not configured on the server' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Format dates for API request
    const formattedStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
    const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : '';
    
    // Construct the FMP API URL using the correct endpoint structure
    const fmpUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}${formattedStartDate ? `&from=${formattedStartDate}` : ''}${formattedEndDate ? `&to=${formattedEndDate}` : ''}`;
    
    console.log(`Fetching historical data from: ${fmpUrl}`);
    
    const response = await fetch(fmpUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FMP API error response: ${errorText}`);
      throw new Error(`FMP API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("FMP API response structure:", JSON.stringify(data).substring(0, 500) + "...");
    
    if (!data || (!data.historical && !Array.isArray(data))) {
      console.error("Invalid data structure:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Invalid or empty data received from FMP API', data }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Handle different response formats from FMP API
    let historicalData = data.historical;
    
    // If data is directly an array (some FMP endpoints return arrays directly)
    if (!historicalData && Array.isArray(data)) {
      historicalData = data;
    }
    
    if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
      console.error("No historical data found in response");
      return new Response(
        JSON.stringify({ 
          error: 'No historical data found in FMP API response', 
          responseStructure: Object.keys(data),
          sample: JSON.stringify(data).substring(0, 500) + "..."
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Transform the data to match the format expected by the client
    const transformedData = historicalData
      .map((item: any) => {
        const dateValue = item.date || item.formattedDate;
        const closeValue = item.adjClose || item.close || item.adjustedClose;
        
        if (!dateValue || closeValue === undefined || closeValue === null) {
          console.warn(`Skipping invalid data point:`, item);
          return null;
        }
        
        return {
          date: new Date(dateValue),
          close: parseFloat(closeValue),
        };
      })
      .filter((item: any) => item !== null)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime()); // Sort by date ascending
    
    if (transformedData.length === 0) {
      console.error("No valid data points after transformation");
      return new Response(
        JSON.stringify({ error: 'No valid data points found in FMP API response' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify(transformedData),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in historical-prices function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 