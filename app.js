// Page behaviour: download link, copy buttons, install tabs, pointer effects, scroll reveal, and the two looping
// demos (the app window and the Claude Code terminal). Everything degrades to static content without JS.

// GitHub serves the newest release asset under this stable path, so a new release needs no site change.
const DMG = 'https://github.com/devroopsaha744/breakpoint-page/releases/latest/download/Breakpoint-arm64.dmg'
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

document.querySelectorAll('a[data-download]').forEach((a) => (a.href = DMG))

// Copy buttons
document.querySelectorAll('[data-copy]').forEach((el) => {
  el.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(el.getAttribute('data-copy'))
    } catch {
      return
    }
    const label = el.querySelector('.copy-label') ?? el
    const before = label.textContent
    el.classList.add('copied')
    label.textContent = 'Copied'
    setTimeout(() => {
      el.classList.remove('copied')
      label.textContent = before
    }, 1500)
  })
})

// Install tabs
function selectTab(name) {
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)))
  document.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== name))
}
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.tab)))
document.querySelectorAll('[data-tab-link]').forEach((a) => a.addEventListener('click', () => selectTab(a.dataset.tabLink)))

// Pointer spotlight and card glow
const root = document.documentElement
window.addEventListener('pointermove', (e) => {
  root.style.setProperty('--mx', `${e.clientX}px`)
  root.style.setProperty('--my', `${e.clientY}px`)
})
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect()
    card.style.setProperty('--cx', `${e.clientX - r.left}px`)
    card.style.setProperty('--cy', `${e.clientY - r.top}px`)
  })
})

// Nav background once the page scrolls
const nav = document.querySelector('.nav')
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8)
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

// Scroll reveal
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
  { threshold: 0.12 }
)
document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

// Recording clock in the demo window
const clock = document.querySelector('[data-clock]')
const t0 = Date.now() - 161_000
setInterval(() => {
  const s = Math.floor((Date.now() - t0) / 1000)
  clock.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}, 1000)

/** Runs `loop` forever while `el` is on screen, pausing when it scrolls away. */
function whileVisible(el, loop) {
  let visible = false
  let running = false
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible && !running) {
      running = true
      ;(async () => {
        while (visible) await loop()
        running = false
      })()
    }
  }).observe(el)
}

// ── App window demo: catch a bug, file it, fix, replay ──────────────────
const demo = {
  page: document.querySelector('.fake-page'),
  cursor: document.querySelector('[data-demo="cursor"]'),
  total: document.querySelector('[data-demo="total"]'),
  toast: document.querySelector('[data-demo="toast"]'),
  chip: document.querySelector('[data-demo="chip"]'),
  log: document.querySelector('[data-demo="log"]')
}

function moveTo(selector) {
  const el = demo.page.querySelector(selector)
  const p = demo.page.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  demo.cursor.style.transform = `translate(${r.left - p.left + r.width / 2 - 8}px, ${r.top - p.top + r.height / 2 - 8}px)`
}

async function click() {
  demo.cursor.classList.remove('click')
  void demo.cursor.offsetWidth
  demo.cursor.classList.add('click')
  await sleep(350)
}

function logLine(tool, text, cls = '') {
  const li = document.createElement('li')
  li.innerHTML = `${tool ? `<code>${tool}</code>` : ''}<span class="${cls}">${text}</span>`
  demo.log.append(li)
  while (demo.log.children.length > 6) demo.log.firstElementChild.remove()
}

function toast(text, ok = false) {
  demo.toast.textContent = text
  demo.toast.classList.toggle('ok', ok)
  demo.toast.classList.add('show')
}

async function windowLoop() {
  demo.log.innerHTML = ''
  demo.total.textContent = '$88.00'
  demo.total.className = ''
  demo.toast.classList.remove('show')
  demo.chip.classList.remove('show', 'fixed')
  demo.chip.querySelector('.sev').textContent = 'HIGH'
  await sleep(700)

  moveTo('.fp-coupon span')
  await sleep(900)
  await click()
  logLine('form_input', '“SAVE100” into Coupon <span class="ok">✓</span>')
  await sleep(700)
  moveTo('.fp-coupon em')
  await sleep(900)
  await click()
  logLine('left_click', '“Apply” <span class="ok">✓</span>')
  demo.total.textContent = '$-12.00'
  demo.total.className = 'bad'
  await sleep(600)
  toast('signal · total < $0 after coupon')
  logLine('screenshot', 'Total shows $-12.00', 'note')
  await sleep(1200)
  logLine('report_bug', 'Coupon drives the total negative · high', 'err')
  demo.chip.classList.add('show')
  await sleep(1400)
  demo.toast.classList.remove('show')
  logLine('', '— fix lands in src/cart/coupon.ts —', 'note')
  await sleep(1300)
  demo.total.textContent = '$88.00'
  demo.total.className = ''
  logLine('replay_finding', 'F1 · replaying 2 recorded steps…', 'note')
  moveTo('.fp-coupon em')
  await sleep(900)
  await click()
  demo.total.textContent = '$0.00'
  demo.total.className = 'good'
  await sleep(500)
  toast('FIXED · proof did not fire', true)
  logLine('', 'FIXED: the bug no longer reproduces', 'ok')
  demo.chip.classList.add('fixed')
  demo.chip.querySelector('.sev').textContent = 'FIXED'
  await sleep(3200)
}

// ── Claude Code terminal demo ───────────────────────────────────────────
const term = document.querySelector('[data-term]')
const SCRIPT = [
  ['u', 'QA checkout on localhost:3000 and fix what you find'],
  ['t', '<b>●</b> breakpoint · start_session(app_url: "http://localhost:3000")'],
  ['r', '⎿ Session started · live view on 127.0.0.1:6080'],
  ['t', '<b>●</b> breakpoint · begin_journey("Checkout with a coupon")'],
  ['t', '<b>●</b> breakpoint · click(ref_14 "Apply coupon")'],
  ['e', '⎿ Signal: POST /api/cart/coupon returned 500: TypeError: cart.items is undefined'],
  ['t', '<b>●</b> breakpoint · report_bug(severity: "high", proof: ["http:500:POST:/api/cart/coupon"])'],
  ['r', '⎿ F1 filed · suspect src/cart/coupon.ts:42'],
  ['a', 'applyCoupon reads cart.items before the cart has loaded. Fixing it and adding a test.'],
  ['t', '<b>●</b> Update(src/cart/coupon.ts)'],
  ['r', '⎿ +4 −1'],
  ['t', '<b>●</b> breakpoint · replay_finding("F1")'],
  ['g', '⎿ FIXED: the proof signals did not fire.'],
  ['a', 'Fixed and verified by replay. Clip and report are in ~/.breakpoint/runs.']
]

async function typeInto(el, text) {
  for (let i = 1; i <= text.length; i++) {
    el.textContent = text.slice(0, i)
    await sleep(18 + Math.random() * 30)
  }
}

async function termLoop() {
  term.innerHTML = ''
  const caret = document.createElement('span')
  caret.className = 'caret'
  for (const [kind, text] of SCRIPT) {
    const line = document.createElement('div')
    line.className = kind
    term.append(line, caret)
    if (kind === 'u') await typeInto(line, text)
    else line.innerHTML = text
    await sleep(kind === 'u' ? 500 : kind === 't' ? 650 : 450)
  }
  await sleep(4000)
}

if (reduced) {
  term.innerHTML = SCRIPT.map(([k, t]) => `<div class="${k}">${t}</div>`).join('')
  ;['form_input|“SAVE100” into Coupon ✓', 'left_click|“Apply” ✓', 'report_bug|Coupon drives the total negative · high'].forEach((l) => logLine(...l.split('|')))
} else {
  whileVisible(document.querySelector('.window'), windowLoop)
  whileVisible(term, termLoop)
}
