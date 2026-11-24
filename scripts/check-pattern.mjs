#!/usr/bin/env node
/**
 * Browser check for one pattern page:  npm run check:pattern -- <id>
 *
 * Starts its own Vite dev server, opens /patterns/<id> in headless Chrome in
 * EN + বাংলা × light + dark × desktop + mobile, and fails if:
 *   - any console error / warning (incl. "[i18n] missing Bangla" and "[code] missing code comment")
 *   - one of the 4 sections is missing, or the code isn't syntax-highlighted
 *   - the page scrolls horizontally
 *   - a step of the visualization highlights no code line, or has an empty caption
 *   - unfilled "{{placeholders}}" are visible
 * Screenshots are written to .check/<id>/ for a visual review.
 *
 * Chrome: set CHROME_PATH, otherwise common install locations are tried.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import puppeteer from 'puppeteer-core'
import { createServer } from 'vite'

const id = process.argv[2]
if (!id) {
  console.error('Usage: npm run check:pattern -- <pattern-id>   (e.g. strategy)')
  process.exit(2)
}

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean)
const executablePath = chromeCandidates.find((p) => existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Chromium found. Set CHROME_PATH=/path/to/chrome')
  process.exit(2)
}

const outDir = resolve('.check', id)
mkdirSync(outDir, { recursive: true })

const IGNORED_CONSOLE = [/\[vite\]/, /React DevTools/, /Download the React DevTools/]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const server = await createServer({ server: { port: 0, strictPort: false }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls.local[0].replace(/\/$/, '')

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
const failures = []
const fail = (combo, msg) => failures.push(`[${combo}] ${msg}`)

const combos = []
for (const lang of ['en', 'bn'])
  for (const theme of ['light', 'dark'])
    for (const [device, width, height] of [
      ['desktop', 1366, 900],
      ['mobile', 360, 780],
    ])
      combos.push({ lang, theme, device, width, height })

try {
  // Warm up: lets Vite pre-bundle deps before the real runs.
  {
    const page = await browser.newPage()
    await page.goto(`${base}/patterns/${id}`, { waitUntil: 'networkidle0' })
    await wait(1500)
    await page.close()
  }

  for (const c of combos) {
    const combo = `${c.lang}/${c.theme}/${c.device}`
    const page = await browser.newPage()
    page.on('console', (m) => {
      const text = m.text()
      if ((m.type() === 'error' || m.type() === 'warn') && !IGNORED_CONSOLE.some((r) => r.test(text))) {
        fail(combo, `console.${m.type()}: ${text.split('\n')[0]}`)
      }
    })
    page.on('pageerror', (e) => fail(combo, `page error: ${e.message}`))
    await page.setViewport({ width: c.width, height: c.height })
    await page.evaluateOnNewDocument(
      (lang, theme) => {
        localStorage.setItem('dpp-lang', lang)
        localStorage.setItem('dpp-theme', theme)
      },
      c.lang,
      c.theme,
    )
    await page.goto(`${base}/patterns/${id}`, { waitUntil: 'networkidle0' })

    const exists = await page.$('#scenario')
    if (!exists) {
      fail(combo, `page /patterns/${id} did not render a pattern page (is it in registry.ts?)`)
      await page.close()
      continue
    }
    await page.waitForSelector('.shiki-token', { timeout: 8000 }).catch(() => fail(combo, 'code was not syntax-highlighted'))
    await page.waitForSelector('[data-player="step"]', { timeout: 8000 }).catch(() => {})

    const layout = await page.evaluate(() => ({
      sections: ['scenario', 'visual', 'code', 'compare'].filter((s) => !document.getElementById(s)),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      htmlLang: document.documentElement.lang,
    }))
    if (layout.sections.length) fail(combo, `missing section(s): ${layout.sections.join(', ')}`)
    if (layout.overflow > 0) fail(combo, `page scrolls horizontally by ${layout.overflow}px`)
    if (layout.htmlLang !== c.lang) fail(combo, `<html lang> is "${layout.htmlLang}"`)

    // Walk the default timeline with the Step button.
    const hasStep = await page.$('[data-player="step"]')
    if (!hasStep) {
      fail(combo, 'no <StepControls> step button found in the visualization')
    } else {
      let steps = 0
      for (; steps < 60; steps++) {
        const disabled = await page.$eval('[data-player="step"]', (b) => b.disabled)
        if (disabled) break
        await page.click('[data-player="step"]')
        await wait(450)
        const s = await page.evaluate(() => ({
          active: document.querySelectorAll('#code [data-active="true"]').length,
          caption: document.querySelector('[data-caption]')?.textContent?.trim() ?? null,
        }))
        if (s.active === 0) fail(combo, `step ${steps + 1}: no code line is highlighted (check // @step markers)`)
        if (s.caption !== null && !s.caption) fail(combo, `step ${steps + 1}: caption is empty (check content.steps)`)
        if (steps === 2) {
          await page.evaluate(() => window.scrollTo(0, document.getElementById('visual').offsetTop - 90))
          await wait(300)
          await page.screenshot({ path: `${outDir}/${c.lang}-${c.theme}-${c.device}-visual.png` })
        }
      }
      if (steps === 0) fail(combo, 'the visualization has no steps')
    }

    const placeholders = await page.evaluate(() => (document.body.innerText.match(/\{\{\s*\w+\s*\}\}/g) ?? []).slice(0, 5))
    if (placeholders.length) fail(combo, `unfilled placeholders visible: ${placeholders.join(' ')}`)

    if (c.device === 'desktop' && c.theme === 'light') {
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: `${outDir}/${c.lang}-full.png`, fullPage: true })
    }
    await page.close()
    console.log(`  checked ${combo}`)
  }
} finally {
  await browser.close()
  await server.close()
}

const unique = [...new Set(failures)]
if (unique.length) {
  console.error(`\n✗ ${id}: ${unique.length} problem(s)\n` + unique.map((f) => `  - ${f}`).join('\n'))
  console.error(`\nScreenshots: ${outDir}`)
  process.exit(1)
}
console.log(`\n✓ ${id}: all checks passed (${combos.length} combinations). Screenshots: ${outDir}`)
