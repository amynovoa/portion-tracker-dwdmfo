/**
 * Export portion targets matrix from Amy Nov 2026 rules (utils/portionCalculator.ts).
 * Output: docs/portion-targets-matrix.xlsx (+ .csv)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BASE = {
  female: {
    small: { protein: 4, veggies: 4, fruits: 2, wholeGrains: 3, nutsSeeds: 1, fats: 2, water: 7 },
    medium: { protein: 5, veggies: 5, fruits: 3, wholeGrains: 4, nutsSeeds: 1, fats: 2, water: 8 },
    large: { protein: 6, veggies: 5, fruits: 3, wholeGrains: 5, nutsSeeds: 1, fats: 3, water: 10 },
  },
  male: {
    small: { protein: 5, veggies: 4, fruits: 2, wholeGrains: 4, nutsSeeds: 1, fats: 2, water: 8 },
    medium: { protein: 6, veggies: 5, fruits: 3, wholeGrains: 5, nutsSeeds: 1, fats: 2, water: 10 },
    large: { protein: 7, veggies: 5, fruits: 3, wholeGrains: 6, nutsSeeds: 1, fats: 3, water: 12 },
  },
};

function classifySize(sex, weightPounds) {
  if (sex === 'female') {
    if (weightPounds < 150) return 'small';
    if (weightPounds < 190) return 'medium';
    return 'large';
  }
  if (weightPounds < 170) return 'small';
  if (weightPounds < 210) return 'medium';
  return 'large';
}

function calculateExerciseTarget(size, goal, activityLevel) {
  let exercise = 3;
  if (size === 'small') exercise = Math.max(2, exercise - 1);
  else if (size === 'large') exercise = Math.min(5, exercise + 1);
  if (goal === 'lose') exercise = Math.min(7, exercise + 1);
  else if (goal === 'build') exercise = Math.min(7, exercise + 2);
  switch (activityLevel) {
    case 'sedentary':
      exercise = Math.max(2, exercise);
      break;
    case 'light':
      exercise = Math.max(3, exercise);
      break;
    case 'moderate':
      exercise = Math.max(4, exercise + 1);
      break;
    case 'active':
      exercise = Math.max(5, exercise + 2);
      break;
    case 'veryActive':
      exercise = Math.max(6, exercise + 3);
      break;
  }
  return exercise;
}

function calculateRecommendedTargets(sex, weight, goal, activityLevel, options = {}) {
  const alcoholServings = options.alcoholServings ?? 0;
  const size = classifySize(sex, weight);
  const base = { ...BASE[sex === 'female' ? 'female' : 'male'][size] };
  const activeBonus =
    activityLevel === 'active' || activityLevel === 'veryActive' || goal === 'build';
  if (activeBonus) {
    base.protein += 1;
    base.wholeGrains += 1;
  }
  if (goal === 'lose') {
    base.veggies += 1;
    base.fats = Math.max(1, base.fats - 1);
  }
  if (goal === 'glp-1') base.water += 1;
  for (const k of ['protein', 'veggies', 'fruits', 'wholeGrains', 'nutsSeeds', 'fats', 'water']) {
    base[k] = Math.max(1, base[k]);
  }
  return {
    ...base,
    exercise: calculateExerciseTarget(size, goal, activityLevel),
    alcohol: alcoholServings,
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
      for (const activity of ACTIVITIES) {
        for (const alcohol of ALCOHOL) {
          const t = calculateRecommendedTargets(sex.value, weight, goal.value, activity.value, {
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
            alcohol,
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
writeFileSync(csvPath, [headers.join(','), ...rows.map((r) => r.join(','))].join('\n') + '\n');

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
    for i, row in enumerate(csv.reader(f), start=1):
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
notes['A1'] = 'Portion Track — portion targets matrix (Amy Nov 2026 rules)'
notes['A1'].font = Font(name='Arial', bold=True, size=14)
notes['A3'] = 'Source: utils/portionCalculator.ts — sex×size base; Active/VA or Build +1 protein +1 grain once; Lose +1 veg −1 fat; GLP-1 +1 water; no alcohol food adjustments.'
notes['A4'] = 'Size cutoffs unchanged (lb). Exercise unchanged from prior app logic.'
notes['A5'] = f'Generated rows: ${rows.length}.'
for r in range(3, 6):
    notes[f'A{r}'].font = note_font
notes.column_dimensions['A'].width = 110

xlsx_path = ${JSON.stringify(join(outDir, 'portion-targets-matrix.xlsx'))}
wb.save(xlsx_path)
print(xlsx_path)
print('rows', ${rows.length})
`;

const result = spawnSync('python3', ['-c', py], { encoding: 'utf8' });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}
console.log(result.stdout.trim());
console.log('CSV:', csvPath);
console.log('Rows:', rows.length);
