import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

// Server-side backend URL (Liquid Backend), injected into app.json by Newly.
const BACKEND_URL = (Constants.expoConfig?.extra?.backendUrl as string | undefined) ?? '';

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
    alcohol: number;
  };
}

export async function analyzeMealPhoto(imageUri: string): Promise<MealPortionSuggestions> {
  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured.');
  }

  console.log('[analyzeMealPhoto] Reading image as base64...');
  const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  console.log('[analyzeMealPhoto] Sending to backend for analysis...');
  const response = await fetch(`${BACKEND_URL}/analyze-meal-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[analyzeMealPhoto] Backend error:', response.status, err);
    throw new Error('AI analysis failed. Please try again.');
  }

  const parsed: MealPortionSuggestions = await response.json();
  return parsed;
}
