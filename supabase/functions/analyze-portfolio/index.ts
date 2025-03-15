
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

    // Simplified prompt focused on portfolio metrics interpretation
    const prompt = `
    As a financial analyst, please provide a brief explanation of the following portfolio metrics and what they mean for this investment strategy:

    📉 **PORTFOLIO METRICS:**
    - **Expected Return:** ${(metrics.expectedReturn * 100).toFixed(2)}%
    - **Volatility:** $${metrics.volatility.toFixed(2)}
    - **Value at Risk (95%):** $${Math.abs(metrics.var).toFixed(2)}
    - **Expected Shortfall:** $${Math.abs(metrics.es).toFixed(2)}

    🏗 **PORTFOLIO COMPOSITION:**
    ${stocks.map((stock) => `${stock}: ${(weights[stock] * 100).toFixed(2)}%`).join(", ")}

    Please explain:
    1. What each of these metrics means in simple terms
    2. How these values compare to typical market benchmarks
    3. What these metrics suggest about the risk level of this portfolio
    4. Any recommendations for improvement based solely on these metrics

    Include relevant links to financial education resources that explain these concepts further.
    Format your response in markdown with clear headings for each section.
    `;

    if (!PERPLEXITY_API_KEY) {
      throw new Error("Perplexity API key is missing");
    }

    console.log("Sending request to Perplexity API");

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the streaming response
    const responsePromise = fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-deep-research",
        messages: [
          { role: "system", content: "You are a financial analyst that provides concise portfolio metrics analysis with supporting links to educational resources." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 0.9,
        stream: true,
      }),
    });

    // Handle the streaming response in a separate async function
    (async () => {
      try {
        const response = await responsePromise;
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Perplexity API error:", errorText);
          writer.write(encoder.encode(JSON.stringify({ error: `API error: ${response.status} ${response.statusText}` })));
          writer.close();
          return;
        }

        if (!response.body) {
          writer.write(encoder.encode(JSON.stringify({ error: "No response body" })));
          writer.close();
          return;
        }

        const reader = response.body.getReader();
        let analysisText = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Parse the chunk as a string
          const chunk = new TextDecoder().decode(value);
          
          try {
            // Process each line in the chunk (each line is a JSON object)
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              // Remove the "data: " prefix if present
              const jsonStr = line.replace(/^data: /, '');
              
              // Skip "[DONE]" message
              if (jsonStr.trim() === '[DONE]') continue;
              
              try {
                const parsedData = JSON.parse(jsonStr);
                
                if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                  const contentDelta = parsedData.choices[0].delta.content;
                  analysisText += contentDelta;
                  
                  // Send the delta to the client
                  writer.write(encoder.encode(`data: ${JSON.stringify({ delta: contentDelta, text: analysisText })}\n\n`));
                }
              } catch (parseError) {
                console.error("Error parsing JSON in stream:", parseError, "Raw data:", jsonStr);
              }
            }
          } catch (error) {
            console.error("Error processing chunk:", error);
          }
        }
        
        // Send a final message to indicate the stream is complete
        writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, analysis: analysisText })}\n\n`));
        writer.close();
      } catch (error) {
        console.error("Streaming error:", error);
        writer.write(encoder.encode(JSON.stringify({ error: error.message })));
        writer.close();
      }
    })();

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
