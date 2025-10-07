/**
 * Gemini API client for generating word details
 */

export interface WordDetail {
  word: string;
  definition: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  pronunciation: string;
}

export async function generateWordDetails(
  words: string[],
  apiKey: string,
  level: string = 'intermediate',
  maxExamples: number = 3,
  maxSynonyms: number = 5,
  maxAntonyms: number = 3
): Promise<WordDetail[]> {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  const prompt = `You are a vocabulary learning assistant. Generate detailed information for the following words at ${level} level.

Words: ${words.join(', ')}

For each word, provide:
1. A clear and concise definition
2. Up to ${maxExamples} example sentences showing the word in context
3. Up to ${maxSynonyms} synonyms
4. Up to ${maxAntonyms} antonyms (if applicable)
5. Pronunciation in IPA format

Return ONLY a valid JSON array with this exact structure:
[
  {
    "word": "example",
    "definition": "a thing characteristic of its kind",
    "examples": ["This is an example sentence.", "Another example here."],
    "synonyms": ["sample", "instance", "illustration"],
    "antonyms": ["exception", "rule"],
    "pronunciation": "/ɪɡˈzæmpəl/"
  }
]

Important:
- Return ONLY the JSON array, no additional text
- Include all ${words.length} words in the response
- Keep definitions clear and appropriate for ${level} learners
- Provide practical, real-world example sentences
- If a word has no common antonyms, use an empty array`;

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
          maxOutputTokens: 2048,
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
