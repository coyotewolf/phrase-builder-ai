import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordRequest {
  words: string[];
  level?: string;
  limits?: {
    synonyms?: number;
    antonyms?: number;
    examples?: number;
  };
}

interface WordDetail {
  headword: string;
  part_of_speech?: string;
  definition_en: string;
  synonyms?: string[];
  antonyms?: string[];
  examples?: string[];
  ipa?: string;
  register?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { words, level = "TOEFL", limits = {} }: WordRequest = await req.json();
    
    if (!words || words.length === 0) {
      return new Response(
        JSON.stringify({ error: "No words provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const maxSynonyms = limits.synonyms || 6;
    const maxAntonyms = limits.antonyms || 6;
    const maxExamples = limits.examples || 3;

    const prompt = `You are a vocabulary learning assistant. For each word provided, generate detailed learning information suitable for ${level} level students.

For the following words: ${words.join(", ")}

Return a JSON array with the following structure for each word:
{
  "headword": "the word",
  "part_of_speech": "noun/verb/adjective/adverb",
  "definition_en": "clear English definition",
  "synonyms": ["up to ${maxSynonyms} synonyms"],
  "antonyms": ["up to ${maxAntonyms} antonyms"],
  "examples": ["${maxExamples} natural example sentences"],
  "ipa": "IPA pronunciation",
  "register": "formal/informal/neutral",
  "notes": "any useful memory tips or usage notes"
}

Requirements:
- Definitions should be clear and appropriate for ${level} level
- Examples should be natural and demonstrate typical usage
- Include IPA pronunciation notation
- Keep synonyms and antonyms relevant and commonly used
- Provide practical memory tips in notes when helpful

Return ONLY valid JSON array, no additional text.`;

    console.log("Calling Gemini API for words:", words);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate word details", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("Gemini API response received");

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      console.error("No text generated from Gemini");
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from the response (handle markdown code blocks if present)
    let jsonText = generatedText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "");
    }

    const wordDetails: WordDetail[] = JSON.parse(jsonText);
    console.log("Successfully parsed word details for", wordDetails.length, "words");

    return new Response(
      JSON.stringify({ success: true, data: wordDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-word-details:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
