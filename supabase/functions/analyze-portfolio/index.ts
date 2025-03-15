
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    console.log("Received data:", body);

    const { portfolioData, benchmarkData, stocks, weights, metrics } = body;

    // Portfolio performance calculations
    const portfolioPerformance = {
      startValue: portfolioData[0].value,
      endValue: portfolioData[portfolioData.length - 1].value,
      percentageChange:
        ((portfolioData[portfolioData.length - 1].value - portfolioData[0].value) / portfolioData[0].value) * 100,
    };

    // Benchmark performance calculations
    const benchmarkPerformance = {
      startValue: benchmarkData[0],
      endValue: benchmarkData[benchmarkData.length - 1],
      percentageChange: ((benchmarkData[benchmarkData.length - 1] - benchmarkData[0]) / benchmarkData[0]) * 100,
    };

    // Stock weight summary
    const stockWeightsSummary = stocks
      .map((stock) => `${stock}: ${(weights[stock] * 100).toFixed(2)}%`)
      .join(", ");

    // Updated prompt for Perplexity
    const prompt = `
    You are a professional portfolio analyst assistant with access to the latest financial news and data. Please analyze the following portfolio optimization results and provide detailed insights:

    📈 **PORTFOLIO PERFORMANCE:**
    - Start value: **$${portfolioPerformance.startValue.toFixed(2)}**
    - End value: **$${portfolioPerformance.endValue.toFixed(2)}**
    - **Percentage change:** ${portfolioPerformance.percentageChange.toFixed(2)}%

    📊 **BENCHMARK PERFORMANCE (S&P 500):**
    - Start value: **$${benchmarkPerformance.startValue.toFixed(2)}**
    - End value: **$${benchmarkPerformance.endValue.toFixed(2)}**
    - **Percentage change:** ${benchmarkPerformance.percentageChange.toFixed(2)}%

    🏗 **PORTFOLIO COMPOSITION:**
    ${stockWeightsSummary}

    📉 **RISK METRICS:**
    - **Expected Return:** ${(metrics.expectedReturn * 100).toFixed(2)}%
    - **Volatility:** $${metrics.volatility.toFixed(2)}
    - **Value at Risk (95%):** $${Math.abs(metrics.var).toFixed(2)}
    - **Expected Shortfall:** $${Math.abs(metrics.es).toFixed(2)}

    🔎 **STOCKS IN PORTFOLIO:** ${stocks.join(", ")}

    ---
    💡 **Please provide:**
    1. A detailed summary of how the optimized portfolio performed compared to the benchmark. Interpret the Expected Return, Volatility, Value at Risk and the Expected Shortfall.

    2. For each individual stock in the portfolio (${stocks.join(", ")}), provide specific information about:
       - Recent price movements and performance
       - Notable product launches or company initiatives
       - Most recent earnings results (beats, misses, or in-line)
       - Any earnings revisions by analysts
       - Significant investments or strategic moves
       - Major partnerships or acquisitions
       - Key management changes
       - Regulatory issues or legal developments
       - Recent analyst ratings changes (buy, sell, hold reccomendations)
       - Include links to important recent news articles for each stock discussed

    3. Explain external market factors that might have influenced these stocks during this period.

    4. Provide a summary of stock and portfolio performance.

    Format your response in markdown with clear headings for each section. For news article links, include the source name and publication date where possible, e.g., "[Title of Article](link) - Bloomberg (May 15, 2023)".
    `;

    if (!PERPLEXITY_API_KEY) {
      throw new Error("Perplexity API key is missing");
    }

    console.log("Sending request to Perplexity API");

    // Call Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-reasoning-pro",
        messages: [
          { role: "system", content: "You are a financial analyst that provides comprehensive, detailed stock analysis with supporting news article links." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", errorText);
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Perplexity API response received");

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from Perplexity API");
    }

    return new Response(JSON.stringify({ analysis: data.choices[0].message.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing portfolio analysis:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
