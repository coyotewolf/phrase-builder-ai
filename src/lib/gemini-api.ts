/**
 * Gemini API client for generating word details
 */

export interface WordDetail {
  headword: string;
  part_of_speech?: string;
  definition_en: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  ipa?: string;
  register?: string;
  notes?: string;
}

export interface AIRequestParams {
  level?: string;
  words: string[];
  limits?: {
    synonyms?: number;
    antonyms?: number;
    examples?: number;
  };
  constraints?: string;
}

export async function generateWordDetails(
  params: AIRequestParams,
  apiKey: string
): Promise<WordDetail[]> {
  const {
    words,
    level = 'TOEFL',
    limits = { synonyms: 6, antonyms: 6, examples: 3 },
    constraints = 'natural usage, exam-appropriate, no rare proper nouns'
  } = params;
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const prompt = `You are a vocabulary learning assistant. Generate detailed information for the following words at ${level} level.

Words: ${words.join(', ')}

Constraints: ${constraints}

For each word, provide:
1. Part of speech
2. Clear English definition
3. Up to ${limits.examples} example sentences
4. Up to ${limits.synonyms} synonyms
5. Up to ${limits.antonyms} antonyms (if applicable)
6. IPA pronunciation
7. Register/formality level (e.g., formal, informal, academic)
8. Any important usage notes

Return ONLY a valid JSON array with this exact structure:
[
  {
    "headword": "rescind",
    "part_of_speech": "verb",
    "definition_en": "to cancel or repeal officially",
    "synonyms": ["revoke", "repeal", "annul"],
    "antonyms": ["enact", "authorize"],
    "examples": ["The board voted to rescind the policy.", "They rescinded his offer after the background check."],
    "ipa": "/rɪˈsɪnd/",
    "register": "formal",
    "notes": "Often used in legal or official contexts"
  }
]

Important:
- Return ONLY the JSON array, no additional text or markdown
- Include all ${words.length} words in the response
- Keep definitions clear and appropriate for ${level} learners
- Provide practical example sentences
- If a word has no common antonyms, use an empty array
- Include register information (formal/informal/neutral/academic)
- Add usage notes if relevant`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Gemini API error: ${response.status}`
    );
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error('No response from Gemini API');
  }

  // Clean up the response text
  let cleanedText = generatedText.trim();
  
  // Remove markdown code blocks if present
  cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Remove any leading/trailing whitespace
  cleanedText = cleanedText.trim();

  try {
    const wordDetails: WordDetail[] = JSON.parse(cleanedText);
    return wordDetails;
  } catch (error) {
    console.error('Failed to parse Gemini response:', cleanedText);
    throw new Error('Failed to parse word details from Gemini response');
  }
}
