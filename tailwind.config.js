/** Wazza · الصَّكّ — Tailwind is a delivery mechanism for the tokens in
 *  src/index.css, never a second source of truth. Every colour below is a
 *  var() reference, so a token edit lands everywhere at once.
 *
 *  Border radius is 0 across the whole scale on purpose: a stray legacy
 *  `rounded-full` cannot reintroduce a curve. L2 — the 45 degree chamfer is
 *  the only cut in the system, it means a committed record, and it lives on
 *  exactly three surfaces.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    // Every rounded-* utility resolves to 0. Do not add values here.
    borderRadius: {
      none: '0', sm: '0', DEFAULT: '0', md: '0', lg: '0',
      xl: '0', '2xl': '0', '3xl': '0', full: '0',
    },
    extend: {
      fontFamily: {
        sans: ['Supreme', 'IBM Plex Sans Arabic', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['Commit Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        // There is no `stencil` family. A military stencil face cannot carry a
        // company's identity, and the wordmark is now the house hand at the
        // record register. Do not add a second display family here: the
        // standing goal is ONE HAND across both scripts (see the type debt
        // recorded in index.css).
      },
      colors: {
        paper: 'var(--paper)',
        panel: { DEFAULT: 'var(--panel)', hover: 'var(--panel-hover)' },
        sunk: 'var(--sunk)',
        recess: 'var(--recess)',
        ink: { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
        signal: {
          DEFAULT: 'var(--signal)',
          deep: 'var(--signal-deep)',
          edge: 'var(--signal-edge)',
          hot: 'var(--signal-hot)',
          press: 'var(--signal-press)',
        },
        state: {
          done: 'var(--state-done)',
          fail: 'var(--state-fail)',
          run: 'var(--state-run)',
          queued: 'var(--state-queued)',
        },
        etch: { DEFAULT: 'var(--etch)', strong: 'var(--etch-strong)' },
        edge: 'var(--edge)',
        focusring: 'var(--focus)',
        label: 'var(--btn-label)',
        chart: {
          1: 'var(--chart-1)', 2: 'var(--chart-2)', 3: 'var(--chart-3)',
          4: 'var(--chart-4)', 5: 'var(--chart-5)',
        },
      },
      // The only box-shadow specs in the application. `overlay` is used on
      // exactly three components: MediaLightbox, RunDetailDrawer, ConfirmDialog.
      // `etch` / `edge` are the 1px container and control outlines. They stay
      // as inset shadows for the three surfaces that still clip (a clip-path
      // eats a real border), but every uncut surface should now use a real
      // `border` instead — reach for these only when the element is cut.
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
        etch: 'inset 0 0 0 1px var(--etch)',
        'etch-strong': 'inset 0 0 0 1px var(--etch-strong)',
        edge: 'inset 0 0 0 1px var(--edge)',
        signal: 'inset 0 0 0 1px var(--signal-edge)',
        none: 'none',
      },
      spacing: {
        spine: 'var(--rail-spine)',      // 56px — the leading gutter, everywhere
        panelw: 'var(--rail-panel)',     // 240px
        statusbar: 'var(--statusbar)',   // 36px
      },
      fontSize: {
        // The working scale. Seven steps, nothing on a working screen above
        // 20px, one document register above that.
        //
        // The base is 14px and the reason is mechanical, not comfort: Arabic
        // separates ب ت ث ن ي and ج ح خ by DOTS, not by skeleton, and at 13px
        // on a 1x display a dot PAIR merges into a smear — at exactly the size
        // where a table row is densest. 14px is the floor at which they
        // resolve. It is also half an alif on the nuqṭa/alif modulus (4/28px).
        tick: ['10px', { lineHeight: '1' }],
        legend: ['12px', { lineHeight: '1.25' }],
        dense: ['13px', { lineHeight: '1.4' }],
        ui: ['14px', { lineHeight: '1.45' }],
        body: ['16px', { lineHeight: 'var(--lh-body)' }],
        title: ['20px', { lineHeight: '1.25' }],
        rubric: ['22px', { lineHeight: '1.2' }],
        // THE RECORD REGISTER — one alif. Three call sites, all documents:
        // the work order, the run receipt, the auth wordmark. Never a route.
        record: ['28px', { lineHeight: '1.15' }],
      },
      transitionTimingFunction: { ease: 'var(--ease)' },
      transitionDuration: { state: '120ms', surface: '180ms', meter: '1200ms' },
      zIndex: { rail: '40', statusbar: '30', drawer: '80', overlay: '100' },
    },
  },
  plugins: [],
}
