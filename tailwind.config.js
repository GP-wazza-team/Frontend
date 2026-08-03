/** Wazza — Tailwind is a delivery mechanism for the tokens in src/index.css,
 *  never a second source of truth. Every colour below is a var() reference, so
 *  a token edit lands everywhere at once.
 *
 *  Corner radius is real now. The previous config mapped every rounded-*
 *  utility to 0 to enforce a chamfer system. Per the reference research,
 *  corner radius is the ONLY decoration this register permits itself, and it
 *  is one of the things that separates a professional tool from a cockpit.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    borderRadius: {
      none: '0',
      xs: 'var(--r-xs)',
      sm: 'var(--r-sm)',
      DEFAULT: 'var(--r-sm)',
      md: 'var(--r-sm)',
      lg: 'var(--r)',
      xl: 'var(--r)',
      '2xl': '14px',
      '3xl': '18px',
      full: '9999px',
    },
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Supreme', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['Commit Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        page:   'var(--page)',
        card:   { DEFAULT: 'var(--card)', 2: 'var(--card-2)', 3: 'var(--card-3)' },
        line:   { DEFAULT: 'var(--line)', 2: 'var(--line-2)' },
        ink:    { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
        accent: { DEFAULT: 'var(--accent)', hi: 'var(--accent-hi)', soft: 'var(--accent-soft)' },
        ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', idle: 'var(--idle)',
        well:   { DEFAULT: 'var(--well)', 2: 'var(--well-2)' },
        onwell: { DEFAULT: 'var(--on-well)', 2: 'var(--on-well-2)' },
        chart: {
          1: 'var(--chart-1)', 2: 'var(--chart-2)', 3: 'var(--chart-3)',
          4: 'var(--chart-4)', 5: 'var(--chart-5)',
        },
        /* legacy aliases — deleted as each consuming file is rebuilt */
        paper: 'var(--page)',
        panel: { DEFAULT: 'var(--card)', hover: 'var(--card-2)' },
        sunk: 'var(--card-2)',
        recess: 'var(--card-3)',
        signal: {
          DEFAULT: 'var(--accent)', deep: 'var(--accent)', edge: 'var(--accent)',
          hot: 'var(--accent-hi)', press: 'var(--accent-hi)',
        },
        state: { done: 'var(--ok)', fail: 'var(--bad)', run: 'var(--warn)', queued: 'var(--idle)' },
        etch: { DEFAULT: 'var(--line)', strong: 'var(--line-2)' },
        edge: 'var(--line-2)',
        focusring: 'var(--focus)',
        label: '#FFFFFF',
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
        raise: '0 1px 2px rgba(25,21,18,0.06)',
        etch: 'inset 0 0 0 1px var(--line)',
        'etch-strong': 'inset 0 0 0 1px var(--line-2)',
        edge: 'inset 0 0 0 1px var(--line-2)',
        signal: 'inset 0 0 0 1px var(--accent)',
        none: 'none',
      },
      spacing: {
        topbar: 'var(--topbar)',
        rail: 'var(--rail)',
        /* legacy */
        spine: 'var(--rail)',
        panelw: '0px',
        statusbar: '0px',
      },
      fontSize: {
        tick:   ['11px', { lineHeight: '1.2' }],
        legend: ['11px', { lineHeight: '1.25' }],
        dense:  ['12px', { lineHeight: '1.4' }],
        ui:     ['14px', { lineHeight: '1.5' }],
        body:   ['15px', { lineHeight: 'var(--lh)' }],
        title:  ['16px', { lineHeight: '1.3' }],
        rubric: ['20px', { lineHeight: '1.25' }],
        page:   ['26px', { lineHeight: '1.25' }],
      },
      transitionTimingFunction: { ease: 'var(--ease)' },
      transitionDuration: { state: '120ms', surface: '180ms', meter: '600ms' },
      zIndex: { rail: '80', statusbar: '30', topbar: '30', drawer: '95', overlay: '100' },
    },
  },
  plugins: [],
}
