import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

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

  const backendUrl = Constants.expoConfig?.extra?.backendUrl as string | undefined;
  const url = __DEV__
    ? '/analyze-meal-photo'
    : `${backendUrl}/analyze-meal-photo`;

  console.log('[analyzeMealPhoto] Sending to backend:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64: base64 }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[analyzeMealPhoto] Backend error:', response.status, err);
    throw new Error('AI analysis failed. Please try again.');
  }

  const data: MealPortionSuggestions = await response.json();
  console.log('[analyzeMealPhoto] Response:', data.description);
  return data;
}
