# Design Pattern Playground

A bilingual (English + বাংলা) React app that teaches software design patterns through
interactive, real-world visual scenarios. Patterns are added **one at a time**; every
pattern follows the same format described below.

## Commands

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # tsc -b (typecheck) + vite build — must pass before committing
npm run lint     # oxlint — must pass before committing
```

Stack: React 19 + TypeScript 7 + Vite 8, Tailwind CSS v4 (class-based dark mode, theme
tokens in `src/index.css`, no config file), Framer Motion, react-i18next, Shiki (lazy-loaded),
React Router. Path alias `@/` → `src/`.

## Folder structure

```
src/
├── App.tsx                  routes: /  ·  /patterns/:id  ·  *
├── index.css                Tailwind, dark variant, fonts, Shiki token colors
├── i18n/index.ts            react-i18next setup, useLang(), saves language in localStorage
├── locales/en.json, bn.json shared UI strings (header, sidebar, home, section titles…)
├── types/pattern.ts         PatternContent, PatternCode, VisualProps, PatternDefinition
├── hooks/
│   ├── useStepPlayer.ts     play / pause / step / reset / speed timeline for visuals
│   ├── usePatternContent.ts current-language content with English fallback
│   └── useTheme.ts          light/dark toggle (localStorage `dpp-theme`)
├── lib/
│   ├── code.ts              prepareCode(): fills {{comment}} placeholders, strips @step markers
│   ├── highlighter.ts       Shiki core (TypeScript + github-light/dark), loaded on demand
│   ├── format.ts            formatNumber / formatTaka (Bangla digits in বাংলা mode)
│   └── merge.ts             deep merge used for the English fallback
├── components/
│   ├── layout/              AppLayout (sidebar + mobile drawer), Header, Sidebar
│   ├── PatternPage.tsx      the 4-section page shell — every pattern goes through it
│   ├── CodePanel.tsx        highlighted code + active-line highlight + auto-scroll
│   ├── ComparePanel.tsx     Without vs With
│   ├── LanguageToggle.tsx, ThemeToggle.tsx, ErrorBoundary.tsx
│   └── ui/                  Button, Section, Card, StepControls, icons
├── pages/                   HomePage, PatternRoute (+ Coming soon), NotFoundPage
└── patterns/
    ├── registry.ts          the list of BUILT patterns (sidebar order)
    ├── catalog.ts           all 23 GoF patterns; unbuilt ones show as "Coming soon"
    ├── define.ts            definePattern() helper
    └── <pattern-id>/        one folder per pattern (see below)
```

## The 4-section rule

Every pattern page has exactly these sections, in this order. `PatternPage.tsx` renders
them from the pattern's data, so a pattern cannot skip or reorder them:

1. **Real-world scenario**: a relatable story (`content.scenario`), plus "The problem"
   and the pattern's intent in one sentence.
2. **Interactive visualization**: `Visual.tsx`. The user clicks or chooses things and
   watches objects and messages animate. Uses `useStepPlayer` and `<StepControls>`, and
   shows a "What's happening" caption for each step.
3. **Code panel**: `code.main`. The line that is currently "running" is highlighted in
   sync with the visualization.
4. **Without vs With**: `code.without` (the messy version, e.g. a long if/else) next to
   `code.with` (the pattern version), followed by bullet points, "Why it's better" and
   "When to use".

## Bilingual rules

- Language toggle (EN | বাংলা) in the header, saved in localStorage as `dpp-lang`.
  `<html lang>` follows it, and `html:lang(bn)` switches the font to **Hind Siliguri**.
- **Code stays in English.** Only code comments are translated, through the
  `{{key}}` placeholders described below.
- **Keep technical terms in English inside Bangla text**: "Strategy প্যাটার্ন",
  "interface (ইন্টারফেস)", "class", "runtime", "delegate করে". Class and method names
  are never translated.
- Write Bangla **naturally**, the way a Bangladeshi developer would explain it to a
  friend. Don't translate word for word.
- **Missing translations fall back to English**:
  - UI strings go through i18next with `fallbackLng: 'en'`.
  - Pattern content uses `mergeWithFallback` (empty strings fall back too).
- Numbers and money shown in the UI use `formatNumber` / `formatTaka`, which output
  Bangla digits in বাংলা mode. Code and code line numbers always use ASCII digits.
- Brand or product names may use their Bangla form in Bangla UI text (বিকাশ, নগদ).

## Anatomy of a pattern folder

```
src/patterns/<id>/
├── index.ts        definePattern({ id, category, icon, content: { en, bn }, code, Visual: lazy(() => import('./Visual')) })
├── content.en.ts   export const en = { ... } satisfies PatternContent; export type XContent = typeof en
├── content.bn.ts   export const bn: DeepPartial<XContent> = { ... }   (typos in keys are type errors)
├── code.ts         export const xCode: PatternCode = { main, without, with }   (TypeScript as strings)
└── Visual.tsx      export default function XVisual({ content, lang, onCodeStep }: VisualProps<XContent>)
```

### Code snippet conventions (`code.ts`)

- `// {{key}}` is replaced by `content.codeComments[key]` in the current language.
- `// @step:a,b` at the **end** of a line makes that line light up while visual step
  `a` or `b` runs. The marker is stripped before display. Several lines may share one
  step id (they all light up).
- Both can sit on one line: `const fee = amount * 0.01; // {{nagadFee}} // @step:nagad-fee`.

### How the visual drives the code highlight

`Visual.tsx` builds a list of steps (`{ id, codeStep?, duration? }`) and runs them with
`useStepPlayer(steps)`. Whenever the running step changes, it calls
`onCodeStep(step.codeStep ?? step.id)`, or `null` for "nothing running". Step ids should
match the `@step:` markers in `code.main`. Captions come from `content.steps[...]`, and
values are filled in with the `{{name}}` placeholders (see `strategy/Visual.tsx`).

## Adding a new pattern (checklist)

1. Pick the id from `src/patterns/catalog.ts` (e.g. `observer`). The folder name and URL
   slug must be exactly this id.
2. Create `src/patterns/<id>/` with the five files above. Use `src/patterns/strategy/`
   as the reference implementation.
3. `content.en.ts`: write the complete English content.
   - `scenario` should be a relatable, ideally Bangladeshi, real-world story.
   - `visual` holds every label the Visual shows. **No hard-coded UI text in Visual.tsx.**
   - Also fill in `steps` (captions), `codeComments` and `compare`.
4. `content.bn.ts`: write the Bangla version, following the bilingual rules. Any key you
   leave out falls back to English.
5. `code.ts`: TypeScript snippets for `main`, `without` and `with`, using the
   `{{comment}}` and `@step:` conventions.
6. `Visual.tsx`:
   - Make it interactive: the user chooses something and then runs it.
   - Animate with Framer Motion.
   - Use `<StepControls>` and a "What's happening" caption.
   - Style it with the theme tokens (see Theme below).
   - Must fit at 360px width with no horizontal scroll, and work in dark mode.
7. Register it in `src/patterns/registry.ts`: one import plus one entry in `patterns`.
   It then shows up as a link in the sidebar and on the home page.
8. Verify:
   - `npm run build` and `npm run lint` pass.
   - In `npm run dev`, try the page in EN and বাংলা, light and dark, desktop and mobile.
   - The console has no errors and no `[code] missing code comment` warnings.
   - The highlighted line matches every visual step.
9. Commit with a clear message (e.g. `Add Observer pattern: ...`).

## Theme (Bangladeshi folk / rickshaw-art)

- Cream "paper" background with a printed motif (`.bg-motif`), bottle-green header with a
  chili-red rule, a `rickshaw-strip` tassel border, and maroon hero cards.
- Cards have thick outlines plus a hard offset shadow: `rounded-xl border-2 border-edge
  bg-card shadow-hard`. Use `<Card>` or `<BarCard label tone>` from `components/ui/Section`.
- Section labels use `label-caps`, tracked uppercase. In বাংলা mode the tracking is
  automatically removed so conjuncts don't split.
- Fonts: `font-display` (Baloo Da 2) for headings, Hind Siliguri for body text,
  `font-mono` (JetBrains Mono) for code.
- **Use semantic color tokens, not the Tailwind palette** (`slate-`, `indigo-`…).
  - Tokens: `paper`, `paper-deep`, `card`, `ink`, `ink-soft`, `edge`, `shade`, `bottle`,
    `maroon`, `mustard`, `chili`, `jade`, `cream`, `code`, `on-accent`.
  - They are CSS variables in `src/index.css` that swap values for dark mode, so
    components rarely need `dark:` variants.
  - Text on mustard uses `text-on-accent`. Text on bottle/maroon/chili uses `text-cream`.
- Code panels are always dark (`bg-code`, Shiki dark colors) in both themes.
- Brand colors that must stay fixed (e.g. bKash pink) may be hard-coded hex values.

## Conventions

- Shared UI strings go in `src/locales/*.json`. Pattern-specific text goes in the
  pattern's `content.*.ts`, never in the JSON files.
- Tailwind only, no CSS files per component. Check every screen in both light and dark mode.
- Respect reduced motion: the app is wrapped in `<MotionConfig reducedMotion="user">`.
- Keep pattern code self-contained in its folder. If a helper is useful to several
  patterns, move it to `components/ui`, `hooks` or `lib`.
- `erasableSyntaxOnly` is on, so app code can't use `enum` or constructor parameter
  properties. (Code *strings* shown to learners may use them.)
