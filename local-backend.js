const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load backend/.env exclusively
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
  console.log('[local-backend] Loaded env from backend/.env');
} else {
  console.warn('[local-backend] backend/.env not found');
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const SYSTEM_PROMPT = `You are a professional nutrition analyst for a portion tracking app. Carefully examine the meal photo and identify every food item visible.

Return a JSON object with:
- "description": A clear 1-2 sentence description of the meal, naming the specific foods you see (e.g. "A plate of grilled salmon with steamed broccoli, mango slices, and brown rice.").
- "portions": Integer portion counts for each food group. Count each serving-sized amount as 1 portion.

FOOD GROUP RULES — classify every food item into exactly one group:

"protein": Meat (chicken, beef, lamb, pork), fish, seafood, eggs, legumes (lentils, chickpeas, beans), tofu, tempeh, Greek yogurt.

"veggies": ONLY vegetables — broccoli, spinach, carrots, tomatoes, cucumber, peppers, onions, lettuce, zucchini, mushrooms, peas, corn, cabbage, cauliflower, eggplant. DO NOT include fruits here.

"fruits": ALL fruits — mango, banana, apple, orange, berries, grapes, watermelon, pineapple, papaya, kiwi, peach, plum, cherry, melon, dates, figs, lychee, pomegranate, passion fruit, guava. Mango is ALWAYS a fruit, never a vegetable.

"wholeGrains": Bread, rice, pasta, oats, quinoa, barley, cereals, naan, roti, tortilla, couscous.

"nutsSeeds": Almonds, walnuts, cashews, pistachios, peanuts, sunflower seeds, chia seeds, flaxseeds, nut butters, tahini.

"fats": Avocado, olive oil, butter, ghee, cheese, cream, coconut, mayonnaise, full-fat dressings.

"water": Plain water, herbal tea, sparkling water. NOT juice, soda, or other drinks.

"alcohol": Beer, wine, spirits, cocktails, champagne, cider, sake, liqueur. Each standard drink = 1 portion (355ml beer, 150ml wine, 45ml spirits).

IMPORTANT:
- If you see a mango → count it under "fruits", never "veggies"
- If you see avocado → count it under "fats", never "veggies"
- Beer/wine/spirits → always "alcohol", never "water"
- Count 0 for any food group not visible in the image
- Each palm-sized serving = 1 portion

Respond ONLY with valid JSON in this exact format:
{
  "description": "...",
  "portions": {
    "protein": 0,
    "veggies": 0,
    "fruits": 0,
    "wholeGrains": 0,
    "nutsSeeds": 0,
    "fats": 0,
    "water": 0,
    "alcohol": 0
  }
}`;

async function analyzeWithOpenAI(imageBase64) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: 'Analyse this meal photo and return the structured JSON result.',
            },
          ],
        },
      ],
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const content = json.choices[0].message.content;
          // Strip markdown code blocks if present
          const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          resolve(JSON.parse(cleaned));
        } catch (e) {
          reject(new Error('Failed to parse OpenAI response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/analyze-meal-photo') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      console.log('[local-backend] Received meal photo analysis request');

      try {
        const { imageBase64 } = JSON.parse(body);
        if (!imageBase64) throw new Error('imageBase64 is required');

        let result;

        if (OPENAI_API_KEY) {
          console.log('[local-backend] Calling OpenAI GPT-4o Vision...');
          result = await analyzeWithOpenAI(imageBase64);
          console.log('[local-backend] OpenAI result:', JSON.stringify(result));
        } else {
          // No API key — return smart mock based on common foods
          console.log('[local-backend] No OPENAI_API_KEY set — returning mock result');
          console.log('[local-backend] To use real AI: OPENAI_API_KEY=sk-... node local-backend.js');
          result = {
            description: "Mock response — add OPENAI_API_KEY to get real AI analysis.",
            portions: {
              protein: 1,
              veggies: 2,
              fruits: 1,
              wholeGrains: 1,
              nutsSeeds: 0,
              fats: 1,
              water: 0,
            }
          };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[local-backend] Error:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Local backend running at http://0.0.0.0:${PORT}`);
  console.log(`📱 From your phone use: http://192.168.1.13:${PORT}`);
  if (OPENAI_API_KEY) {
    console.log(`🤖 Real AI analysis enabled (GPT-4o Vision)`);
  } else {
    console.log(`⚠️  No OPENAI_API_KEY — using mock responses`);
    console.log(`   To enable real AI: OPENAI_API_KEY=sk-xxx node local-backend.js`);
  }
  console.log(`\nWaiting for requests...\n`);
});
