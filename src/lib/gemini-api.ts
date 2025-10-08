/**
 * Gemini API client for generating word details
 */

export interface WordMeaning {
  part_of_speech: string;
  definition_zh?: string;
  definition_en: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  register?: string;
}

export interface WordDetail {
  headword: string;
  ipa?: string;
  meanings: WordMeaning[];
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
1. IPA pronunciation
2. All major parts of speech (if a word has multiple uses like noun and verb)
3. For EACH part of speech, provide:
   - Chinese definition (Traditional Chinese, 繁體中文)
   - Clear English definition appropriate for ${level} learners
   - Up to ${limits.synonyms} synonyms (comprehensive, appropriate for ${level})
   - Up to ${limits.antonyms} antonyms (if applicable)
   - Up to ${limits.examples} example sentences
   - Register/formality level
4. Any important usage notes for the word overall

IMPORTANT: 
- If a word has multiple parts of speech (e.g., "test" as noun and verb), create SEPARATE entries in the meanings array
- For each part of speech, provide at least one example sentence
- Try to provide comprehensive synonyms and antonyms within limits
- Make sure all content is appropriate for ${level} learners
- Chinese definitions should be in Traditional Chinese (繁體中文)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "headword": "test",
    "ipa": "/test/",
    "meanings": [
      {
        "part_of_speech": "noun",
        "definition_zh": "測驗；考試",
        "definition_en": "a procedure to establish quality, performance, or reliability",
        "synonyms": ["exam", "examination", "assessment"],
        "antonyms": [],
        "examples": ["She passed her driving test on the first try."],
        "register": "neutral"
      },
      {
        "part_of_speech": "verb",
        "definition_zh": "測試；檢驗",
        "definition_en": "to try or examine something to see if it works",
        "synonyms": ["examine", "check", "try out"],
        "antonyms": [],
        "examples": ["We need to test the new software before release."],
        "register": "neutral"
      }
    ],
    "notes": "Commonly used in both academic and everyday contexts"
  }
]

Important:
- Return ONLY the JSON array, no additional text or markdown
- Include all ${words.length} words in the response
- Each word should have a meanings array with all its major parts of speech
- Provide Chinese definitions in Traditional Chinese
- Keep definitions clear and appropriate for ${level} learners`;

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
