import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Accept, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

interface MysterySetup {
  suspects: Array<{
    name: string;
    occupation: string;
    personality: string;
    motive: string;
    alibi: string;
  }>;
  rooms: string[];
  weapons: string[];
  truth: {
    killer: string;
    weapon: string;
    location: string;
    motive: string;
  };
  initialNarrative: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight immediately
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");

    if (!mistralApiKey) {
      throw new Error("MISTRAL_API_KEY not configured");
    }

    const prompt = `You are a master mystery writer creating a unique murder mystery for "Echo Manor Mysteries" - a Victorian gothic detective game.

Generate a complete murder mystery with the following structure (respond ONLY with valid JSON, no markdown):

{
  "suspects": [
    {
      "name": "Full Name",
      "occupation": "Their role/job",
      "personality": "Brief personality description",
      "motive": "Potential reason they might be involved",
      "alibi": "Their claimed whereabouts"
    }
  ],
  "rooms": ["Room Name 1", "Room Name 2", ...],
  "weapons": ["Weapon 1", "Weapon 2", ...],
  "truth": {
    "killer": "Name of the actual killer (must match a suspect name exactly)",
    "weapon": "The actual murder weapon (must match a weapon exactly)",
    "location": "Where the murder occurred (must match a room exactly)",
    "motive": "The true motive behind the crime"
  },
  "initialNarrative": "An atmospheric opening scene describing the player arriving at Echo Manor and discovering the body. Set the gothic, mysterious tone. 3-4 paragraphs."
}

Requirements:
- Create exactly 6 unique suspects with distinct personalities and credible motives
- Include 8-10 atmospheric rooms fitting a Victorian manor (library, conservatory, wine cellar, etc.)
- Provide 6-8 potential weapons (some mundane, some unusual)
- The truth must be logically consistent
- Make it gothic, atmospheric, and intriguing
- Names must match exactly between suspects and truth.killer`;

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
        temperature: 0.9,
        max_tokens: 2500,
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

    let mysterySetup: MysterySetup;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      mysterySetup = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse Mistral response:", content);
      throw new Error(`Failed to parse mystery setup: ${parseError.message}`);
    }

    return new Response(JSON.stringify(mysterySetup), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating mystery:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate mystery",
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
