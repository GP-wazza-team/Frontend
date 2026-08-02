/** Wazza · Miqyas — Tailwind is a delivery mechanism for the tokens in
 *  src/index.css, never a second source of truth. Every colour below is a
 *  var() reference, so a token edit lands everywhere at once.
 *
 *  Border radius is 0 across the whole scale on purpose (L2): a stray legacy
 *  `rounded-full` cannot reintroduce a curve. The chamfer is the only cut.
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
        // Two call sites in the entire app: the auth plate legend and the
        // Latin lockup beside the mark. Never on a working screen.
        stencil: ['Bespoke Stencil', 'Supreme', 'system-ui', 'sans-serif'],
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
      // `etch` / `edge` are the 1px container and control outlines — a
      // chamfered element cannot carry a real border, so it draws one inset.
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
        // The working scale. Nothing on a working screen exceeds 20px.
        tick: ['10px', { lineHeight: '1' }],
        legend: ['11px', { lineHeight: '1.2' }],
        dense: ['12px', { lineHeight: '1.35' }],
        ui: ['13px', { lineHeight: '1.4' }],
        body: ['15px', { lineHeight: 'var(--lh-body)' }],
        title: ['17px', { lineHeight: '1.25' }],
        rubric: ['20px', { lineHeight: '1.15' }],
      },
      transitionTimingFunction: { ease: 'var(--ease)' },
      transitionDuration: { state: '120ms', surface: '180ms', meter: '1200ms' },
      zIndex: { rail: '40', statusbar: '30', drawer: '80', overlay: '100' },
    },
  },
  plugins: [],
}
