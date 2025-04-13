import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
const FMP_BASE_URL = 'https://financialmodelingprep.com'

interface ApiResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol, endpoints } = await req.json()
    
    if (!symbol) {
      throw new Error('Missing stock symbol')
    }
    
    if (!FMP_API_KEY) {
      throw new Error('Missing FMP API key')
    }

    // Validate requested endpoints if specified
    const validEndpoints = ['ratios-ttm', 'key-metrics-ttm', 'profile']
    let endpointsToFetch = validEndpoints
    
    if (endpoints && Array.isArray(endpoints)) {
      endpointsToFetch = endpoints.filter(endpoint => validEndpoints.includes(endpoint))
      if (endpointsToFetch.length === 0) {
        throw new Error('No valid endpoints requested')
      }
    }

    console.log(`Processing FMP data request for symbol: ${symbol}, endpoints: ${endpointsToFetch.join(', ')}`)

    // Prepare API calls based on requested endpoints
    const apiCalls = {}
    const results = {}

    for (const endpoint of endpointsToFetch) {
      // Use 'stable' path for TTM endpoints, 'api/v3' for profile
      const basePath = endpoint.includes('-ttm') ? 'stable' : 'api/v3'
      const url = `${FMP_BASE_URL}/${basePath}/${endpoint}?symbol=${symbol}&apikey=${FMP_API_KEY}`
      apiCalls[endpoint] = url
    }

    // Make parallel API calls
    console.log(`Making ${Object.keys(apiCalls).length} API calls to FMP`)
    
    const responses = await Promise.all(
      Object.entries(apiCalls).map(async ([endpoint, url]) => {
        console.log(`Fetching from ${endpoint}: ${String(url).replace(FMP_API_KEY, 'HIDDEN_API_KEY')}`)
        const response = await fetch(String(url))
        const data = await response.json()
        return { endpoint, data, status: response.status }
      })
    )

    // Process responses
    for (const { endpoint, data, status } of responses) {
      if (status !== 200 || !data || (Array.isArray(data) && data.length === 0)) {
        console.warn(`No data found for ${endpoint}, status: ${status}`)
        results[endpoint] = null
      } else {
        // For consistent format, if data is an array take the first element
        results[endpoint] = Array.isArray(data) ? data[0] : data
      }
    }

    // Check if we have at least one successful result
    const hasData = Object.values(results).some(result => result !== null)
    
    if (!hasData) {
      throw new Error(`No data found for symbol: ${symbol}`)
    }

    const apiResponse: ApiResponse = {
      status: 'success',
      data: results
    }

    return new Response(JSON.stringify(apiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Error processing request:', error.message)
    
    const apiResponse: ApiResponse = {
      status: 'error',
      error: error.message
    }
    
    return new Response(JSON.stringify(apiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 