
import { FoodGroup } from '../types';

interface FoodGroupInfo {
  benefit: string;
  avoid: string;
  examples: string;
  portionSize?: string;
}

export const foodGroupInfo: Record<FoodGroup, FoodGroupInfo> = {
  protein: {
    benefit: `Protein supports muscle repair, satiety, and metabolism. It helps you feel full longer and preserves lean mass during weight loss.

Aim to include a protein source at most meals.

Quality matters — choose lean, minimally processed options when possible.`,
    avoid: `Avoid heavily processed meats (hot dogs, deli meats with nitrates).

Limit fried or breaded proteins.

Watch portion sizes on higher-fat cuts if you're trying to lose weight.`,
    examples: `Animal sources:
- Chicken breast (grilled or shredded)
- Turkey
- Lean beef or pork (carne asada, carnitas)
- Fish (tuna, salmon, cod, or grilled fish — fresh or canned)
- Eggs
- Greek yogurt
- Cottage cheese

Plant sources:
- Beans (black, pinto, etc.)
- Tofu or tempeh
- Edamame
- Seitan`,
    portionSize: 'About the size of your palm (3-4 oz cooked meat, 1 cup Greek yogurt, 2 eggs, etc.)',
  },
  veggies: {
    benefit: `Vegetables are packed with fiber, vitamins, and minerals. They support digestion, immunity, and overall health while being low in calories.

The more variety, the better — aim for different colors throughout the week.

Non-starchy veggies can be eaten freely and help with satiety.`,
    avoid: `Avoid deep-fried vegetables or those loaded with heavy sauces.

Watch portion sizes on starchy vegetables like potatoes (count those as whole grains instead).`,
    examples: `Leafy greens:
- Spinach, kale, arugula, lettuce

Cruciferous:
- Broccoli, cauliflower, Brussels sprouts, cabbage

Other favorites:
- Bell peppers, tomatoes, cucumbers, zucchini, carrots, green beans, asparagus, mushrooms`,
    portionSize: 'About 1 cup raw or ½ cup cooked',
  },
  fruits: {
    benefit: `Fruit provides natural sugars, fiber, vitamins, and antioxidants. It's a great way to satisfy a sweet tooth while nourishing your body.

Whole fruit is always better than juice — the fiber slows sugar absorption.

Berries are especially nutrient-dense and lower in sugar.`,
    avoid: `Avoid fruit juices and dried fruit in large amounts (they're concentrated in sugar and calories).

Limit canned fruit in heavy syrup.`,
    examples: `Berries:
- Strawberries, blueberries, raspberries, blackberries

Tree fruit:
- Apples, pears, peaches, plums

Tropical:
- Bananas, oranges, pineapple, mango, kiwi

Melons:
- Watermelon, cantaloupe, honeydew`,
    portionSize: 'About 1 medium piece of fruit or 1 cup berries/melon',
  },
  wholeGrains: {
    benefit: `Whole grains provide sustained energy, fiber, and B vitamins. They support digestion and help stabilize blood sugar.

Choose whole grains over refined grains whenever possible.

Pair with protein and veggies for balanced meals.`,
    avoid: `Avoid refined grains (white bread, white rice, pastries).

Limit sugary cereals and baked goods.

Watch portion sizes — grains are calorie-dense.`,
    examples: `Grains:
- Oats, quinoa, brown rice, farro, barley

Bread & pasta:
- Whole wheat bread, whole grain pasta, whole grain tortillas

Starchy vegetables (count as grains):
- Sweet potatoes, white potatoes, corn, peas`,
    portionSize: 'About ½ cup cooked grains, 1 slice bread, or 1 small potato',
  },
  nutsSeeds: {
    benefit: `Nuts and seeds provide healthy fats, protein, fiber, and important minerals like magnesium and zinc.

They support heart health and help with satiety.

A little goes a long way — they're calorie-dense but nutrient-rich.`,
    avoid: `Avoid heavily salted or candied nuts.

Watch portion sizes — it's easy to overeat nuts.

Limit nut butters with added sugar or oils.`,
    examples: `Nuts:
- Almonds, walnuts, cashews, pecans, pistachios

Seeds:
- Chia seeds, flaxseeds, pumpkin seeds, sunflower seeds, hemp seeds

Nut butters:
- Almond butter, peanut butter (natural, no added sugar)`,
    portionSize: 'About ¼ cup nuts or 2 tablespoons nut butter',
  },
  fats: {
    benefit: `Healthy fats support hormone production, brain function, and nutrient absorption. They help you feel satisfied and add flavor to meals.

Focus on unsaturated fats from plant sources and fatty fish.

Fats are essential but calorie-dense, so portion control matters.`,
    avoid: `Avoid trans fats (partially hydrogenated oils) found in some processed foods.

Limit saturated fats from butter, cream, and fatty meats.

Watch portion sizes — fats are 9 calories per gram.`,
    examples: `Healthy fat sources:
- Olive oil, avocado oil
- Avocados
- Fatty fish (salmon, mackerel, sardines)
- Olives
- Dark chocolate (70%+ cacao, in moderation)

Cooking fats:
- Extra virgin olive oil
- Coconut oil (in moderation)
- Grass-fed butter (small amounts)`,
    portionSize: 'About 1 tablespoon oil, ¼ avocado, or 1 oz fatty fish',
  },
  water: {
    benefit: `Water is essential for every bodily function — digestion, circulation, temperature regulation, and more.

Staying hydrated supports energy, focus, and physical performance.

It can also help with appetite control and reduce unnecessary snacking.`,
    avoid: `Avoid sugary drinks (soda, sweetened coffee drinks, energy drinks).

Limit fruit juices — they're high in sugar and low in fiber.

Watch caffeine intake — it can be dehydrating in excess.`,
    examples: `Best choices:
- Plain water
- Sparkling water (unsweetened)
- Herbal tea
- Water with lemon, cucumber, or mint

Okay in moderation:
- Black coffee, unsweetened tea`,
    portionSize: 'About 8 oz (1 cup) per serving — aim for 7-10+ servings per day',
  },
  exercise: {
    benefit: `Regular exercise is essential for overall health, weight management, and mental well-being.

It helps build and maintain muscle, improves cardiovascular health, and boosts mood.

Consistency matters more than intensity — find activities you enjoy and can sustain.`,
    avoid: `Avoid overtraining without adequate rest and recovery.

Don't exercise through pain or injury.

Avoid comparing yourself to others — focus on your own progress.`,
    examples: `Cardio:
- Walking, jogging, running
- Cycling, swimming
- Dancing, sports

Strength training:
- Weight lifting
- Bodyweight exercises
- Resistance bands

Flexibility & balance:
- Yoga, Pilates
- Stretching routines
- Tai chi`,
    portionSize: 'One session counts as 1 portion (aim for 20-60 minutes of intentional movement)',
  },
  alcohol: {
    benefit: `If you choose to drink, moderation is key. Some studies suggest moderate alcohol consumption may have social and relaxation benefits.

However, alcohol provides empty calories and can interfere with weight loss and fitness goals.

The recommended maximum is 2 servings per day, but less is generally better for health.`,
    avoid: `Avoid excessive drinking — it can lead to poor food choices, dehydration, and disrupted sleep.

Limit sugary mixed drinks and high-calorie cocktails.

Don't drink on an empty stomach.

Avoid drinking if you're pregnant, taking certain medications, or have a history of alcohol issues.`,
    examples: `Standard servings:
- 12 oz beer (regular, ~5% ABV)
- 5 oz wine (red or white)
- 1.5 oz distilled spirits (vodka, whiskey, rum, gin, tequila)

Lower-calorie options:
- Light beer
- Wine spritzer (wine + sparkling water)
- Spirits with soda water and lime`,
    portionSize: 'One standard drink: 12 oz beer, 5 oz wine, or 1.5 oz spirits',
  },
};
