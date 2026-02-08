import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ActionRequest {
  action: string;
  gameState: any;
  currentLocation: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, gameState, currentLocation }: ActionRequest = await req.json();
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");

    if (!mistralApiKey) {
      throw new Error("MISTRAL_API_KEY not configured");
    }

    const prompt = `You are the narrator for "Echo Manor Mysteries," a Victorian gothic murder mystery game. A player has taken an action.

CURRENT GAME STATE:
Location: ${currentLocation}
Available Rooms: ${gameState.rooms?.join(", ") || "Unknown"}
Known Suspects: ${gameState.suspects?.map((s: any) => s.name).join(", ") || "Unknown"}
Available Weapons: ${gameState.weapons?.join(", ") || "Unknown"}

PLAYER ACTION: "${action}"

Generate a narrative response (2-4 paragraphs) that:
1. Describes what happens as the player performs this action
2. Uses atmospheric, gothic Victorian language
3. May reveal clues, red herrings, or ambient details
4. If the action involves moving to a new location, describe the new room vividly
5. If examining something specific, provide sensory details
6. Occasionally hint at suspects' behaviors or hidden passages
7. Keep the mystery alive - don't give away the solution

Respond with ONLY valid JSON in this format (no markdown):
{
  "narrative": "Your atmospheric narrative response here",
  "clueFound": "A specific clue discovered (or empty string if none)",
  "newLocation": "Room name if player moved (or empty string if staying put)",
  "evidenceSignificance": "low/medium/high - how important is any clue found"
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
        temperature: 0.8,
        max_tokens: 800,
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
        narrative: content,
        clueFound: "",
        newLocation: "",
        evidenceSignificance: "low"
      };
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error processing action:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process action",
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
