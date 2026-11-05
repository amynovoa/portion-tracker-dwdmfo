# Amy requests — Nov 2026 plan

Status board for journal / TestFlight / store-link work. Do **one workstream at a time**.

## Priority order

| # | Workstream | Est. | Status |
|---|------------|------|--------|
| 1 | GLP-1 goal list → alphabetical | 15–30 min | Done |
| 2 | Steps option in profile setup (iOS + Android) | 1.5–2.5 hr | Done |
| 3 | Smart link `https://portiontrack.com/app` | 2–3 hr | Code done; **blocked** — Netlify host needs login/redeploy |
| 4 | Portion targets spreadsheet for journal | 1–1.5 hr | Done — then **updated Nov 5** to Amy’s new rules (540-row match) |

---

## 1) GLP-1 alphabetical in goal menu

**Problem:** GLP-1 Support is last in the goal picker.  
**Do:** Sort goals A–Z in `setup-profile` / `setup-profile.ios` (and any duplicate lists).  
**Ship:** Same TestFlight as #2.

### Alphabetical order (EN)
1. Build Muscle  
2. Eat Healthier  
3. GLP-1 Support  
4. Have More Energy  
5. Lose Weight  
6. Maintain Weight  

---

## 2) Steps during profile setup

**Problem:** Amy expects Steps in profile setup; today it only lives in Settings → Steps / Exercise CTA.  
**Do:**
- Add optional **Connect Steps** control on profile setup (before Continue)
- Wire to existing `requestStepsAccess` / `saveStepsConnected`
- Skip must not block Continue; copy points to Settings → Steps later
- Verify on physical iPhone TestFlight

**Out of scope unless Amy insists:** Required Health permission before finishing onboarding.

---

## 3) Smart link — portiontrack.com/app

**Repo:** `portion-track-website`  
**Behavior:**
- iPhone/iPad → 302 App Store (`id6756213687`)
- Android → 302 Play (`com.amynovoa.portiontracker`)
- Desktop / other → branded page: logo + both store buttons
- Server 302 (no wrong-page flash)
- Works in IG / FB / TikTok in-app browsers
- Case-insensitive + trailing slash
- No third-party shorteners / trackers / cookies
- Permanent URL; only redirect targets change if store links change

**Deliver:** Live URL for Amy to test on iPhone + Android.

### Deploy notes (Nov 4, 2026)
- **Code:** `asad6202/portion-track-website` — middleware + `/app` page + verify script. Latest includes empty redeploy trigger `cf22a46`.
- **Works now:** `https://portiontrack-website.vercel.app/app` (iPhone UA → App Store 302; Android → Play; desktop → branded page). Auto-deployed by Vercel on push.
- **Custom domain:** `portiontrack.com` is on **Netlify** site `imaginative-cat-bd65cd` (id `7f2cba0c-0aad-4c0c-a96b-7ffccf8af0c6`), **not** Vercel. Netlify is **not** picking up GitHub pushes (`/app` still 404).
- **To finish:** Log into Netlify for that site → Trigger deploy of latest `main`, **or** point DNS to the Vercel project and drop Netlify for the marketing site.

---

## 4) Portion targets table for journal

**Do:** Spreadsheet from live `portionCalculator` (kg→lb, GLP-1, protein floor, alcohol rules).  
**Axes:** goal × sex × size (S/M/L) × activity; alcohol 0/1/2 as needed.  
**Columns:** Protein, Veggies, Fruit, Grains, Nuts & Seeds, Fats, Water, Alcohol limit.  
**Note:** Size bands are in **pounds**.

### Delivered
- `docs/portion-targets-matrix.xlsx` (+ `.csv`) — 540 rows; matches Amy’s `PortionTrack-portion-targets-NEW.xlsx` exactly.
- Source of truth in app: `utils/portionCalculator.ts` (Nov 5 rules: sex×size base; Active/VA or Build +1 protein/+1 grain once; Lose +1 veg/−1 fat; GLP-1 +1 water; no alcohol food adjustments; exercise unchanged).
- Alcohol awareness note on setup-targets + FAQ (EN/ES).
- Regenerator: `node scripts/export-portion-targets-spreadsheet.mjs`

---

## Suggested sequence

1. #1 GLP-1 A–Z  
2. #2 Steps in setup → bump version/build → Amy TestFlight  
3. #3 Smart link live  
4. #4 Spreadsheet (can overlap with #3)

## Rough total

~5–7 hours end-to-end.
