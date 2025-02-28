
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Correctly retrieve the API key from environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolioData, benchmarkData, stocks, weights, metrics } = await req.json();

    // Prepare the data for the prompt
    const portfolioPerformance = {
      startValue: portfolioData[0].value,
      endValue: portfolioData[portfolioData.length - 1].value,
      percentageChange: ((portfolioData[portfolioData.length - 1].value - portfolioData[0].value) / portfolioData[0].value) * 100
    };

    const benchmarkPerformance = {
      startValue: benchmarkData[0],
      endValue: benchmarkData[benchmarkData.length - 1],
      percentageChange: ((benchmarkData[benchmarkData.length - 1] - benchmarkData[0]) / benchmarkData[0]) * 100
    };

    // Create summary of each stock's weight
    const stockWeightsSummary = stocks.map((stock, i) => {
      return `${stock}: ${(weights[stock] * 100).toFixed(2)}%`;
    }).join(', ');

    // Create the prompt
    const prompt = `
    You are a portfolio analyst assistant. Please analyze the following portfolio optimization results and provide insights in easy-to-understand language:

    PORTFOLIO PERFORMANCE:
    - Portfolio start value: $${portfolioPerformance.startValue.toFixed(2)}
    - Portfolio end value: $${portfolioPerformance.endValue.toFixed(2)}
    - Percentage change: ${portfolioPerformance.percentageChange.toFixed(2)}%

    BENCHMARK PERFORMANCE (S&P 500):
    - Benchmark start value: $${benchmarkPerformance.startValue.toFixed(2)}
    - Benchmark end value: $${benchmarkPerformance.endValue.toFixed(2)}
    - Percentage change: ${benchmarkPerformance.percentageChange.toFixed(2)}%

    PORTFOLIO COMPOSITION:
    ${stockWeightsSummary}

    RISK METRICS:
    - Expected Return: ${(metrics.expectedReturn * 100).toFixed(2)}%
    - Volatility: $${metrics.volatility.toFixed(2)}
    - Value at Risk (95%): $${Math.abs(metrics.var).toFixed(2)}
    - Expected Shortfall: $${Math.abs(metrics.es).toFixed(2)}

    STOCKS IN PORTFOLIO: ${stocks.join(', ')}

    Please provide:
    1. A summary of how the optimized portfolio performed compared to the benchmark (S&P 500)
    2. Insights about why the portfolio performed the way it did, identifying which stocks were the main drivers
    3. Potential reasons (including possible news events) that might explain the performance of key stocks
    4. A simple recommendation based on this analysis

    Format your response in a conversational, easy-to-understand way with separate sections. Include relevant links to news sources if possible when mentioning news events.
    `;

    // Check if API key exists
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful financial analyst that explains portfolio performance in simple terms.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OpenAI API Error: ${data.error.message}`);
    }

    const analysisText = data.choices[0].message.content;

    return new Response(JSON.stringify({ analysis: analysisText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-portfolio function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});