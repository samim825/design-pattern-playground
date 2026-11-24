# Design Pattern Playground

A bilingual (English + বাংলা) React app that teaches software design patterns through
interactive, real-world visual scenarios. Patterns are added **one at a time**, and every
pattern follows the exact format described below. `src/patterns/strategy/` is the
reference implementation: when in doubt, copy what it does.

---

## ▶ When the user says "Add <name> pattern"

That short request is the whole brief, and it means **build it end to end now**:
- Don't ask for approval or show a plan first.
- Ask only if the name truly can't be matched to the catalog. "factory" means
  `factory-method`; say which one you picked.

Follow these steps in order.

1. **Resolve the id** from `src/patterns/catalog.ts` (e.g. "builder" → `builder`). The
   folder name, `id` and URL slug must all be this id. Check it isn't already in
   `src/patterns/registry.ts`.
2. **Study the reference.** Read every file in `src/patterns/strategy/`, plus
   `src/components/visual/index.tsx` and `src/types/pattern.ts`.
3. **Design before coding.** Decide these and keep them consistent across all files:
   - **Scenario:** use the idea from the [scenario table](#scenario-ideas) unless the user
     gave one. Make it a small, concrete, Bangladeshi everyday story with named people
     (Rahim, Karim, Nusrat, Mitu…) and realistic ৳ amounts.
   - **Roles:** map each pattern participant (e.g. Director, Builder, ConcreteBuilder,
     Product) to an object in the story. Every role appears as a `<Node>` whose
     `role` label is the pattern term.
   - **Interaction:** what the learner chooses (at least one meaningful choice, e.g. a
     preset, a type or an option) and what then runs. Changing the choice must visibly
     change what happens. That's the "aha" moment.
   - **Step list:** an ordered list of step ids. Each id must match a
     `// @step:<id>` marker in `code.main`, and each must have a caption in
     `content.steps`.
   - **Without vs With:** the messy alternative shows the real pain, e.g. a telescoping
     constructor, a giant if/else, duplicated code or tight coupling. The "with" side
     shows how easy the next change becomes.
4. **Write the 5 files** in `src/patterns/<id>/` (see [anatomy](#anatomy-of-a-pattern-folder)):
   - `code.ts` first, since it defines the step ids.
   - Then `content.en.ts` and `content.bn.ts`. Bangla is **complete and natural**, see
     the [bilingual rules](#bilingual-rules).
   - Then `Visual.tsx`, and finally `index.ts`.
5. **Register it**: add one import and one entry in `src/patterns/registry.ts`. Keep the
   list in catalog order. The sidebar, home page and "Coming soon" state update
   automatically.
6. **Verify.** All of these must pass; fix the problems and re-run until they do.
   ```bash
   npm run build                     # typecheck + production build
   npm run lint
   npm run check:pattern -- <id>     # headless Chrome: EN/বাংলা × light/dark × desktop/mobile
   ```
   `check:pattern` fails on:
   - console errors or warnings, including missing Bangla keys and missing code comments
   - a missing section, or code that isn't highlighted
   - horizontal scroll on mobile
   - a step that highlights no code line, or has an empty caption
   - visible `{{placeholders}}`
7. **Look at the screenshots** it writes to `.check/<id>/` (open the PNGs with the Read
   tool) and fix anything that looks broken or cramped:
   - text overflowing its box
   - unreadable contrast in dark mode
   - wrapping on 360px wide screens
   - Bangla that looks squeezed
8. **Commit**, only after everything passes, with a message like:
   `Add Builder pattern: custom PC build at the computer market` (with the scenario in the
   title and a short body listing what the visual shows).
9. **Report back** briefly:
   - the scenario and the learner's choice
   - what animates
   - the check results
   - anything you were unsure about, e.g. a Bangla phrasing or a simplification

### Definition of done (quality bar)

- [ ] All 4 sections are filled. The scenario has 2–3 short paragraphs, a `problem` and an `intent`.
- [ ] The visual has at least one learner choice. Pressing Play runs at least 5 animated
      steps, where messages or objects visibly move between `<Node>`s.
- [ ] Every step highlights the matching code line(s), and every caption explains *why*,
      not just *what*.
- [ ] `code.main` is 30–60 lines of idiomatic TypeScript showing all pattern roles plus
      a short client usage. `without` and `with` are each under about 30 lines.
- [ ] No hard-coded UI text in `Visual.tsx`: every label comes from `content.visual`.
- [ ] `content.bn.ts` has **every** key, even when the value is the same English term.
- [ ] Uses theme tokens and the shared `components/visual` blocks. Works at 360px and in dark mode.
- [ ] `build`, `lint` and `check:pattern` pass. The screenshots have been looked at.

---

## Commands

```bash
npm run dev                      # Vite dev server (http://localhost:5173)
npm run build                    # tsc -b (typecheck) + vite build
npm run lint                     # oxlint
npm run check:pattern -- <id>    # browser check of one pattern page (needs Chrome; CHROME_PATH to override)
```

Stack: React 19 + TypeScript 7 + Vite 8, Tailwind CSS v4 (class-based dark mode, theme
tokens in `src/index.css`, no config file), Framer Motion, react-i18next, Shiki (lazy-loaded),
React Router. Path alias `@/` → `src/`.

## Folder structure

```
scripts/check-pattern.mjs    headless-Chrome check used in step 6 (screenshots → .check/<id>/, git-ignored)
src/
├── App.tsx                  routes: /  ·  /patterns/:id  ·  *
├── index.css                theme tokens (light + dark), utilities, fonts, background motif
├── i18n/index.ts            react-i18next setup, useLang(), saves language in localStorage
├── locales/en.json, bn.json shared UI strings (header, sidebar, home, section titles…)
├── types/pattern.ts         PatternContent, PatternCode, VisualProps, PatternDefinition
├── hooks/
│   ├── useStepPlayer.ts     play / pause / step / reset / speed timeline for visuals
│   ├── usePatternContent.ts current-language content, English fallback, dev warning for missing Bangla
│   └── useTheme.ts          light/dark toggle (localStorage `dpp-theme`)
├── lib/
│   ├── code.ts              prepareCode(): fills {{comment}} placeholders, strips @step markers
│   ├── highlighter.ts       Shiki core (TypeScript), loaded on demand
│   ├── format.ts            formatNumber / formatTaka (Bangla digits in বাংলা mode)
│   ├── template.ts          fill('Pay {{amount}}', values) for captions and labels
│   └── merge.ts             English-fallback merge + findMissing()
├── components/
│   ├── layout/              AppLayout (sidebar + mobile drawer), Header, Sidebar
│   ├── visual/index.tsx     shared visual blocks: Stage, Node, Connector, Packet, StatusDot, Caption
│   ├── PatternPage.tsx      the 4-section page shell; every pattern renders through it
│   ├── CodePanel.tsx        highlighted code + running-line highlight + auto-scroll
│   ├── ComparePanel.tsx     Without vs With
│   ├── LanguageToggle.tsx, ThemeToggle.tsx, ErrorBoundary.tsx
│   └── ui/                  Button, Section/Card/BarCard, StepControls, icons
├── pages/                   HomePage, PatternRoute (+ Coming soon), NotFoundPage
└── patterns/
    ├── registry.ts          the list of BUILT patterns (sidebar order)
    ├── catalog.ts           all 23 GoF patterns; unbuilt ones show as "Coming soon"
    ├── define.ts            definePattern() helper
    └── <pattern-id>/        one folder per pattern
```

## The 4-section rule

Every pattern page has exactly these sections, in this order. `PatternPage.tsx` renders
them from the pattern's data, so a pattern can't skip or reorder them:

1. **Real-world scenario**: the story (`content.scenario`), plus "The problem" and the
   pattern's intent in one sentence.
2. **Interactive visualization**: `Visual.tsx`. The learner chooses something, presses
   Play or Step, and watches objects and messages animate, with a "What's happening"
   caption for each step.
3. **Code panel**: `code.main`. The line that is currently "running" is highlighted in
   sync with the visualization.
4. **Without vs With**: `code.without` (the messy version) next to `code.with` (the
   pattern version), followed by bullet points, "Why it's better" and "When to use".

## Anatomy of a pattern folder

```
src/patterns/<id>/
├── index.ts        definePattern({ id, category, icon, content: { en, bn }, code, Visual: lazy(() => import('./Visual')) })
├── content.en.ts   export const en = { ... } satisfies PatternContent; export type XContent = typeof en
├── content.bn.ts   export const bn: DeepPartial<XContent> = { ... }   (typos in keys are type errors)
├── code.ts         export const xCode: PatternCode = { main, without, with }   (TypeScript as strings)
└── Visual.tsx      export default function XVisual({ content, lang, onCodeStep }: VisualProps<XContent>)
```

`category` and `icon` come from the pattern's catalog entry.

### `content.*.ts` shape (see `PatternContent` in `src/types/pattern.ts`)

| Key | What goes in it |
|---|---|
| `title` | English pattern name, also in `bn` (e.g. `'Builder'`) |
| `tagline` | One-line hook |
| `intent` | The pattern in 1–2 sentences |
| `scenario` | `{ title, paragraphs[2–3], problem }` |
| `visual` | **Every** label `Visual.tsx` shows, as a flat object of strings. `{{name}}` placeholders are allowed |
| `steps` | Caption per step id (plus `idle`, and any interaction captions like `set-strategy`) |
| `codeComments` | Text for each `// {{key}}` in `code.ts` |
| `compare` | `{ without: { title, points[4] }, with: { title, points[4] }, benefit, whenToUse[3] }` |

### Code snippet conventions (`code.ts`)

- Code is TypeScript, written as template strings. Keep it idiomatic, compact and
  self-explanatory. Helper calls like `verifyOtp(...)` may stay undeclared.
- `// {{key}}` is replaced by `content.codeComments[key]` in the current language. **All
  comments go through placeholders**, never as hard-coded English comments.
- `// @step:a,b` at the **end** of a line lights that line up while visual step `a` or
  `b` runs. The marker is stripped before display. Several lines may share a step id.
- Both can sit on one line: `const fee = amount * 0.01; // {{nagadFee}} // @step:nagad-fee`.
- Avoid backticks inside the snippets, since they end the template string. Use `'…' + x`.

### Writing `Visual.tsx`

- Build with the shared blocks from `@/components/visual`:
  - `<Stage>` is the frame.
  - `<Node role title active accent mono>` is a participant. `role` is the pattern term
    and `title` is the class or object name.
  - `<Connector label down up downPacket upPacket runKey>` is an arrow with a moving
    `<Packet>`.
  - `<StatusDot status>` marks progress inside a node's step list.
  - `<Caption label text stepKey>` is the "What's happening" bubble.

  Need a variant, e.g. a horizontal connector? Add it to `components/visual`, not to the
  pattern folder.
- Timeline:
  - Build a `steps` array of `{ id, codeStep?, duration?, ...yourFields }` (often with
    `useMemo` from the learner's choice) and run it with `useStepPlayer(steps)`.
  - Render `<StepControls player={...} playLabel={...} />`.
- Sync the code:
  ```ts
  const codeStep = player.step ? (player.step.codeStep ?? player.step.id) : null
  useEffect(() => { onCodeStep(codeStep) }, [codeStep, onCodeStep])
  ```
  To highlight code for an interaction that happens before Play (like Strategy's
  `set-strategy`), report that step id while idle. See `strategy/Visual.tsx`.
- When the learner changes their choice, call `player.reset()`.
- Captions come from `fill(content.steps[key], values)`. Format numbers and money with
  `formatNumber` / `formatTaka(n, lang)` so বাংলা shows Bangla digits.
- Layout is a vertical stack of nodes and connectors. It must fit 360px: use grids with
  `grid-cols-3` or fewer, `truncate` on long class names, and no fixed widths over 300px.
- Animate with Framer Motion: `AnimatePresence` for swaps and entries, `layout` for moving
  items. The app already respects reduced motion.

## Bilingual rules

- Language toggle (EN | বাংলা) in the header, saved in localStorage as `dpp-lang`.
  `<html lang>` follows it, and the Bangla font is **Hind Siliguri**.
- **Code stays in English.** Only code comments are translated, through `{{key}}`
  placeholders. Code line numbers stay ASCII.
- **Keep technical terms in English inside Bangla text**: "Builder প্যাটার্ন",
  "interface (ইন্টারফেস)", "class", "object", "runtime", "method", "delegate করে",
  "step-by-step". Class, method and role names (Client, Director, Context…) are never
  translated.
- Write Bangla **naturally**, the way a Bangladeshi developer explains something to a
  friend over cha, not word for word. Use চলিত ভাষা: "করছে", not "করিতেছে". Keep sentences
  short.
- `content.bn.ts` must contain **every key** from `content.en.ts`, even when the value is
  identical. Missing keys still fall back to English, but they trigger a dev warning,
  which fails `check:pattern`.
- Use Bangla forms of everyday nouns and brands in Bangla text (বিকাশ, নগদ, কার্ট, রসিদ),
  and put the English technical term in parentheses where it helps:
  "অনুমোদন (authorize)".
- Amounts in prose: write `৳১,২৫০` in Bangla and `৳1,250` in English. In the visual, use
  `formatTaka`.
- Shared UI strings live in `src/locales/{en,bn}.json`, pattern text in the pattern's
  `content.*.ts`.

## Theme (Bangladeshi folk / rickshaw-art)

- Cream "paper" background with a printed motif (`.bg-motif`), bottle-green header with a
  chili-red rule, a `rickshaw-strip` tassel border, and maroon hero cards.
- Cards have thick outlines plus a hard offset shadow: `rounded-xl border-2 border-edge
  bg-card shadow-hard` (`shadow-hard-sm` for small items). Use `<Card>` or
  `<BarCard label tone>` from `components/ui/Section`.
- Small labels use `label-caps` (tracked uppercase, automatically untracked in বাংলা).
  Headings use `font-display` (Baloo Da 2), body text Hind Siliguri, code `font-mono`.
- **Use semantic color tokens, never the Tailwind palette** (`slate-`, `indigo-`…).
  - Tokens: `paper`, `paper-deep`, `card`, `ink`, `ink-soft`, `edge`, `shade`, `bottle`,
    `maroon`, `mustard`, `chili`, `jade`, `cream`, `code`, `on-accent`.
  - They're CSS variables that swap for dark mode, so `dark:` variants are rarely needed.
  - Text on mustard uses `text-on-accent`; text on bottle, maroon or chili uses `text-cream`.
- Code panels are always dark in both themes.
- Real-world brand colors may be fixed hex values (e.g. bKash `#E2136E`). Never copy logos.

## Scenario ideas

Defaults for each pattern, all relatable Bangladeshi everyday situations. Use the row
for the requested pattern unless the user specifies otherwise.

| Pattern | Scenario | Learner's choice → what animates |
|---|---|---|
| ~~strategy~~ | ✅ built: online checkout, bKash / Nagad / Card | method → Checkout swaps strategy, payment flows |
| factory-method | Courier company: the Dhaka branch ships by rickshaw-van, the Chattogram branch by truck, Barishal by launch | branch → its `createTransport()` makes the right vehicle, parcel travels |
| abstract-factory | Restaurant combo kitchens: a Deshi kitchen (kacchi + borhani + firni) vs a Chinese kitchen (fried rice + soup + pudding); items must match | kitchen → factory produces a matching family of dishes |
| builder | Building a custom PC at the computer market: CPU, RAM, SSD, GPU, casing step by step; a Director has "Office" and "Gaming" presets | preset or custom parts → builder adds parts one by one, then `build()` returns the PC |
| prototype | Exam question paper: make Set A, B, C by cloning a master paper and shuffling questions | clone count or shuffle → copies are created from the prototype |
| singleton | One shop cash box (ক্যাশবাক্স) shared by every salesperson; two boxes = mismatched totals | salespeople sell → all calls hit the same instance |
| adapter | Shop's `PaymentStrategy` meets a new bank SDK with a different API; plus a 3-pin plug → 2-pin socket picture | provider → adapter translates the call shape |
| bridge | Notifications: message types (OTP, promo, alert) × channels (SMS, email, push) without class explosion | type × channel → abstraction delegates to implementor |
| composite | Bazar list: bags inside bags (fish bag, vegetable bag) plus loose items; total price | open bags → `getPrice()` recurses through the tree |
| decorator | Jhalmuri or fuchka with add-ons (extra chanachur, egg, extra spicy), each adding price and description | toggle add-ons → wrappers stack, price grows |
| facade | Cox's Bazar trip agency: one `bookTrip()` call hides bus, hotel, tour guide and SMS subsystems | package → facade calls every subsystem in order |
| flyweight | City traffic map with thousands of rickshaws sharing one sprite and model (intrinsic) but own position (extrinsic) | rickshaw count → memory with and without sharing |
| proxy | Exchange-rate API: a caching proxy in front of a slow bank rate service | request twice → first goes to the real service, second is served from cache |
| chain-of-responsibility | Bank loan approval: officer → manager → branch head, by amount | loan amount → request passes along until someone handles it |
| command | Restaurant order slips: the waiter creates command slips, the kitchen executes them, cancel = undo | add or cancel items → commands queue, execute, undo |
| interpreter | Shop discount rules like `total > 1000 AND category = saree` | rule → expression tree evaluates against a cart |
| iterator | Cricket team batting order: iterate in order, by strike rate, or only all-rounders | iterator type → same team, different traversal |
| mediator | Airport control tower coordinating planes for one runway | planes request to land → all talk via the tower, not each other |
| memento | Writing a social post with save points and undo | type, save, undo → editor state saved and restored |
| observer | Live cricket score: app, SMS service and TV ticker subscribe to the match | subscribe or unsubscribe, ball bowled → notifications fan out |
| state | Ride-sharing trip: Requested → Accepted → On trip → Completed / Cancelled | press actions → same button behaves differently per state |
| template-method | Making cha vs coffee: same steps (boil, brew, pour, add-ons) with different details | drink → skeleton runs, subclass steps fill in |
| visitor | VAT calculation over a cart with food, clothing and electronics at different rates | visitor (VAT, discount) → each item accepts the visitor |

## Conventions

- Tailwind only, no CSS files per component. Check every screen in light and dark mode.
- Respect reduced motion: the app is wrapped in `<MotionConfig reducedMotion="user">`.
- Keep pattern code self-contained in its folder. Helpers useful to several patterns go
  in `components/visual`, `components/ui`, `hooks` or `lib`.
- `erasableSyntaxOnly` is on, so app code can't use `enum` or constructor parameter
  properties. (Code *strings* shown to learners may use them.)
- Don't change shared components in a way that changes Strategy's look or behavior
  without re-running `npm run check:pattern -- strategy`.
- Commit after each working step. Never commit a failing `build`, `lint` or `check:pattern`.
