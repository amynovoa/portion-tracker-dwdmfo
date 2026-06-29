import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_API_KEY = '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';

export interface MealPortionSuggestions {
  description: string;
  portions: {
    protein: number;
    veggies: number;
    fruits: number;
    wholeGrains: number;
    nutsSeeds: number;
    fats: number;
    water: number;
  };
}

export async function analyzeMealPhoto(imageUri: string): Promise<MealPortionSuggestions> {
  console.log('[analyzeMealPhoto] Reading image as base64...');
  const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  console.log('[analyzeMealPhoto] Sending to OpenAI for analysis...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this meal photo and estimate the portion sizes for each food group. Return ONLY valid JSON in this exact format, no markdown, no explanation:
{"description":"brief meal description","portions":{"protein":0,"veggies":0,"fruits":0,"wholeGrains":0,"nutsSeeds":0,"fats":0,"water":0}}
Portions are a number from 0-10 representing servings. Be realistic based on what you see.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'low',
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[analyzeMealPhoto] OpenAI error:', response.status, err);
    throw new Error('AI analysis failed. Please try again.');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const parsed: MealPortionSuggestions = JSON.parse(content);
  return parsed;
}
