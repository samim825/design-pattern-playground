/**
 * "Follow the action": while a visualization is playing, the page scrolls so the
 * active <Node> stays on screen (mainly for phones, where the stage is taller
 * than the viewport).
 *
 * - <StepControls> starts following on Play / Step and stops it when a run ends.
 * - Scrolling by hand (wheel, touch, keys) stops it until the next Play / Step,
 *   so the page never fights the learner.
 * - <Node> asks scrollNodeIntoView() whenever it becomes active.
 */

let following = false

export function startFollowing() {
  following = true
}

export function stopFollowing() {
  following = false
}

if (typeof window !== 'undefined') {
  const stop = () => {
    following = false
  }
  window.addEventListener('wheel', stop, { passive: true })
  window.addEventListener('touchmove', stop, { passive: true })
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) stop()
  })
}

/** Room kept clear at the top (sticky header) and bottom (sticky caption), in px. */
const TOP_CLEARANCE = 112
const BOTTOM_CLEARANCE = 176

/** Scroll an active node into view if a run is being followed and it isn't fully visible. */
export function scrollNodeIntoView(el: HTMLElement | null) {
  if (!following || !el) return
  const rect = el.getBoundingClientRect()
  const fits = rect.top >= TOP_CLEARANCE && rect.bottom <= window.innerHeight - BOTTOM_CLEARANCE
  if (fits) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // scroll-margin on the node (scroll-mt / scroll-mb) keeps it clear of the header and caption.
  el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
}
