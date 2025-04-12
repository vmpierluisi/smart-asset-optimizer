import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY')
const POLYGON_BASE_URL = 'https://api.polygon.io'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) throw new Error('Missing stock symbol')
    
    // Check API key
    if (!POLYGON_API_KEY) {
      console.warn('Missing Polygon API key - RSI data will be unavailable')
      return new Response(
        JSON.stringify({ 
          error: 'Polygon API key is missing',
          rsiValues: null,
          averageRsi: null
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Polygon API request URL for RSI
    const timespan = 'day'
    const adjusted = true
    const window = 14 // Standard RSI period
    const seriesType = 'close'
    const order = 'desc'
    const limit = 10 // Fetch 10 most recent values
    
    const url = `${POLYGON_BASE_URL}/v1/indicators/rsi/${symbol}?timespan=${timespan}&adjusted=${adjusted}&window=${window}&series_type=${seriesType}&order=${order}&limit=${limit}&apiKey=${POLYGON_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error fetching RSI from Polygon for ${symbol}: ${response.status} ${errorText}`)
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch RSI data: ${response.status}`,
          rsiValues: null,
          averageRsi: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    const data = await response.json()
    
    // Extract the RSI values from the response structure
    if (data && data.results && data.results.values && Array.isArray(data.results.values)) {
      // Get all the values from the array (up to limit)
      const rsiValues = data.results.values.map((item: { value: number }) => item.value)
      
      // Calculate the average of all values
      if (rsiValues.length > 0) {
        const sum = rsiValues.reduce((acc: number, val: number) => acc + val, 0)
        const average = sum / rsiValues.length
        
        return new Response(
          JSON.stringify({
            rsiValues,
            averageRsi: Number(average.toFixed(2)) // Average rounded to 2 decimal places
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    }
    
    // If we couldn't get the RSI values from the response
    return new Response(
      JSON.stringify({ 
        error: 'Could not extract RSI values from Polygon response',
        rsiValues: null,
        averageRsi: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )

  } catch (error) {
    console.error('Error processing request:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 