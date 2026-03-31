t · JS
Copy

// api/chat.js
// Vercel serverless function — proxies requests to Anthropic
// Your API key lives in Vercel's environment variables, never in the browser
 
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
 
  const { messages, context } = req.body;
 
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request" });
  }
 
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }
 
  const system = `You are a helpful assistant for the DPI Knowledge Hub, a curated resource library on Digital Public Infrastructure. Answer questions using the resources below as your primary reference. Be concise, cite resource titles when relevant, and format your responses clearly.
 
RESOURCES IN THE LIBRARY:
${context || "No resources provided."}`;
 
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system,
        messages,
      }),
    });
 
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || "Anthropic API error" });
    }
 
    const data = await response.json();
    const reply = data.content?.[0]?.text || "";
 
    // Allow requests from your GitHub Pages domain
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
    return res.status(200).json({ reply });
 
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
