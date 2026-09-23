export type PortionTip = {
  id: string;
  title: { en: string; es: string };
  body: { en: string; es: string };
};

/** Same copy as the website Tips for you carousel. */
export const PORTION_TIPS: PortionTip[] = [
  {
    id: 'half-veggies',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Fill half your plate with colorful vegetables.',
      es: 'Llena la mitad de tu plato con verduras de colores.',
    },
  },
  {
    id: 'broccoli-protein',
    title: { en: 'Did you know?', es: '¿Sabías que?' },
    body: {
      en: 'Broccoli contains surprising amounts of plant protein.',
      es: 'El brócoli contiene una cantidad sorprendente de proteína vegetal.',
    },
  },
  {
    id: 'protein',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'A palm-sized serving of protein is one portion — chicken, fish, eggs, or beans.',
      es: 'Una porción de proteína del tamaño de la palma es una ración: pollo, pescado, huevos o frijoles.',
    },
  },
  {
    id: 'healthy-fats',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Avocado, olive oil, and nuts count as fats — a small handful is one portion.',
      es: 'El aguacate, el aceite de oliva y los frutos secos cuentan como grasas: un puñado pequeño es una ración.',
    },
  },
  {
    id: 'berries',
    title: { en: 'Did you know?', es: '¿Sabías que?' },
    body: {
      en: 'Berries are a simple fruit portion. Add a handful to breakfast or snacks.',
      es: 'Las bayas son una porción de fruta sencilla. Añade un puñado al desayuno o a un snack.',
    },
  },
  {
    id: 'colorful-veggies',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'More color on the plate usually means a wider mix of veggies.',
      es: 'Más color en el plato suele significar una mayor variedad de verduras.',
    },
  },
  {
    id: 'progress',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'One meal doesn’t define how you eat. Progress matters more than perfection.',
      es: 'Una comida no define cómo comes. El progreso importa más que la perfección.',
    },
  },
  {
    id: 'no-calories',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Skip the calorie math. Tap portions as you eat and watch your plate fill.',
      es: 'Olvida las calorías. Toca las porciones al comer y mira cómo se llena tu plato.',
    },
  },
  {
    id: 'measure-oil',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Measure cooking oil or use a cooking spray — oil is high in calories and easy to over portion.',
      es: 'Mide el aceite para cocinar o usa un aceite en spray: el aceite tiene muchas calorías y es fácil servir de más.',
    },
  },
  {
    id: 'walnuts-omega3',
    title: { en: 'Did you know?', es: '¿Sabías que?' },
    body: {
      en: 'Walnuts provide plant-based omega-3 fats.',
      es: 'Las nueces aportan grasas omega-3 de origen vegetal.',
    },
  },
  {
    id: 'potatoes-nutritious',
    title: { en: 'Did you know?', es: '¿Sabías que?' },
    body: {
      en: 'Potatoes are nutritious. What you add to them matters.',
      es: 'Las papas son nutritivas. Lo que les agregas es lo que importa.',
    },
  },
  {
    id: 'potato-skin',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Keep the skin on potatoes for more fiber.',
      es: 'Deja la cáscara en las papas para obtener más fibra.',
    },
  },
  {
    id: 'baked-potato-toppings',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Top a baked potato with beans, salsa, or plain Greek yogurt.',
      es: 'Cubre una papa al horno con frijoles, salsa o yogur griego natural.',
    },
  },
  {
    id: 'whole-fruit',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Choose whole fruit over juice. It has less sugar and more fiber and nutrients.',
      es: 'Elige fruta entera en lugar de jugo. Tiene menos azúcar y más fibra y nutrientes.',
    },
  },
  {
    id: 'yogurt-berries-honey',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Add berries and a little honey to plain Greek yogurt for natural sweetness.',
      es: 'Agrega bayas y un poco de miel al yogur griego natural para darle dulzor natural.',
    },
  },
  {
    id: 'frozen-produce',
    title: { en: 'Did you know?', es: '¿Sabías que?' },
    body: {
      en: 'Frozen fruit and vegetables are nutritious choices.',
      es: 'Las frutas y verduras congeladas son opciones nutritivas.',
    },
  },
  {
    id: 'rinse-canned-beans',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Rinse canned beans to reduce sodium.',
      es: 'Enjuaga los frijoles de lata para reducir el sodio.',
    },
  },
  {
    id: 'canned-tuna-salad',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Add canned tuna to a salad for an easy protein.',
      es: 'Agrega atún enlatado a una ensalada para obtener proteína fácilmente.',
    },
  },
  {
    id: 'jicama-snack',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Slice jícama for a crunchy snack.',
      es: 'Corta jícama en rebanadas para un snack crujiente.',
    },
  },
  {
    id: 'ramekin-portions',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Put snacks in a ramekin or bowl so you can see and measure your portion.',
      es: 'Pon los snacks en un tazón pequeño para poder ver y medir tu porción.',
    },
  },
  {
    id: 'eggs-vegetables',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Add vegetables to scrambled eggs for easy vegetable portions.',
      es: 'Agrega verduras a los huevos revueltos para sumar porciones de verduras fácilmente.',
    },
  },
  {
    id: 'yogurt-instead-sour-cream',
    title: { en: 'Tips for you', es: 'Consejos para ti' },
    body: {
      en: 'Use plain Greek yogurt instead of sour cream on tacos or baked potatoes.',
      es: 'Usa yogur griego natural en lugar de crema agria en tacos o papas al horno.',
    },
  },
];
