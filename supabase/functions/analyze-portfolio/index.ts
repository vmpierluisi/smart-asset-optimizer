
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    // **Prompt for OpenAI**
    const prompt = `
    You are a portfolio analyst assistant. Please analyze the following portfolio optimization results and provide insights in easy-to-understand language:

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
    1. A summary of how the optimized portfolio performed compared to the benchmark.
    2. Insights into why the portfolio performed the way it did, identifying key stocks driving performance.
    3. Possible external factors (e.g., economic news) that might explain the performance of key stocks.
    4. A simple recommendation based on this analysis.

    📰 If relevant, include links to recent financial news about the stocks.
    `;

    if (!openAIApiKey) {
      throw new Error("OpenAI API key is missing");
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a financial analyst that explains portfolio performance in simple terms." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenAI API Error: ${data.error.message}`);
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
