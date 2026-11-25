# Design Pattern Playground

A bilingual (English + বাংলা) React app that teaches software design patterns through
real-world stories and **3-level games**: learners learn by playing. Patterns are added
**one at a time**, and every pattern follows the exact format described below.
`src/patterns/strategy/` and `src/patterns/factory-method/` are the reference
implementations: when in doubt, copy what they do.

---

## ▶ When the user says "Add <name> pattern"

That short request is the whole brief, and it means **build it end to end now**:
- Don't ask for approval or show a plan first. (The one thing you *do* wait for is the
  user's OK before committing, see step 9.)
- Ask only if the name truly can't be matched to the catalog. "factory" means
  `factory-method`; say which one you picked.

Follow these steps in order.

1. **Resolve the id** from `src/patterns/catalog.ts` (e.g. "builder" → `builder`). The
   folder name, `id` and URL slug must all be this id. Check it isn't already in
   `src/patterns/registry.ts`.
2. **Study the references.** Read every file in `src/patterns/strategy/` and
   `src/patterns/factory-method/` (both are 3-level games), plus
   `src/components/game/` (index.tsx + state.ts), `src/components/visual/index.tsx`,
   `src/hooks/useStepPlayer.ts` and `src/types/pattern.ts`.
3. **Design before coding.** Decide these and keep them consistent across all files:
   - **Scenario:** use the idea from the [scenario table](#scenario-ideas) unless the user
     gave one. Make it a small, concrete, Bangladeshi everyday story with named people
     (Rahim, Karim, Nusrat, Mitu…) and realistic ৳ amounts.
   - **Roles:** map each pattern participant (e.g. Director, Builder, ConcreteBuilder,
     Product) to an object in the story. Every role appears as a `<Node>` whose
     `role` label is the pattern term.
   - **Interaction: a 3-level game.** Start from the pattern's row in the
     [scenario table](#scenario-ideas). Learners learn by playing (see
     [Learn-by-playing games](#learn-by-playing-games)):
     1. **No pattern**: the learner does the messy job by hand; wrong choices fail in a
        fun way. Code panel shows `without`.
     2. **Use the pattern**: the same job through the pattern's roles; the learner only
        makes the pattern-level choice. Code panel shows `main`.
     3. **Extend it**: a new requirement arrives; the learner builds the new class(es)
        by answering 2 concept questions, sees "0 lines of old code edited", and uses it.
        Code panel shows `with`.
     Every turn ends with Play running an animated, code-synced timeline. That's the
     "aha" moment. Plan 3 turns (orders, customers, requests…) per level, the wrong
     answers and their hints, and the 2 concept questions for level 3.
   - **Step lists:** one per level. Each id must match a `// @step:<id>` marker in
     **every** code language: level 1 ids in `without`, level 2 ids in `main`, level 3
     (building + using the new class) ids in `with`. Each needs a caption in
     `content.steps`.
   - **Without vs With:** the messy alternative shows the real pain, e.g. a telescoping
     constructor, a giant if/else, duplicated code or tight coupling. The "with" side
     shows how easy the next change becomes.
4. **Write the files** in `src/patterns/<id>/` (see [anatomy](#anatomy-of-a-pattern-folder)):
   - `code/ts.ts` first, since it defines the step ids. Then the other nine
     languages, one file each: `java`, `csharp`, `python`, `go`, `rust`, `cpp`, `php`,
     `ruby`, `swift` (same story, same step ids, idiomatic for that language), and
     `code/index.ts`.
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
   - a step that highlights no code line, or has an empty caption, in **any** code
     language (all 10 are walked; a language whose `@step` ids differ from TypeScript
     logs a warning)
   - visible `{{placeholders}}`

   `check:pattern` only steps through the **first turn of level 1** (the tutorial). So
   also **play the whole game** with a throwaway Puppeteer script
   (`scripts/.tmp-playtest.mjs`, deleted afterwards; copy the pattern from
   `scripts/check-pattern.mjs`): every level and turn, at least one wrong answer per
   level, the level-3 builder, in EN desktop and বাংলা dark 360px. Fail on any console
   warning/error, print the highlighted code line at key moments, and screenshot the
   `#visual` element at each key moment. Drive it with these hooks:
   `[data-player="play"]`, `[data-game="after-outcome"]` (Next / Try again),
   `[data-game="next-level"]`, `[data-game="open-branch"]` (finish the level-3 builder),
   and `#visual [role=radiogroup|group] [role=radio|checkbox]` for choices.
7. **Look at the screenshots** it writes to `.check/<id>/` (open the PNGs with the Read
   tool) and fix anything that looks broken or cramped:
   - text overflowing its box
   - unreadable contrast in dark mode
   - wrapping on 360px wide screens
   - Bangla that looks squeezed
   - code that isn't highlighted in some language (screenshots for non-default code
     languages end in `-<lang>`, e.g. `en-full-python.png`)
   - in the playtest shots (take them at 360px *viewport*, not only of `#visual`): the
     active node is on screen at each step and not hidden under the sticky caption
   - in the playtest shots: a broken level, a hint that doesn't explain, a failure that
     isn't visible, or a level-complete card that doesn't fit at 360px
8. **Report back** briefly, and **stop there; don't commit yet**:
   - the scenario and the 3 levels (what the learner does, what goes wrong, the
     level-3 questions)
   - what animates
   - the check and playtest results
   - anything you were unsure about, e.g. a Bangla phrasing, a simplification, or a
     language where the pattern had to be expressed differently (e.g. Go, Rust)
   - the commit message you propose
9. **Commit only after the user confirms** (see [Git & commits](#git--commits)), with a
   message like `Add Builder pattern: custom PC build at the computer market` (with the
   scenario in the title and a short body listing the 3 levels).

### Definition of done (quality bar)

- [ ] All 4 sections are filled. The scenario has 2–3 short paragraphs, a `problem` and an `intent`.
- [ ] The visual is a 3-level game (no pattern → use it → extend it) built with
      `components/game`, with wrong-answer hints, stars and a final "What you learned"
      recap. Every turn's Play runs at least 5 animated steps, where messages or objects
      visibly move between `<Node>`s. The first turn is a guided tutorial (choice
      pre-selected) so `check:pattern` can step through it.
- [ ] **The page follows the action**: every step marks the `<Node>` where it happens as
      `active`, so on a phone Play/Step scrolls to it step by step (see
      [Follow the action](#writing-visualtsx)). The caption stays readable at the bottom.
- [ ] Every step highlights the matching code line(s), and every caption explains *why*,
      not just *what*.
- [ ] Code exists in **all 10 languages**: Java, C#, TS (type-enforced) plus Python,
      Go, Rust, C++, PHP, Ruby, Swift. Each `main` is 30–60 lines (Allman-brace
      languages may run a little longer) of idiomatic code showing all pattern roles
      plus a short client usage. `without` and `with` are each under about 30 lines.
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
scripts/check-pattern.mjs    headless-Chrome check used in step 6 (all code languages; screenshots → .check/<id>/, git-ignored)
src/
├── App.tsx                  routes: /  ·  /patterns/:id  ·  *
├── index.css                theme tokens (light + dark), utilities, fonts, background motif
├── i18n/index.ts            react-i18next setup, useLang(), saves language in localStorage
├── locales/en.json, bn.json shared UI strings (header, sidebar, home, section titles…)
├── types/pattern.ts         PatternContent, PatternCode, VisualProps, PatternDefinition
├── hooks/
│   ├── useStepPlayer.ts     play / pause / step / reset / speed timeline for visuals
│   ├── usePatternContent.ts current-language content, English fallback, dev warning for missing Bangla
│   ├── useTheme.ts          light/dark toggle (localStorage `dpp-theme`)
│   └── useCodeLang.ts       code-language choice shared by all code panels (localStorage `dpp-code-lang`)
├── lib/
│   ├── code.ts              prepareCode(): fills {{comment}} placeholders, strips @step markers; step-parity check
│   ├── highlighter.ts       Shiki core; one grammar per code language, loaded on demand
│   ├── format.ts            formatNumber / formatTaka (Bangla digits in বাংলা mode)
│   ├── template.ts          fill('Pay {{amount}}', values) for captions and labels
│   └── merge.ts             English-fallback merge + findMissing()
├── components/
│   ├── layout/              AppLayout (sidebar + mobile drawer), Header, Sidebar
│   ├── visual/index.tsx     shared visual blocks: Stage, Node, Connector, Packet, StatusDot, Caption
│   ├── game/                game shell: index.tsx (GameHud, MissionBanner, ChoiceButton, LevelCompleteCard, Recap, NewCodeChip), state.ts (levels, stars, saved progress, shake)
│   ├── PatternPage.tsx      the 4-section page shell; every pattern renders through it
│   ├── CodePanel.tsx        highlighted code + running-line highlight + auto-scroll
│   ├── CodeLangTabs.tsx     the Java | C# | TS | … switch (wraps on mobile)
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
2. **Interactive visualization**: `Visual.tsx`, a 3-level game. In each turn the learner
   chooses something, presses Play or Step, and watches objects and messages animate,
   with a "What's happening" caption for each step.
3. **Code panel**: `main`, with a `Java | C# | TS | Python | Go | …` switch above it. The line that is
   currently "running" is highlighted in sync with the visualization, in every language.
   The game switches it to `without` (level 1) or `with` (level 3 building) as needed.
4. **Without vs With**: `without` (the messy version) next to `with` (the pattern
   version) in the chosen language, followed by bullet points, "Why it's better" and
   "When to use".

## Anatomy of a pattern folder

```
src/patterns/<id>/
├── index.ts        definePattern({ id, category, icon, content: { en, bn }, code, Visual: lazy(() => import('./Visual')) })
├── content.en.ts   export const en = { ... } satisfies PatternContent; export type XContent = typeof en
├── content.bn.ts   export const bn: DeepPartial<XContent> = { ... }   (typos in keys are type errors)
├── code/
│   ├── index.ts    export const xCode: PatternCode = { java, csharp, ts, python, go, rust, cpp, php, ruby, swift }
│   ├── ts.ts       export const ts: CodeSet = { main, without, with }   (code as strings)
│   └── java.ts, csharp.ts, python.ts, go.ts, rust.ts, cpp.ts, php.ts, ruby.ts, swift.ts
└── Visual.tsx      export default function XVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<XContent>)
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
| `steps` | Caption per step id, plus idle / tutorial captions, wrong-answer hints, builder questions and `level1-done` … `level3-done` |
| `codeComments` | Text for each `// {{key}}` in any `code/*.ts` (shared by all code languages) |
| `compare` | `{ without: { title, points[4] }, with: { title, points[4] }, benefit, whenToUse[3] }` |

### Code snippet conventions (`code/*.ts`)

> Two different "languages": the **UI language** (EN | বাংলা, `dpp-lang`) translates
> text and code comments; the **code language** (Java | C# | TS | …, `dpp-code-lang`)
> picks which programming language the snippets are shown in. They are independent.

#### Languages

Every pattern ships the same example in **10 code languages**, in this tab order
(`CODE_LANGS` in `src/types/pattern.ts`). Java is first and is the default.

| Tab | File | Required? | Filename style | Comment / marker |
|---|---|---|---|---|
| Java | `java.ts` | ✅ type error if missing | `Checkout.java` | `//` |
| C# | `csharp.ts` | ✅ | `Checkout.cs` | `//` |
| TS | `ts.ts` | ✅ (the reference) | `checkout.ts` | `//` |
| Python | `python.ts` | expected | `checkout.py` | `#` |
| Go | `go.ts` | expected | `checkout.go` | `//` |
| Rust | `rust.ts` | expected | `checkout.rs` | `//` |
| C++ | `cpp.ts` | expected | `checkout.cpp` | `//` |
| PHP | `php.ts` | expected | `Checkout.php` | `//` |
| Ruby | `ruby.ts` | expected | `checkout.rb` | `#` |
| Swift | `swift.ts` | expected | `Checkout.swift` | `//` |

"Expected" means: write it for every new pattern. If one is missing anyway, the app still
works and its tab is simply hidden (`check:pattern` prints a note).

The chosen code language drives both the code panel (section 3) and Without vs With
(section 4). Shiki loads each grammar only when that language is first shown.

#### Markers and comments (same in every language)

- `// {{key}}` (or `# {{key}}` in Python/Ruby) is replaced by `content.codeComments[key]`
  in the current UI language. **All comments go through placeholders**, never as
  hard-coded English comments. All code languages share the same keys.
- `// @step:a,b` (or `# @step:a,b`) at the **end** of a line lights that line up while
  visual step `a` or `b` runs. The marker is stripped before display. Several lines may
  share a step id.
- Both can sit on one line: `fee = amount * 0.01  # {{nagadFee}} # @step:nagad-fee`.
- Every language's `main` must use **exactly the same `@step` ids** as `ts.ts`. A dev
  warning (`[code] <id>/<lang>: @step markers differ from TypeScript`) fails `check:pattern`.
- Comment text must make sense in every language. Don't say "no `new` here" in a
  language without `new`; add a second key instead (Factory Method has `noNew` for
  Java/C#/TS/PHP/Ruby and `noConcrete` for Python/Go/Rust/C++/Swift).

#### Writing each language

Write each language **idiomatically**, the way a developer of that language would, not
as a line-by-line port of the TypeScript. Keep the story, the type names and the values
(fees, cities, amounts) identical so the visual still matches.

| Language | Style to use |
|---|---|
| Java | `record` for data, `interface` / `abstract class`, `@Override`, `switch ->` |
| C# | `record`, `IInterface` names, PascalCase methods, `=>` members, Allman braces, `decimal` for money |
| TS | `interface`, `abstract class`, `readonly` |
| Python | `@dataclass`, `ABC` + `@abstractmethod` or `Protocol`, snake_case, type hints |
| Go | no classes or inheritance: structs + interfaces; a "subclass hook" becomes a function field. Exported names PascalCase |
| Rust | traits (default methods for shared logic), `Box<dyn Trait>`, snake_case, `match` |
| C++ | `virtual` / `override` / `= 0`, `std::unique_ptr` + `std::make_unique`, `std::string` |
| PHP | starts with `<?php`, `readonly class`, constructor promotion, typed params, `match` |
| Ruby | duck typing; a base class/module raising `NotImplementedError`, `Data.define`, endless `def x = …` |
| Swift | `protocol` + `extension` for shared logic, `struct`, `any Protocol` |

- Keep it compact: `main` is 30–60 lines (Allman-brace languages like C# and PHP may run a
  little longer); `without` and `with` are each under about 30 lines.
- Helpers like `verifyOtp(...)` may stay undeclared. Name them in that language's style
  (`verify_otp` in Python/Ruby/Rust, `VerifyOtp` in C#, `verifyOTP` in Go/Swift).
- Indent with **spaces**, never tabs (tabs render 8 wide in the panel), including Go.
- When a language can't express the pattern the classic way (Go and Rust have no
  inheritance), show the natural alternative and add a one-line note at the top of that
  file (a normal TS comment outside the snippet) explaining why.

#### Template-string gotchas

Snippets are JavaScript template strings, so inside them:
- no backticks (they end the string),
- no `${` (it interpolates),
- no backslashes (`\(x)` in Swift, `\n` anywhere): the backslash is swallowed.

Concatenate instead (`'…' + x`, `"…" . $x`), or use interpolation without those
characters: Python `f"{x}"`, Ruby `"#{x}"`, Rust `format!("{x}")`. Never C# `$"{x}"`.
Avoid `{{` in code (Python f-strings, Rust `format!`): it looks like a placeholder.

#### Adding another code language (Kotlin, Dart…)

1. Add it to `CODE_LANGS` in `src/types/pattern.ts` (choose `required` and tab position).
2. Add its Shiki grammar in `GRAMMARS` in `src/lib/highlighter.ts`.
3. Write `code/<lang>.ts` for every built pattern and add it to each `code/index.ts`.
4. Add a row to the tables above, then run `check:pattern` for every pattern.

### Learn-by-playing games

Both built patterns are 3-level games; copy `factory-method/Visual.tsx` or
`strategy/Visual.tsx`.

- **Shell** (`@/components/game`): `<GameHud>` (level tabs with stars + ৳ counter),
  `<MissionBanner>`, `<ChoiceButton>` (radio or checkbox tile that shakes on a wrong
  answer), `<LevelCompleteCard>`, `<Recap>`, `<NewCodeChip>`. State helpers live in
  `@/components/game/state`: `useGameProgress(key)` (unlocked levels, stars, ৳; saved
  in localStorage as `dpp-<id>-game`), `useShake()`, `starsFor(mistakes)`.
- **Turn loop:** the learner chooses → presses Play (a `useStepPlayer` timeline) → the
  outcome is *derived* from `player.done` (don't set state in an effect) → a
  "Next / Try again" button saves the result (৳, mistakes, dots).
- **Wrong answers** never just say "wrong": the caption explains the concept, and the
  choice shakes. Each mistake costs a star (0 → ★★★, 1 → ★★☆, 2+ → ★☆☆).
- **Code panel:** report `onCodeView('without' | 'main' | 'with')` per level, and put
  `@step` markers for the game in the `without`/`with` snippets of **all** languages.
  While idle, highlight what the current choice would run.
- **Level-complete cards:** level 1 teases the next requirement (with a `???` code
  chip), level 2 summarises what the pattern saved, level 3 shows the recap.
- All game text lives in `content.visual` / `content.steps` (EN + বাংলা), as usual.

### Writing `Visual.tsx`

- Build with the shared blocks from `@/components/visual`:
  - `<Stage>` is the frame.
  - `<Node role title active accent mono>` is a participant. `role` is the pattern term
    and `title` is the class or object name.
  - `<Connector label down up downPacket upPacket runKey>` is an arrow with a moving
    `<Packet>`.
  - `<StatusDot status>` marks progress inside a node's step list.
  - `<Caption label text stepKey>` is the "What's happening" bubble. It is sticky to the
    bottom of the screen, so it stays readable while the page scrolls. Render exactly
    one, right above `<StepControls>`.

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
- Optional: a visual can switch the code panel to another snippet with
  `onCodeView('without' | 'with' | 'main')`, e.g. while a game level plays the
  no-pattern version. Put `@step` markers in that snippet too (in every language), and
  switch back to `'main'` on unmount. See `factory-method/Visual.tsx` (a 3-level game).
- When the learner changes their choice, call `player.reset()`.
- Captions come from `fill(content.steps[key], values)`. Format numbers and money with
  `formatNumber` / `formatTaka(n, lang)` so বাংলা shows Bangla digits.
- Layout is a vertical stack of nodes and connectors. It must fit 360px: use grids with
  `grid-cols-3` or fewer, `truncate` on long class names, and no fixed widths over 300px.
- Animate with Framer Motion: `AnimatePresence` for swaps and entries, `layout` for moving
  items. The app already respects reduced motion.
- **Follow the action.** On a phone the stage is taller than the screen, and Play sits at
  the bottom, so the learner must *see* each step without scrolling by hand. This is
  built in; the pattern only has to feed it correctly:
  - Pressing Play or Step (`<StepControls>`) starts "following"; the run ending, Reset or
    the learner scrolling by hand stops it (`components/visual/follow.ts`).
  - While following, every `<Node>` that becomes `active` scrolls itself into view
    (only if it isn't already fully visible, clear of the header and sticky caption).
  - So **every step must set `active` on the node where that step happens**, the one
    sending, receiving or changing. A step with no active node, or the wrong one, leaves
    the learner looking at the wrong place. When two nodes are active, the one that
    becomes active last is scrolled to.
  - Don't add your own `scrollIntoView` / `window.scrollTo` in `Visual.tsx`. If a part
    of the stage that isn't a `<Node>` must be followed, extend `components/visual`.

## Bilingual rules

- Language toggle (EN | বাংলা) in the header, saved in localStorage as `dpp-lang`.
  `<html lang>` follows it, and the Bangla font is **Hind Siliguri**.
- **Code stays in English** in every code language. Only code comments are translated, through `{{key}}`
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

Defaults for each pattern, all relatable Bangladeshi everyday situations, with a sketch
of the 3 levels: **L1** no pattern (the pain) → **L2** use the pattern → **L3** extend it
with new classes only. Use the row for the requested pattern unless the user specifies
otherwise; refine the details while designing.

| Pattern | Scenario | L1 → L2 → L3 |
|---|---|---|
| ~~strategy~~ | ✅ built: Rahim's shop checkout, bKash / Nagad / Card | L1 tick each method's steps in one `checkout()` → L2 plug strategies into Checkout, swap one at runtime → L3 add `RocketPayment` |
| ~~factory-method~~ | ✅ built: Sathi Courier, Dhaka van / Chattogram truck / Barishal launch | L1 pick every vehicle yourself → L2 hand parcels to branches, `createTransport()` decides → L3 build `SylhetBranch` + `Drone` |
| abstract-factory | Restaurant combo kitchens: Deshi (kacchi + borhani + firni) vs Chinese (fried rice + soup + pudding) | L1 assemble each combo dish by dish; a mismatched combo (kacchi + soup) gets sent back → L2 pick a kitchen, its factory makes a matching family → L3 add a Thai kitchen (factory + 3 dishes), menu code untouched |
| builder | Custom PC at the computer market: CPU, RAM, SSD, GPU, casing; Director presets "Office" and "Gaming" | L1 fill a telescoping `new PC(…)` constructor; wrong order or a missing part and it won't boot → L2 builder adds parts step by step, Director presets do it for you → L3 add a `QuotationBuilder`: the same Director steps now produce a price quote |
| prototype | Exam papers: Set A, B, C cloned from a master paper, questions shuffled | L1 retype each set by hand; typos and slow → L2 `clone()` the master and shuffle → L3 add a new paper type (with diagrams) that implements `clone()`; the copier is unchanged |
| singleton | One shop cash box (ক্যাশবাক্স) shared by every salesperson | L1 each salesperson does `new CashBox()`; totals don't match at closing → L2 everyone uses `CashBox.getInstance()`, totals match → L3 a new bKash counter joins and gets the same instance (questions: why a private constructor, why not a global) |
| adapter | The shop's `PaymentStrategy` meets a new bank SDK with a different API (paisa, other method names) | L1 call the SDK directly and rewrite checkout for its shape; unit mismatch overcharges → L2 an adapter translates `pay(amount)` → SDK call → L3 a second SDK arrives: one new adapter, checkout untouched |
| bridge | Notifications: message types (OTP, promo, alert) × channels (SMS, email, push) | L1 create a class per combination; a class counter explodes → L2 pick type + channel, abstraction delegates to implementor → L3 add WhatsApp: 1 new class instead of 3 |
| composite | Bazar list: bags inside bags (fish bag, vegetable bag) plus loose items | L1 hand-written loops per nesting level; a bag inside a bag breaks the total → L2 `getPrice()` recurses the tree → L3 add a gift-box container; total code unchanged |
| decorator | Fuchka or jhalmuri with add-ons (extra chanachur, egg, extra spicy) | L1 a subclass per combination (`FuchkaWithEggAndSpicy`…) explodes → L2 stack wrappers, price and description grow → L3 add a new topping (tok-doi) as one decorator |
| facade | Cox's Bazar trip agency: bus, hotel, tour guide and SMS subsystems | L1 the client books every subsystem in the right order; wrong order fails → L2 one `bookTrip()` hides it → L3 add a travel-insurance subsystem inside the facade; clients unchanged |
| flyweight | City traffic map with thousands of rickshaws | L1 each rickshaw gets its own sprite; the memory bar overflows as the count grows → L2 shared sprite (intrinsic) + own position (extrinsic), memory stays flat → L3 add CNGs as another flyweight |
| proxy | Exchange-rate API: a caching proxy in front of a slow bank rate service | L1 every request waits for the slow bank (timer, cost) → L2 caching proxy, the second request is instant → L3 add a logging / rate-limit proxy; the client is unchanged |
| chain-of-responsibility | Bank loan approval: officer → manager → branch head, by amount | L1 one function with nested ifs routes loans; the learner routes them by hand → L2 the request passes along until someone handles it → L3 insert a regional-manager handler without editing the others |
| command | Restaurant order slips: waiter writes slips, kitchen executes, cancel = undo | L1 the waiter shouts straight at the cook; no queue, no undo → L2 command slips queue, execute, undo → L3 add a new command ("make it spicy") as one class |
| interpreter | Shop discount rules like `total > 1000 AND category = saree` | L1 hard-coded ifs; every new rule means editing code → L2 build the rule from expression blocks and evaluate it against a cart → L3 add an `OR` / `NOT` expression type |
| iterator | Cricket team batting order | L1 a different hand-written loop for each traversal inside Team → L2 pick an iterator (in order, by strike rate, all-rounders); same team → L3 add a "left-handers only" iterator |
| mediator | Airport control tower and one runway | L1 planes talk to each other directly; links multiply and two planes collide → L2 every plane talks only to the tower → L3 add a helicopter colleague; planes unchanged |
| memento | Writing a social post with save points and undo | L1 undo by copying fields by hand; a field gets missed → L2 save / restore mementos → L3 add an image field; the caretaker is unchanged |
| observer | Live cricket score: app, SMS service and TV ticker | L1 the Match calls each display directly; adding one means editing Match → L2 subscribe / unsubscribe, a ball bowled fans out → L3 add a Facebook-page subscriber with 0 edits to Match |
| state | Ride-sharing trip: Requested → Accepted → On trip → Completed / Cancelled | L1 a giant switch in every button handler; an illegal action slips through → L2 state objects decide what each button does → L3 add a "Waiting for rider" state |
| template-method | Making cha vs coffee: boil, brew, pour, add-ons | L1 two copy-pasted recipes; a fix has to be made twice → L2 the skeleton runs, subclasses fill in the steps → L3 add lemon tea, overriding only the add-ons step |
| visitor | VAT over a cart of food, clothing and electronics at different rates | L1 VAT code inside every item class; a discount means editing them all → L2 a `VatVisitor` visits each item → L3 add a `DiscountVisitor` without touching the item classes |

## Conventions

- Tailwind only, no CSS files per component. Check every screen in light and dark mode.
- Respect reduced motion: the app is wrapped in `<MotionConfig reducedMotion="user">`.
- Keep pattern code self-contained in its folder. Helpers useful to several patterns go
  in `components/visual`, `components/ui`, `hooks` or `lib`.
- `erasableSyntaxOnly` is on, so app code can't use `enum` or constructor parameter
  properties. (Code *strings* shown to learners may use them.)
- After changing anything shared (`components/game`, `components/visual`, `PatternPage`,
  `CodePanel`, `lib/code.ts`…), re-run `npm run check:pattern -- <id>` for **every** built
  pattern in `registry.ts`.

## Git & commits

- **Never commit without the user's confirmation.** After any implementation (a new
  pattern, a fix, a refactor, a docs change), show what changed, propose a commit
  message, and wait for the user to say so before running `git commit`. Approval for
  one commit does not carry over to the next.
- **No AI co-author or attribution.** Don't add `Co-Authored-By: Claude …`,
  "Generated with Claude Code" or similar lines to commit messages or PR descriptions.
- Never commit a failing `build`, `lint` or `check:pattern`.
- Keep one logical change per commit; never push unless asked.
