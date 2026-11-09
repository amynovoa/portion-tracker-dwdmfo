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

const GLP1_TIP_TITLE = { en: 'Tips for you', es: 'Consejos para ti' } as const;

/** Shown only when the user's goal is GLP-1 Support (exact Amy copy, EN). */
export const GLP1_TIPS: PortionTip[] = [
  {
    id: 'glp1-protein-first',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Eat your protein first, before you feel full. Make the first bites count.',
      es: 'Come primero la proteína, antes de sentirte lleno. Que los primeros bocados cuenten.',
    },
  },
  {
    id: 'glp1-low-appetite',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Low appetite? Still eat. Small, protein-first meals and snacks add up.',
      es: '¿Poco apetito? Aun así come. Comidas y snacks pequeños, con proteína primero, suman.',
    },
  },
  {
    id: 'glp1-dont-skip',
    title: GLP1_TIP_TITLE,
    body: {
      en: "Don't skip meals. Your body still needs fuel, even when you're not hungry.",
      es: 'No te saltes las comidas. Tu cuerpo aún necesita combustible, aunque no tengas hambre.',
    },
  },
  {
    id: 'glp1-beans-lentils',
    title: GLP1_TIP_TITLE,
    body: {
      en: "Beans and lentils count as protein and bring fiber too. On a small appetite, that's a win-win.",
      es: 'Los frijoles y las lentejas cuentan como proteína y también aportan fibra. Con poco apetito, es un doble beneficio.',
    },
  },
  {
    id: 'glp1-sip-water',
    title: GLP1_TIP_TITLE,
    body: {
      en: "Sip water all day, not all at once. Pale yellow means you're on track.",
      es: 'Bebe agua a lo largo del día, no todo de una vez. El amarillo pálido significa que vas bien.',
    },
  },
  {
    id: 'glp1-fiber-water',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'More fiber needs more water. Every time you add fiber, add a glass of water.',
      es: 'Más fibra necesita más agua. Cada vez que agregues fibra, agrega un vaso de agua.',
    },
  },
  {
    id: 'glp1-chia-flax',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Sprinkle a spoonful of chia or ground flaxseed on your yogurt or oats for an easy fiber boost.',
      es: 'Espolvorea una cucharada de chía o linaza molida sobre tu yogur o avena para un fácil aporte de fibra.',
    },
  },
  {
    id: 'glp1-stop-satisfied',
    title: GLP1_TIP_TITLE,
    body: {
      en: "Stop when you're comfortably satisfied. Eating past full can bring on nausea.",
      es: 'Para cuando te sientas cómodamente satisfecho. Comer de más puede causar náuseas.',
    },
  },
  {
    id: 'glp1-eat-slowly',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Eat slowly and give your stomach time. Digestion is slower now.',
      es: 'Come despacio y dale tiempo a tu estómago. La digestión ahora es más lenta.',
    },
  },
  {
    id: 'glp1-smaller-meals',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Smaller meals, more often. Five mini meals can be easier than three big ones.',
      es: 'Comidas más pequeñas, más a menudo. Cinco mini comidas pueden ser más fáciles que tres grandes.',
    },
  },
  {
    id: 'glp1-greasy',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Go easy on greasy and fried foods. They tend to sit heavy and can upset your stomach.',
      es: 'Ve con calma con la comida grasosa y frita. Suele sentarse pesada y puede molestar el estómago.',
    },
  },
  {
    id: 'glp1-easy-wins',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Nothing sounds good? Greek yogurt, cottage cheese, eggs or a protein smoothie are easy wins.',
      es: '¿Nada te apetece? Yogur griego, requesón, huevos o un batido de proteína son opciones fáciles.',
    },
  },
  {
    id: 'glp1-strength',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Strength training two or three times a week helps protect your muscle. Even bodyweight moves count.',
      es: 'Entrenar fuerza dos o tres veces por semana ayuda a proteger el músculo. Hasta los ejercicios con el propio peso cuentan.',
    },
  },
  {
    id: 'glp1-walk',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'A short walk after meals helps your digestion and your mood.',
      es: 'Una caminata corta después de las comidas ayuda a la digestión y al estado de ánimo.',
    },
  },
  {
    id: 'glp1-alcohol',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'If you drink alcohol, have it with food and water, and go slowly.',
      es: 'Si bebes alcohol, hazlo con comida y agua, y ve despacio.',
    },
  },
  {
    id: 'glp1-gentle-foods',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Gentle foods on tough days: soup, toast, bananas, rice and yogurt.',
      es: 'Alimentos suaves en días difíciles: sopa, tostadas, plátanos, arroz y yogur.',
    },
  },
  {
    id: 'glp1-queasy',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'Feeling queasy? Cold or room-temperature foods often smell less and sit better.',
      es: '¿Te sientes mareado? Los alimentos fríos o a temperatura ambiente suelen oler menos y sentarse mejor.',
    },
  },
  {
    id: 'glp1-habits',
    title: GLP1_TIP_TITLE,
    body: {
      en: 'The medication quiets your appetite. Your habits are what last, so build them now.',
      es: 'El medicamento calma el apetito. Tus hábitos son lo que dura, así que constrúyelos ahora.',
    },
  },
];

export function getTipsForGoal(goal?: string | null): PortionTip[] {
  return goal === 'glp-1' ? GLP1_TIPS : PORTION_TIPS;
}
