import { z } from 'zod';
import { generateObject } from 'ai';
import { gateway } from '@specific-dev/framework';
import type { App } from '../index.js';

// Response shape returned to the app. Mirrors MealPortionSuggestions on the client.
const PortionSchema = z.object({
  description: z.string(),
  portions: z.object({
    protein: z.number().int(),
    veggies: z.number().int(),
    fruits: z.number().int(),
    wholeGrains: z.number().int(),
    nutsSeeds: z.number().int(),
    fats: z.number().int(),
    water: z.number().int(),
  }),
});

const SYSTEM_PROMPT = `You are a nutrition assistant for a portion tracking app. Analyse the meal photo and return:
- "description": a 1-2 sentence description of what you see.
- "portions": integer portion counts (0 or more) for each food group visible in the meal:
  - "protein" (meat, fish, eggs, legumes, tofu)
  - "veggies" (vegetables, salad)
  - "fruits" (fruit, fruit juice)
  - "wholeGrains" (bread, rice, pasta, oats, cereals)
  - "nutsSeeds" (nuts, seeds, nut butter)
  - "fats" (oils, avocado, butter, cheese, cream)
  - "water" (water, herbal tea — not other drinks)`;

export function registerAnalyzeMealPhotoRoute(app: App) {
  app.post('/analyze-meal-photo', async (request, reply) => {
    const { imageBase64 } = (request.body ?? {}) as { imageBase64?: string };

    if (!imageBase64) {
      return reply.code(400).send({ error: 'imageBase64 is required' });
    }

    app.logger.info('Analysing meal photo');

    try {
      const { object } = await generateObject({
        model: gateway('openai/gpt-4o'),
        schema: PortionSchema,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', image: Buffer.from(imageBase64, 'base64'), mimeType: 'image/jpeg' },
              { type: 'text', text: 'Analyse this meal and return the structured result.' },
            ],
          },
        ],
      });

      return object;
    } catch (err) {
      app.logger.error({ err }, 'Meal photo analysis failed');
      return reply.code(502).send({ error: 'AI analysis failed. Please try again.' });
    }
  });
}
