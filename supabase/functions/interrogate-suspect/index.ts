import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InterrogationRequest {
  suspectName: string;
  question: string;
  suspectInfo: any;
  mysteryTruth: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { suspectName, question, suspectInfo, mysteryTruth }: InterrogationRequest = await req.json();
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");

    if (!mistralApiKey) {
      throw new Error("MISTRAL_API_KEY not configured");
    }

    const isGuilty = mysteryTruth.killer === suspectName;

    const prompt = `You are roleplaying as ${suspectName}, a suspect in a Victorian murder mystery at Echo Manor.

YOUR CHARACTER PROFILE:
Name: ${suspectInfo.name}
Occupation: ${suspectInfo.occupation}
Personality: ${suspectInfo.personality}
Stated Motive: ${suspectInfo.motive}
Alibi: ${suspectInfo.alibi}

SECRET INFORMATION (you must protect if guilty, but may accidentally hint at):
${isGuilty ? `YOU ARE THE KILLER. The murder was committed with: ${mysteryTruth.weapon} in: ${mysteryTruth.location}. True motive: ${mysteryTruth.motive}` : `You are INNOCENT. The real killer is ${mysteryTruth.killer}.`}

PLAYER'S QUESTION: "${question}"

Respond to the player's question IN CHARACTER. Your response should:
1. Match your personality (nervous, arrogant, timid, defensive, etc.)
2. If innocent: Be genuinely helpful but possibly nervous or evasive about unrelated secrets
3. If guilty: Deflect, provide partial truths, show subtle tells (e.g., fidgeting, changing subject)
4. Use Victorian-era speech patterns and vocabulary
5. Occasionally volunteer small details to seem cooperative
6. React emotionally if accused directly
7. Keep response to 2-4 paragraphs

Respond with ONLY valid JSON (no markdown):
{
  "dialogue": "Your in-character response as ${suspectName}",
  "suspicionLevel": "low/medium/high - how suspicious your behavior seems",
  "hintRevealed": "Any subtle clue or inconsistency in your story (or empty string)"
}`;

    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.85,
        max_tokens: 700,
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      throw new Error(`Mistral API error: ${mistralResponse.status} - ${errorText}`);
    }

    const mistralData = await mistralResponse.json();
    const content = mistralData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from Mistral API");
    }

    let response;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      response = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse Mistral response:", content);
      response = {
        dialogue: content,
        suspicionLevel: "medium",
        hintRevealed: ""
      };
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error during interrogation:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process interrogation",
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
