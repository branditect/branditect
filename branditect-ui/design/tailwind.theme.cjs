/**
 * Branditect Tailwind theme extension.
 * Merge into tailwind.config.{js,ts} under `theme.extend`.
 *
 * Same values as design/tokens.css — pick ONE as the source of
 * truth for the project and delete the other, or generate this
 * file from the CSS. Two hand-maintained copies will drift.
 */
module.exports = {
  fontFamily: {
    sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
  },

  fontSize: {
    micro:   ['10px', { lineHeight: '14px' }],
    '2xs':   ['11px', { lineHeight: '15px' }],
    xs:      ['12px', { lineHeight: '17px' }],
    sm:      ['13px', { lineHeight: '18px' }],
    base:    ['14px', { lineHeight: '20px' }],
    h3:      ['16px', { lineHeight: '19px', letterSpacing: '-0.2px' }],
    h2:      ['22px', { lineHeight: '26px', letterSpacing: '-0.5px' }],
    display: ['26px', { lineHeight: '30px', letterSpacing: '-0.7px' }],
    score:   ['46px', { lineHeight: '46px', letterSpacing: '-2px' }],
  },

  colors: {
    ink:   { DEFAULT: '#15151b', 2: '#3a3a45', 3: '#3f3f4a' },
    muted: { DEFAULT: '#6f6f8a', 2: '#8b8b97' },
    faint: { DEFAULT: '#aeaeb8', 2: '#9a9aa4' },

    page:  '#f4f3f2',
    card:  '#ffffff',
    tile:  { DEFAULT: '#f4f3f2', 2: '#f1f0ee' },
    rule:  { DEFAULT: '#edecea', 2: '#e6e6e6', 3: '#ddddf1' },

    accent: { DEFAULT: '#f0562a', dark: '#e8481f', line: '#f6b7a0' },

    // the warm tint ladder — icon tiles step through 1..5
    tint: { 1: '#fef0ea', 2: '#fdede6', 3: '#fdeee7', 4: '#fbe7e2', 5: '#fcedeb' },

    good:     '#2fbf71',
    navy:     '#1d2748',
    lavender: '#e8dff6',
    plannote: '#a98a80',
  },

  backgroundImage: {
    'grad-hero':    'linear-gradient(92.52deg, #f16d2c 11.42%, #fe4401 29.59%)',
    'grad-mark':    'linear-gradient(135deg, #f16d2c, #fe4401)',
    'grad-write':   'linear-gradient(116.565deg, rgb(103,139,191) 17.664%, rgb(67,99,148) 79.542%)',
    'grad-images':  'linear-gradient(128.944deg, rgb(237,230,252) 17.382%, rgb(216,201,249) 83.306%)',
    'grad-numbers': 'linear-gradient(127.831deg, rgb(232,239,253) 21.838%, rgb(208,219,247) 94.881%)',
    'grad-assets':  'linear-gradient(123.041deg, rgb(230,244,241) 28.392%, rgb(179,207,203) 83.262%)',
    'grad-more':    'linear-gradient(120deg, rgb(253,243,240) 18%, rgb(251,224,217) 92%)',
    'grad-chat':    'linear-gradient(180deg, #fdf6f7 0%, #f5f1fc 100%)',
  },

  borderRadius: {
    nav:   '10px',
    tile:  '10px',
    card:  '12px',
    panel: '16px',
    pill:  '50px',
  },

  // Applied via `filter`, not box-shadow, so shadows follow the
  // rounded corners of gradient-filled cards.
  dropShadow: {
    panel: ['0 6px 10px rgba(20,20,26,.07)', '0 1px 1px rgba(20,20,26,.04)'],
    hero:  '0 10px 18px rgba(180,50,10,.18)',
    btn:   '0 1px 1px rgba(20,20,26,.05)',
  },
  boxShadow: {
    chat: '0 6px 18px -12px rgba(20,20,26,.10), 0 1px 2px rgba(20,20,26,.04)',
  },

  spacing: {
    sidebar: '228px',
    chatrail: '296px',
  },
  maxWidth: {
    shell: '1480px',
  },
  screens: {
    // 'chat' — below this the AI Chat rail hides
    // 'stack' — below this the layout goes single-column
    chat:  { max: '1180px' },
    stack: { max: '900px' },
  },
};
