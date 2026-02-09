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
      console.error("MISTRAL_API_KEY not configured in Supabase secrets");
      throw new Error("MISTRAL_API_KEY not configured. Please set it using: supabase secrets set MISTRAL_API_KEY=your_key");
    }

    console.log("Generating mystery with Mistral AI...");

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
      console.error("Mistral API error:", errorText);
      throw new Error(`Mistral API error: ${mistralResponse.status} - ${errorText}`);
    }

    console.log("Mistral API response received successfully");

    const mistralData = await mistralResponse.json();
    const content = mistralData.choices[0]?.message?.content;

    if (!content) {
      console.error("No content in Mistral response:", JSON.stringify(mistralData));
      throw new Error("No content received from Mistral API");
    }

    console.log("Parsing mystery data...");
    let mysterySetup: MysterySetup;
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      mysterySetup = JSON.parse(cleanedContent);
      console.log("Mystery generated successfully:", mysterySetup.suspects?.length || 0, "suspects");
    } catch (parseError) {
      console.error("Failed to parse Mistral response:", content.substring(0, 200));
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
    
    // Provide more specific error messages
    let errorMessage = error.message || "Failed to generate mystery";
    let statusCode = 500;
    
    if (error.message?.includes("MISTRAL_API_KEY")) {
      statusCode = 500;
      errorMessage = "Server configuration error: Mistral API key not set. Please contact administrator.";
    } else if (error.message?.includes("Mistral API error")) {
      statusCode = 502;
      errorMessage = "AI service error: " + error.message;
    } else if (error.message?.includes("Failed to parse")) {
      statusCode = 500;
      errorMessage = "AI response parsing error: " + error.message;
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
