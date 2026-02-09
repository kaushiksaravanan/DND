import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept, X-Requested-With',
    'Access-Control-Max-Age': '86400',
};

// Consistent character prompt
const HIGGSFIELD_SOUL_PROMPT =
    "A Higgsfield Soul entity, spectral and ethereal, composed of glowing particles (blue/gold for neutral, red/purple for tense). " +
    "Abstract humanoid shape, mysterious, high-concept digital art, cinematic lighting, 8k resolution. ";

serve(async (req) => {
    // Handle CORS preflight immediately
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const { prompt, mood } = await req.json();

        // Check for OpenAI API Key
        const openAiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAiKey) {
            console.warn("Missing OPENAI_API_KEY");
            return new Response(
                JSON.stringify({
                    error: "Missing API Key",
                    image_url: null
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Construct full prompt
        const fullPrompt = `${HIGGSFIELD_SOUL_PROMPT} Scene: ${prompt}. Mood: ${mood}. Style: Ethereal particle system art.`;

        // Call OpenAI DALL-E 3
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: fullPrompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                response_format: "url",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API Error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const imageUrl = data.data[0].url;

        return new Response(
            JSON.stringify({ image_url: imageUrl }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message, image_url: null }),
            {
                status: 200, // Return 200 to avoid breaking frontend, just no image
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
