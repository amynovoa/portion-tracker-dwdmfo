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
];
