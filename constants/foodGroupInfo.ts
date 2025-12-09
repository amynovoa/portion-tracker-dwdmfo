
import { FoodGroup } from '@/types';

export interface FoodGroupInfo {
  benefit: string;
  avoid: string;
  examples: string;
}

export const FOOD_GROUP_INFO: Record<FoodGroup, FoodGroupInfo> = {
  protein: {
    benefit: 'Supports muscle repair, keeps you full longer, and helps stabilize blood sugar.',
    avoid: 'Avoid: processed meats high in sodium, fillers, or added sugars.',
    examples: 'Examples: chicken, turkey, lean beef; salmon, tuna, shrimp, white fish; tofu, tempeh, lentils, edamame; Greek yogurt, eggs, egg whites, protein powder.',
  },
  veggies: {
    benefit: 'Packed with fiber, vitamins, minerals, and antioxidants that support digestion and metabolic health.',
    avoid: 'Avoid: vegetables covered in heavy sauces, cheeses, or fried coatings.',
    examples: 'Examples: spinach, kale, romaine; broccoli, cauliflower, Brussels sprouts; peppers, carrots, squash, beets; cucumbers, zucchini, mushrooms.',
  },
  fruit: {
    benefit: 'Provide natural energy, fiber, and antioxidants that support digestion and reduce inflammation.',
    avoid: 'Avoid: fruit juices, canned fruit in syrup, sugary dried fruit.',
    examples: 'Examples: berries; apples, pears, peaches; oranges, grapefruit; melons, pineapple, mango.',
  },
  wholeGrains: {
    benefit: 'Healthy Carbs include nutrient-dense carbohydrate foods that provide steady energy, fiber, and vitamins. These foods help support digestion, blood sugar balance, and long-term health.',
    avoid: '',
    examples: `Whole Grains
- Oats
- Quinoa
- Brown rice
- Farro
- Barley
- Whole-wheat pasta
- Whole-grain bread

Beans & Lentils (Legumes)
- Black beans
- Pinto beans
- Kidney beans
- Chickpeas
- Lentils
- Split peas
- Edamame / soybeans

Starchy Vegetables
- Sweet potatoes
- Potatoes
- Winter squash (butternut, acorn, kabocha)
- Corn`,
  },
  legumes: {
    benefit: 'Nutrient-dense, high in fiber and plant-based protein, and support stable blood sugar.',
    avoid: 'Avoid: canned legumes with syrups, excess sodium, or added fats.',
    examples: 'Examples: black, pinto, kidney, navy beans; lentils; chickpeas; split peas.',
  },
  nutsSeeds: {
    benefit: 'Deliver protein, fiber, and omega fats that support heart health and satiety.',
    avoid: 'Avoid: candied nuts, nuts roasted in heavy oils, overly salted nuts.',
    examples: 'Examples: almonds, walnuts, pecans; pistachios; chia, flax, hemp seeds; natural nut butters.',
  },
  fats: {
    benefit: 'Support hormones, brain function, and satiety.',
    avoid: 'Avoid: trans fats, processed oils, fried foods, sugary nut spreads.',
    examples: 'Examples: avocado; olive oil, avocado oil; chia, flax, hemp seeds; salmon, sardines.',
  },
  dairy: {
    benefit: 'Dairy can be a good source of protein, calcium, and vitamin D, which support bone health, muscle function, and overall nutrition.',
    avoid: 'Avoid: sugary flavored yogurts, sweetened milks, heavy cream sauces, and highly processed cheese products.',
    examples: 'Examples: Greek yogurt; cottage cheese; milk or lactose-free milk; almond milk, soy milk, oat milk, cashew milk; unsweetened yogurt or coconut yogurt; small amounts of cheese (cheddar, mozzarella, feta); kefir or unsweetened yogurt drinks; ricotta; paneer.',
  },
  water: {
    benefit: 'Supports energy, digestion, metabolism, and reduces false hunger signals.',
    avoid: 'Avoid: sugary drinks.',
    examples: 'Examples: water; sparkling water; herbal tea; fruit-infused water.',
  },
  alcohol: {
    benefit: 'Tracking alcohol helps keep intake mindful and reduces empty calories.',
    avoid: 'Avoid: sugary mixers and high-calorie cocktails.',
    examples: 'Examples (1 portion): 5 oz wine; 1.5 oz spirits; light beer.',
  },
};
