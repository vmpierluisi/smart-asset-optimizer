
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

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

    // **Enhanced Prompt for OpenAI**
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

    2. For each stock in the portfolio:
       - Key characteristics (market cap, sector, business model)
       - Recent performance relative to the market
       - Current analyst consensus (if available)

    3. Explain how these stocks work together as a portfolio - discuss diversification benefits or concentration risks.

    4. Provide your professional opinion on the portfolio's risk/reward profile based on the metrics.

    Format your response in markdown with clear headings for each section. Include links to important recent news articles for each stock discussed.
    `;

    if (!openAIApiKey) {
      throw new Error("OpenAI API key is missing");
    }

    // Create a ReadableStream
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the fetch to OpenAI in the background
    const fetchPromise = fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        messages: [
          { role: "system", content: "You are a financial analyst that provides comprehensive, detailed stock analysis with supporting news article links." },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
        stream: true, // Enable streaming
        web_search_options: {
          search_context_size: "low",
        },
      }),
    });

    // Process the OpenAI response as a stream
    fetchPromise.then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API Error:", errorText);
        writer.write(new TextEncoder().encode(`error: ${errorText}`));
        writer.close();
        return;
      }

      // Get the response body as a ReadableStream
      const reader = response.body?.getReader();
      if (!reader) {
        writer.write(new TextEncoder().encode("error: Failed to get stream reader"));
        writer.close();
        return;
      }

      let analysisText = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk
          const chunk = new TextDecoder().decode(value);
          
          // Process the chunk (OpenAI sends "data: {...}" lines)
          const lines = chunk.split("\n").filter(line => line.trim() !== "");
          
          for (const line of lines) {
            // Skip lines that don't start with "data: "
            if (!line.startsWith("data: ")) continue;
            
            // Check for the "[DONE]" message
            if (line === "data: [DONE]") continue;
            
            try {
              // Parse the JSON data
              const jsonData = JSON.parse(line.substring(6)); // Remove "data: " prefix
              
              if (jsonData.choices && jsonData.choices.length > 0) {
                const content = jsonData.choices[0].delta.content;
                if (content) {
                  analysisText += content;
                  // Write the content to our output stream
                  writer.write(new TextEncoder().encode(content));
                }
              }
            } catch (e) {
              console.error("Error parsing JSON from stream:", e, "Line:", line);
            }
          }
        }
      } catch (e) {
        console.error("Error reading stream:", e);
        writer.write(new TextEncoder().encode(`error: ${e.message}`));
      } finally {
        writer.close();
        console.log("Analysis completed, stream closed");
      }
    }).catch(error => {
      console.error("Fetch error:", error);
      writer.write(new TextEncoder().encode(`error: ${error.message}`));
      writer.close();
    });

    // Return the stream to the client
    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error processing portfolio analysis:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
