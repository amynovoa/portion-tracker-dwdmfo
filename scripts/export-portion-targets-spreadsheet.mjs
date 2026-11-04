/**
 * Export portion targets matrix from live calculateRecommendedTargets rules.
 * Output: docs/portion-targets-matrix.xlsx (+ .csv)
 *
 * Size bands use representative weights in pounds (cutoffs are lb-based).
 * Alcohol limit column = daily servings input (0 / 1 / 2); same value used for adjust.
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Register ts-node/tsx if available; else transpile via a tiny inline port of the calculator.
let calculateRecommendedTargets;
let classifySize;

try {
  // Prefer running against compiled/ts source via tsx
  const { register } = await import('node:module');
  // dynamic import of ts via experimental - fall through
  throw new Error('use inline');
} catch {
  // Inline mirror of utils/portionCalculator.ts (keep in sync)
  const LBS_PER_KG = 2.2046226218;

  function weightInPounds(weight, weightUnit = 'lbs') {
    if (!Number.isFinite(weight)) return 0;
    return weightUnit === 'kg' ? weight * LBS_PER_KG : weight;
  }

  classifySize = function classifySize(sex, weightPounds) {
    if (sex === 'female') {
      if (weightPounds < 150) return 'small';
      if (weightPounds < 190) return 'medium';
      return 'large';
    }
    if (weightPounds < 170) return 'small';
    if (weightPounds < 210) return 'medium';
    return 'large';
  };

  function getBaselinePortions() {
    return {
      protein: 3,
      veggies: 4,
      fruits: 2,
      wholeGrains: 2,
      nutsSeeds: 1,
      fats: 2,
      water: 8,
      exercise: 3,
      alcohol: 2,
    };
  }

  function applySizeAdjustment(portions, size) {
    const adjusted = { ...portions };
    if (size === 'small') {
      adjusted.protein = Math.max(2, adjusted.protein - 1);
      adjusted.veggies = Math.max(3, adjusted.veggies - 1);
      adjusted.fruits = Math.max(2, adjusted.fruits);
      adjusted.wholeGrains = Math.max(1, adjusted.wholeGrains - 1);
      adjusted.nutsSeeds = 1;
      adjusted.fats = Math.max(1, adjusted.fats - 1);
      adjusted.water = Math.max(7, adjusted.water - 1);
      adjusted.exercise = Math.max(2, adjusted.exercise - 1);
    } else if (size === 'large') {
      adjusted.protein = Math.min(5, adjusted.protein + 1);
      adjusted.veggies = Math.min(6, adjusted.veggies + 1);
      adjusted.fruits = Math.min(4, adjusted.fruits + 1);
      adjusted.wholeGrains = Math.min(4, adjusted.wholeGrains + 1);
      adjusted.nutsSeeds = 1;
      adjusted.fats = Math.min(3, adjusted.fats + 1);
      adjusted.water = Math.min(12, adjusted.water + 2);
      adjusted.exercise = Math.min(5, adjusted.exercise + 1);
    }
    return adjusted;
  }

  function applyActivityAdjustment(portions, activityLevel, options = {}) {
    const adjusted = { ...portions };
    const skipProtein = !!options.skipProteinBonus;
    switch (activityLevel) {
      case 'sedentary':
        adjusted.exercise = Math.max(2, adjusted.exercise);
        break;
      case 'light':
        if (!skipProtein) adjusted.protein = Math.min(6, adjusted.protein + 1);
        adjusted.wholeGrains = Math.min(4, adjusted.wholeGrains + 1);
        adjusted.exercise = Math.max(3, adjusted.exercise);
        break;
      case 'moderate':
        if (!skipProtein) adjusted.protein = Math.min(6, adjusted.protein + 1);
        adjusted.wholeGrains = Math.min(5, adjusted.wholeGrains + 1);
        adjusted.exercise = Math.max(4, adjusted.exercise + 1);
        break;
      case 'active':
        if (!skipProtein) adjusted.protein = Math.min(6, adjusted.protein + 2);
        adjusted.wholeGrains = Math.min(6, adjusted.wholeGrains + 2);
        adjusted.exercise = Math.max(5, adjusted.exercise + 2);
        break;
      case 'veryActive':
        if (!skipProtein) adjusted.protein = Math.min(7, adjusted.protein + 2);
        adjusted.wholeGrains = Math.min(7, adjusted.wholeGrains + 3);
        adjusted.nutsSeeds = 1;
        adjusted.exercise = Math.max(6, adjusted.exercise + 3);
        break;
    }
    return adjusted;
  }

  function applyAlcoholAdjustment(portions, alcoholServings) {
    const adjusted = { ...portions };
    const servings = Math.max(0, Math.floor(Number(alcoholServings) || 0));
    if (servings >= 1) adjusted.wholeGrains = Math.max(1, adjusted.wholeGrains - 1);
    if (servings >= 2) adjusted.fats = Math.max(1, adjusted.fats - 1);
    return adjusted;
  }

  calculateRecommendedTargets = function calculateRecommendedTargets(
    sex,
    weight,
    goal,
    activityLevel = 'sedentary',
    options = {}
  ) {
    const weightUnit = options.weightUnit ?? 'lbs';
    const alcoholServings = options.alcoholServings ?? 0;
    const pounds = weightInPounds(weight, weightUnit);
    const size = classifySize(sex, pounds);
    let portions = getBaselinePortions();
    portions = applySizeAdjustment(portions, size);

    if (goal === 'lose') {
      portions.wholeGrains = Math.max(0, portions.wholeGrains - 1);
      portions.fats = Math.max(0, portions.fats - 1);
      portions.veggies = Math.min(6, portions.veggies + 1);
      portions.exercise = Math.min(7, portions.exercise + 1);
    } else if (goal === 'build') {
      portions.protein = Math.min(6, portions.protein + 1);
      portions.nutsSeeds = 1;
      portions.fats = Math.min(4, portions.fats + 1);
      portions.exercise = Math.min(7, portions.exercise + 2);
    } else if (goal === 'glp-1') {
      portions.protein = Math.min(5, portions.protein + 1);
    }

    portions = applyActivityAdjustment(portions, activityLevel, {
      skipProteinBonus: goal === 'glp-1',
    });
    portions = applyAlcoholAdjustment(portions, alcoholServings);
    portions.protein = Math.max(3, portions.protein);
    portions.nutsSeeds = 1;
    return portions;
  };
}

const GOALS = [
  { value: 'build', label: 'Build Muscle' },
  { value: 'eat-healthier', label: 'Eat Healthier' },
  { value: 'glp-1', label: 'GLP-1 Support' },
  { value: 'have-more-energy', label: 'Have More Energy' },
  { value: 'lose', label: 'Lose Weight' },
  { value: 'maintain', label: 'Maintain Weight' },
];

const SEXES = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

/** Representative lb weights inside each size band */
const SIZE_WEIGHTS = {
  female: { small: 140, medium: 170, large: 200 },
  male: { small: 160, medium: 190, large: 220 },
};

const SIZES = ['small', 'medium', 'large'];
const SIZE_LABEL = { small: 'S', medium: 'M', large: 'L' };

const ACTIVITIES = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'veryActive', label: 'Very Active' },
];

const ALCOHOL = [0, 1, 2];

const headers = [
  'Goal',
  'Sex',
  'Size',
  'Weight_lb_example',
  'Activity',
  'Alcohol_servings',
  'Protein',
  'Veggies',
  'Fruit',
  'Grains',
  'Nuts_Seeds',
  'Fats',
  'Water',
  'Alcohol_limit',
  'Exercise',
];

const rows = [];
for (const goal of GOALS) {
  for (const sex of SEXES) {
    for (const size of SIZES) {
      const weight = SIZE_WEIGHTS[sex.value][size];
      const verified = classifySize(sex.value, weight);
      if (verified !== size) {
        throw new Error(`Weight ${weight} for ${sex.value} is ${verified}, expected ${size}`);
      }
      for (const activity of ACTIVITIES) {
        for (const alcohol of ALCOHOL) {
          const t = calculateRecommendedTargets(sex.value, weight, goal.value, activity.value, {
            weightUnit: 'lbs',
            alcoholServings: alcohol,
          });
          rows.push([
            goal.label,
            sex.label,
            SIZE_LABEL[size],
            weight,
            activity.label,
            alcohol,
            t.protein,
            t.veggies,
            t.fruits,
            t.wholeGrains,
            t.nutsSeeds,
            t.fats,
            t.water,
            alcohol, // Alcohol limit = daily servings preference (matches app setup-targets)
            t.exercise,
          ]);
        }
      }
    }
  }
}

const outDir = join(root, 'docs');
mkdirSync(outDir, { recursive: true });

const csvPath = join(outDir, 'portion-targets-matrix.csv');
const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n') + '\n';
writeFileSync(csvPath, csv, 'utf8');

// XLSX via openpyxl (python)
const py = `
import csv
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = Workbook()
ws = wb.active
ws.title = "Portion targets"

thin = Border(
    left=Side(style='thin', color='D0D0D0'),
    right=Side(style='thin', color='D0D0D0'),
    top=Side(style='thin', color='D0D0D0'),
    bottom=Side(style='thin', color='D0D0D0'),
)
header_font = Font(name='Arial', bold=True, size=11, color='FFFFFF')
header_fill = PatternFill('solid', fgColor='2F6B4F')
body_font = Font(name='Arial', size=10)
note_font = Font(name='Arial', size=10, italic=True)

with open(${JSON.stringify(csvPath)}, newline='') as f:
    reader = csv.reader(f)
    for i, row in enumerate(reader, start=1):
        for j, val in enumerate(row, start=1):
            cell = ws.cell(row=i, column=j, value=int(val) if val.isdigit() else val)
            cell.font = header_font if i == 1 else body_font
            cell.border = thin
            if i == 1:
                cell.fill = header_fill
                cell.alignment = Alignment(horizontal='center', wrap_text=True)
            elif j >= 4:
                cell.alignment = Alignment(horizontal='center')

ws.auto_filter.ref = ws.dimensions
ws.freeze_panes = 'A2'
for col in range(1, ws.max_column + 1):
    ws.column_dimensions[get_column_letter(col)].width = 14 if col > 3 else 18

notes = wb.create_sheet('Notes', 0)
notes['A1'] = 'Portion Track — portion targets matrix'
notes['A1'].font = Font(name='Arial', bold=True, size=14)
notes['A3'] = 'Source: utils/portionCalculator.ts calculateRecommendedTargets (live app rules).'
notes['A4'] = 'Size cutoffs are in pounds. Example weights: Female S 140 / M 170 / L 200; Male S 160 / M 190 / L 220.'
notes['A5'] = 'Female bands: S <150, M <190, L ≥190. Male bands: S <170, M <210, L ≥210.'
notes['A6'] = 'Alcohol_servings is an input (0 / 1 / 2). 1st serving → grains −1; 2nd → fats −1 (floor 1). Alcohol_limit matches app daily servings target.'
notes['A7'] = 'GLP-1: protein +1 (cap 5); activity protein bonus skipped; protein floor 3 after all adjustments.'
notes['A8'] = 'kg inputs convert to lb before size classification (× 2.2046226218).'
notes['A9'] = 'Generated rows: ${rows.length}. Prefer filtering Goal / Sex / Size / Activity / Alcohol in the Portion targets sheet.'
for r in range(3, 10):
    notes[f'A{r}'].font = note_font
notes.column_dimensions['A'].width = 110

xlsx_path = ${JSON.stringify(join(outDir, 'portion-targets-matrix.xlsx'))}
wb.save(xlsx_path)
print(xlsx_path)
print('rows', ${rows.length})
`;

const { spawnSync } = await import('node:child_process');
const result = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}
console.log(result.stdout.trim());
console.log('CSV:', csvPath);
console.log('Rows:', rows.length);
