
import { FoodGroup } from '@/types';

export interface FoodGroupInfo {
  benefit: string;
  avoid: string;
  examples: string;
  portionSize: string;
}

export const FOOD_GROUP_INFO: Record<FoodGroup, FoodGroupInfo> = {
  protein: {
    benefit: 'Supports muscle repair, keeps you full longer, and helps stabilize blood sugar.',
    avoid: 'Avoid: processed meats high in sodium, fillers, or added sugars.',
    examples: 'Examples: chicken, turkey, lean beef; salmon, tuna, shrimp, white fish; tofu, tempeh, lentils, edamame; Greek yogurt, eggs, egg whites, protein powder.',
    portionSize: `About 20–25 grams of protein, such as:
- 3–4 oz cooked chicken, fish, or meat
- 2 eggs
- ¾ cup Greek yogurt or cottage cheese
- 1 scoop protein powder`,
  },
  veggies: {
    benefit: 'Packed with fiber, vitamins, minerals, and antioxidants that support digestion and metabolic health.',
    avoid: 'Avoid: vegetables covered in heavy sauces, cheeses, or fried coatings.',
    examples: 'Examples: spinach, kale, romaine; broccoli, cauliflower, Brussels sprouts; peppers, carrots, squash, beets; cucumbers, zucchini, mushrooms.',
    portionSize: `- 1 cup raw vegetables
- ½ cup cooked vegetables

(Non-starchy vegetables like greens, broccoli, peppers, zucchini)`,
  },
  fruit: {
    benefit: 'Provide natural energy, fiber, and antioxidants that support digestion and reduce inflammation.',
    avoid: 'Avoid: fruit juices, canned fruit in syrup, sugary dried fruit.',
    examples: 'Examples: berries; apples, pears, peaches; oranges, grapefruit; melons, pineapple, mango.',
    portionSize: `- 1 medium piece of fruit
- Or 1 cup cut fruit`,
  },
  healthyCarbs: {
    benefit: 'Healthy Carbs include nutrient-dense carbohydrate foods that provide steady energy, fiber, and vitamins. These foods help support digestion, blood sugar balance, and long-term health.',
    avoid: 'Avoid: white bread, white pasta, white rice, pastries, donuts, cakes, cookies, breakfast cereals made from refined grains, chips, fries, processed snacks, sugary drinks or juices, candy or granola bars.',
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
    portionSize: `- ½ cup cooked grains or starchy vegetables (rice, quinoa, oats, potatoes)
- 1 slice bread
- 1 small tortilla`,
  },
  nuts: {
    benefit: 'Deliver protein, fiber, and omega fats that support heart health and satiety.',
    avoid: 'Avoid: candied nuts, nuts roasted in heavy oils, overly salted nuts.',
    examples: 'Examples: almonds, walnuts, pecans; pistachios; chia, flax, hemp seeds; natural nut butters.',
    portionSize: `- ¼ cup nuts or seeds
- Or 2 tablespoons seeds`,
  },
  fats: {
    benefit: 'Support hormones, brain function, and satiety.',
    avoid: 'Avoid: trans fats, processed oils, fried foods, sugary nut spreads.',
    examples: 'Examples: avocado; olive oil, avocado oil; chia, flax, hemp seeds; salmon, sardines.',
    portionSize: `- 1 tablespoon oil or butter
- ¼ avocado
- 1 tablespoon nut butter`,
  },
  alcohol: {
    benefit: 'Tracking alcohol helps keep intake mindful and reduces empty calories.',
    avoid: 'Avoid: sugary mixers and high-calorie cocktails.',
    examples: 'Examples (1 portion): 5 oz wine; 1.5 oz spirits; light beer.',
    portionSize: `- 5 oz wine
- 12 oz beer
- 1.5 oz spirits`,
  },
};
