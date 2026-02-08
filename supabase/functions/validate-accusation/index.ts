import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AccusationRequest {
  accusation: {
    killer: string;
    weapon: string;
    location: string;
  };
  mysteryTruth: {
    killer: string;
    weapon: string;
    location: string;
    motive: string;
  };
  gameState: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { accusation, mysteryTruth, gameState }: AccusationRequest = await req.json();
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");

    if (!mistralApiKey) {
      throw new Error("MISTRAL_API_KEY not configured");
    }

    const killerCorrect = accusation.killer.toLowerCase().trim() === mysteryTruth.killer.toLowerCase().trim();
    const weaponCorrect = accusation.weapon.toLowerCase().trim() === mysteryTruth.weapon.toLowerCase().trim();
    const locationCorrect = accusation.location.toLowerCase().trim() === mysteryTruth.location.toLowerCase().trim();

    const isCorrect = killerCorrect && weaponCorrect && locationCorrect;

    const prompt = `You are the narrator for "Echo Manor Mysteries," a Victorian gothic murder mystery game. The player has made their final accusation.

PLAYER'S ACCUSATION:
Killer: ${accusation.killer}
Weapon: ${accusation.weapon}
Location: ${accusation.location}

THE TRUTH:
Killer: ${mysteryTruth.killer}
Weapon: ${mysteryTruth.weapon}
Location: ${mysteryTruth.location}
Motive: ${mysteryTruth.motive}

RESULT: ${isCorrect ? 'CORRECT - Player wins!' : 'INCORRECT - Player loses'}

Write a dramatic concluding narrative (3-5 paragraphs) that:
${isCorrect ? `
1. Reveals how the player brilliantly solved the case
2. Describes the killer's confession and the true motive
3. Explains how the crime was committed with the weapon in that location
4. Praises the player's deductive skills in gothic Victorian prose
5. Ends with a triumphant but atmospheric conclusion
` : `
1. Reveals the player was WRONG
2. Explains what actually happened (the true killer, weapon, location)
3. Describes how the real killer escaped or was caught by the authorities
4. Points out where the player's deduction went astray
5. Ends with a melancholic but respectful tone about the difficulty of the case
`}

Use atmospheric, Victorian gothic language throughout.

Respond with ONLY valid JSON (no markdown):
{
  "isCorrect": ${isCorrect},
  "narrative": "Your dramatic concluding narrative here",
  "correctElements": {
    "killer": ${killerCorrect},
    "weapon": ${weaponCorrect},
    "location": ${locationCorrect}
  }
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
        max_tokens: 1000,
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
        isCorrect,
        narrative: content,
        correctElements: {
          killer: killerCorrect,
          weapon: weaponCorrect,
          location: locationCorrect
        }
      };
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error validating accusation:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to validate accusation",
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
