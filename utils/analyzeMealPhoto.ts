import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

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
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  console.log('[analyzeMealPhoto] Sending to OpenAI vision...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a nutrition assistant for a portion tracking app. Analyse the meal photo and return a JSON object with:
- "description": a 1-2 sentence description of what you see
- "portions": an object with integer portion counts (0 or more) for each of these food groups based on what is visible in the meal:
  - "protein" (meat, fish, eggs, legumes, tofu)
  - "veggies" (vegetables, salad)
  - "fruits" (fruit, fruit juice)
  - "wholeGrains" (bread, rice, pasta, oats, cereals)
  - "nutsSeeds" (nuts, seeds, nut butter)
  - "fats" (oils, avocado, butter, cheese, cream)
  - "water" (water, herbal tea — not other drinks)
Return ONLY valid JSON. Example: {"description":"A grilled chicken salad with brown rice","portions":{"protein":2,"veggies":2,"fruits":0,"wholeGrains":1,"nutsSeeds":0,"fats":1,"water":0}}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
            { type: 'text', text: 'Analyse this meal and return the JSON.' },
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
  const content = data?.choices?.[0]?.message?.content ?? '';
  console.log('[analyzeMealPhoto] Raw response:', content);

  const parsed: MealPortionSuggestions = JSON.parse(content);
  return parsed;
}
