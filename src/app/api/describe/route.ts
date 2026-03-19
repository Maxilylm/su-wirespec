export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return Response.json(
        { error: "Missing or invalid image data" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.2-90b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: 'You are a senior product designer and UI/UX expert. Analyze this wireframe/sketch and generate a detailed product specification. You MUST respond with valid JSON only, no markdown fences. Use this exact structure: { "title": "string", "overview": "string", "components": [{ "name": "string", "type": "string", "description": "string", "interactions": ["string"] }], "userFlow": ["string"], "technicalNotes": ["string"], "accessibilityNotes": ["string"], "estimatedComplexity": "Low|Medium|High" }',
                },
                {
                  type: "image_url",
                  image_url: { url: image },
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Groq API error:", res.status, errBody);
      return Response.json(
        { error: `Groq API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json(
        { error: "No response from model" },
        { status: 502 }
      );
    }

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const spec = JSON.parse(cleaned);
    return Response.json({ spec });
  } catch (err) {
    console.error("Describe API error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
