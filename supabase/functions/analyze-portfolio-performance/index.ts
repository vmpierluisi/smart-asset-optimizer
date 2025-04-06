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
    console.log("Received data for performance analysis:", body);

    const { portfolioData, benchmarkData, allBenchmarksData, benchmarkSymbols } = body;

    // Portfolio performance calculations
    const portfolioPerformance = {
      startValue: portfolioData[0].value,
      endValue: portfolioData[portfolioData.length - 1].value,
      percentageChange:
        ((portfolioData[portfolioData.length - 1].value - portfolioData[0].value) / portfolioData[0].value) * 100,
    };

    // Benchmark performance calculations
    const primaryBenchmark = benchmarkSymbols[0] || "SPY";
    const benchmarkPerformance = {
      startValue: benchmarkData[0],
      endValue: benchmarkData[benchmarkData.length - 1],
      percentageChange: ((benchmarkData[benchmarkData.length - 1] - benchmarkData[0]) / benchmarkData[0]) * 100,
    };

    // Enhanced Prompt for OpenAI - Focus on Portfolio and Benchmark Performance
    const prompt = `

    📈 **PORTFOLIO PERFORMANCE:**
    - Start value: **$${portfolioPerformance.startValue.toFixed(2)}**
    - End value: **$${portfolioPerformance.endValue.toFixed(2)}**
    - **Percentage change:** ${portfolioPerformance.percentageChange.toFixed(2)}%

    📉 **BENCHMARK PERFORMANCE (${primaryBenchmark}):**
    - Start value: **$${benchmarkPerformance.startValue.toFixed(2)}**
    - End value: **$${benchmarkPerformance.endValue.toFixed(2)}**
    - **Percentage change:** ${benchmarkPerformance.percentageChange.toFixed(2)}%

    ${benchmarkSymbols.length > 1 ? `Additional benchmarks: ${benchmarkSymbols.slice(1).join(", ")}` : ""}

    ---
    💡 **Please provide:**
    A detailed comparison of how the portfolio performed against the benchmark(s). Include relevant metrics and insights about performance trends. Structure your response in markdown with clear sections:
    
    1. ## Portfolio Performance
       A detailed analysis of the portfolio's performance
    
    2. ## Benchmark Performance
       A detailed analysis of the benchmark's performance
    
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
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a financial analyst that provides comprehensive, detailed portfolio performance analysis for a non technical audience. Make it intuitive and accessible. Format your response in markdown with clear headings for each section. Avoid repetition of the same information." },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
        stream: true, // Enable streaming
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
        console.log("Performance analysis completed, stream closed");
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
    console.error("Error processing portfolio performance analysis:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 