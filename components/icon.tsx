/**
 * The Branditect icon set — 30 icons, all drawn in `currentColor`.
 *
 * Nine are the real Branditect icons, exported from the brand icon set and
 * converted so their baked-in #F0562A became `currentColor` — without that
 * they could not go white on the orange hero.
 *
 * The remaining ten are still filled stand-ins awaiting real exports:
 * search, bell, doc, img, bag, pres, link, check, arrow, send, filter,
 * close, trash, pen, chevronRight, chevronLeft.
 *
 * The two styles differ: the real icons are stroked (`outline: true`), the
 * stand-ins are filled. Mixing them is visible — the five Brand Knowledge
 * tiles on the Home hero are stand-ins sitting beside a stroked sidebar.
 *
 * One mechanism, not two: every icon in the app comes from here.
 */

export type IconName =
  | "home" | "brand" | "know" | "studio" | "numbers" | "chat"
  | "search" | "bell" | "doc" | "img" | "bag" | "pres" | "link"
  | "target" | "upload" | "check" | "plus" | "arrow" | "send"
  // Products
  | "filter" | "close" | "trash" | "pen" | "chevronRight" | "chevronLeft"
  // Numbers — business profile toggles
  | "box" | "cloud" | "once" | "repeat" | "tick";

interface IconSpec {
  d: React.ReactNode;
  viewBox?: string;
  /**
   * True for the real Branditect icons, which are drawn as strokes. The
   * legacy stand-ins are filled shapes. The root `fill` differs between the
   * two, so each icon declares which it is.
   */
  outline?: boolean;
}

const PATHS: Record<IconName, IconSpec> = {
  home: {
    d: (
      <>
        <path d="M5.625 14.3546C5.625 12.8271 5.625 12.0633 5.93377 11.392C6.24254 10.7207 6.82241 10.2236 7.98216 9.22957L9.10716 8.26528C11.2034 6.46851 12.2515 5.57013 13.5 5.57013C14.7485 5.57013 15.7966 6.46851 17.8928 8.26528L19.0178 9.22957C20.1776 10.2236 20.7575 10.7207 21.0662 11.392C21.375 12.0633 21.375 12.8271 21.375 14.3546V19.125C21.375 21.2463 21.375 22.307 20.716 22.966C20.057 23.625 18.9963 23.625 16.875 23.625H10.125C8.00368 23.625 6.94302 23.625 6.28401 22.966C5.625 22.307 5.625 21.2463 5.625 19.125V14.3546Z" stroke="currentColor" strokeWidth="2" />
        <path d="M16.3125 23.625V17.875C16.3125 17.3227 15.8648 16.875 15.3125 16.875H11.6875C11.1352 16.875 10.6875 17.3227 10.6875 17.875V23.625" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    viewBox: "0 0 27 27",
    outline: true,
  },
  brand: {
    d: (
      <>
        <path d="M21 7V12L14 16L3 12V7L10 3L21 7ZM3 7L14 11L21 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M3 12V17L14 21L21 17V12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </>
    ),
    viewBox: "0 0 24 24",
    outline: true,
  },
  know: {
    d: (
      <>
        <path d="M4 9.65685C4 8.83935 4 8.4306 4.15224 8.06306C4.30448 7.69552 4.59351 7.40649 5.17157 6.82843L5.82843 6.17157C6.40649 5.59351 6.69552 5.30448 7.06306 5.15224C7.4306 5 7.83935 5 8.65685 5H15.3431C16.1606 5 16.5694 5 16.9369 5.15224C17.3045 5.30448 17.5935 5.59351 18.1716 6.17157L18.8284 6.82843C19.4065 7.40649 19.6955 7.69552 19.8478 8.06306C20 8.4306 20 8.83935 20 9.65685V16C20 17.8856 20 18.8284 19.4142 19.4142C18.8284 20 17.8856 20 16 20H8C6.11438 20 5.17157 20 4.58579 19.4142C4 18.8284 4 17.8856 4 16V9.65685Z" stroke="currentColor" strokeWidth="2" />
        <path d="M4 10H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14.8332 9L9.1665 9C8.9308 9 8.81295 9 8.73973 9.07322C8.6665 9.14645 8.6665 9.2643 8.6665 9.5L8.6665 13.6667C8.6665 14.4315 8.6665 14.8139 8.76541 15.0194C8.98621 15.4782 9.51649 15.6979 9.99705 15.5296C10.2123 15.4542 10.4827 15.1838 11.0235 14.643C11.274 14.3925 11.3992 14.2673 11.5324 14.1969C11.8248 14.0422 12.1748 14.0422 12.4673 14.1969C12.6004 14.2673 12.7257 14.3925 12.9761 14.643C13.517 15.1838 13.7874 15.4542 14.0026 15.5296C14.4832 15.6979 15.0135 15.4782 15.2343 15.0194C15.3332 14.8139 15.3332 14.4315 15.3332 13.6667V9.5C15.3332 9.2643 15.3332 9.14645 15.2599 9.07322C15.1867 9 15.0689 9 14.8332 9Z" fill="currentColor" />
      </>
    ),
    viewBox: "0 0 24 24",
    outline: true,
  },
  studio: {
    d: (
      <>
        <path d="M14.5622 5.17383C14.9867 5.21921 15.3254 5.41391 15.5944 5.61914C15.8786 5.83606 16.1835 6.14377 16.4967 6.45703L16.5426 6.50391C16.856 6.81725 17.1636 7.12193 17.3805 7.40625C17.615 7.71364 17.8356 8.11136 17.8356 8.625C17.8356 9.13864 17.615 9.53636 17.3805 9.84375C17.1636 10.1281 16.856 10.4328 16.5426 10.7461L9.72427 17.5654C9.56716 17.7225 9.36299 17.9386 9.09927 18.0879C8.83559 18.2372 8.54527 18.3006 8.32974 18.3545L5.88834 18.9648L5.88638 18.9658L5.84244 18.9766C5.69457 19.0135 5.47316 19.0718 5.27896 19.0908C5.07233 19.111 4.62033 19.1175 4.25162 18.749C3.88311 18.3805 3.88964 17.9286 3.90982 17.7217C3.92883 17.5273 3.9871 17.3051 4.02408 17.1572L4.64517 14.6699C4.69906 14.4544 4.76344 14.1641 4.91275 13.9004L5.03482 13.7139C5.16571 13.5381 5.31645 13.3941 5.43423 13.2764L12.2536 6.45703C12.5669 6.14369 12.8716 5.83607 13.1559 5.61914C13.4632 5.38466 13.8612 5.16416 14.3747 5.16406L14.5622 5.17383Z" stroke="currentColor" strokeWidth="2" />
        <path d="M11.9792 7.18748L14.8542 5.27081L17.7292 8.14581L15.8125 11.0208L11.9792 7.18748Z" fill="currentColor" />
      </>
    ),
    viewBox: "0 0 23 23",
    outline: true,
  },
  numbers: {
    d: (
      <>
        <path d="M7.33334 9.16669L7.33334 14.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 11V14.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.6667 7.33331V14.6666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2.75" y="3.66669" width="16.5" height="14.6667" rx="2" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    viewBox: "0 0 22 22",
    outline: true,
  },
  chat: {
    d: (
      <>
        <path d="M4 12C4 7.58172 7.58172 4 12 4V4C16.4183 4 20 7.58172 20 12V17.0909C20 17.9375 20 18.3608 19.8739 18.6989C19.6712 19.2425 19.2425 19.6712 18.6989 19.8739C18.3608 20 17.9375 20 17.0909 20H12C7.58172 20 4 16.4183 4 12V12Z" stroke="currentColor" strokeWidth="2" />
        <path d="M9 11L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    viewBox: "0 0 24 24",
    outline: true,
  },
  search: {
    d: <path d="M11 3a8 8 0 1 0 4.9 14.32l3.39 3.39a1.15 1.15 0 0 0 1.63-1.63l-3.39-3.39A8 8 0 0 0 11 3m0 2.4a5.6 5.6 0 1 1 0 11.2 5.6 5.6 0 0 1 0-11.2" />,
  },
  bell: {
    d: (
      <>
        <path d="M12 2a6.6 6.6 0 0 1 6.6 6.6v3.05l1.5 2.63A1.3 1.3 0 0 1 18.97 16H5.03a1.3 1.3 0 0 1-1.13-1.72l1.5-2.63V8.6A6.6 6.6 0 0 1 12 2" />
        <path d="M9.4 17.6h5.2a2.6 2.6 0 0 1-5.2 0" opacity=".5" />
      </>
    ),
  },
  doc: {
    d: (
      <>
        <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h5.26a.5.5 0 0 1 .35.15l6.24 6.24a.5.5 0 0 1 .15.35V19.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19.5z" />
        <path d="M13.6 2.4 19.6 8.4h-5a1 1 0 0 1-1-1z" opacity=".45" />
      </>
    ),
  },
  img: {
    d: <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5zm5.6 1.4a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8m9.9 9.8-4.3-5.1a.9.9 0 0 0-1.36-.02l-2.5 2.85-1.1-1.05a.9.9 0 0 0-1.3.06L5.4 17.7z" />,
  },
  bag: {
    d: <path d="M8.4 6V5.4a3.6 3.6 0 0 1 7.2 0V6h2.3a2 2 0 0 1 2 1.86l.7 11A2 2 0 0 1 18.6 21H5.4a2 2 0 0 1-2-2.14l.7-11A2 2 0 0 1 6.1 6zm1.9 0h3.4v-.6a1.7 1.7 0 1 0-3.4 0z" />,
  },
  pres: {
    d: <path d="M3 4.6A1.6 1.6 0 0 1 4.6 3h14.8A1.6 1.6 0 0 1 21 4.6v10.2a1.6 1.6 0 0 1-1.6 1.6h-5.5l2.4 3.1a1.1 1.1 0 0 1-1.74 1.35L12 17.9l-2.56 2.95A1.1 1.1 0 0 1 7.7 19.5l2.4-3.1H4.6A1.6 1.6 0 0 1 3 14.8z" />,
  },
  link: {
    d: (
      <>
        <path d="M9.9 6.5a4.6 4.6 0 0 1 6.5 6.5l-2.1 2.1a1.2 1.2 0 0 1-1.7-1.7l2.1-2.1a2.2 2.2 0 1 0-3.1-3.1L9.5 10.3a1.2 1.2 0 1 1-1.7-1.7z" />
        <path d="M14.1 17.5a4.6 4.6 0 0 1-6.5-6.5l2.1-2.1a1.2 1.2 0 1 1 1.7 1.7l-2.1 2.1a2.2 2.2 0 1 0 3.1 3.1l2.1-2.1a1.2 1.2 0 1 1 1.7 1.7z" />
      </>
    ),
  },
  target: {
    d: (
      <>
        <circle cx="8.5" cy="8.5" r="4.375" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="currentColor" strokeWidth="1.25" />
        <path d="M8.5 4.125V2.875" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M12.875 8.5L14.125 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M8.5 14.125L8.5 12.875" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M2.875 8.5H4.125" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </>
    ),
    viewBox: "0 0 17 17",
    outline: true,
  },
  upload: {
    d: (
      <>
        <path d="M6.375 9.20831L10.625 9.20831" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M6.375 6.375L9.20833 6.375" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M6.375 12.0417L9.20833 12.0417" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M13.4583 9.20833V9.91667C13.4583 11.7464 13.4583 12.6613 13.0726 13.3466C12.8034 13.8248 12.4082 14.2201 11.9299 14.4893C11.2447 14.875 10.3298 14.875 8.49999 14.875C6.67021 14.875 5.75532 14.875 5.07009 14.4893C4.59183 14.2201 4.19658 13.8248 3.92737 13.3466C3.54166 12.6613 3.54166 11.7464 3.54166 9.91667V6.375C3.54166 5.21147 3.54166 4.6297 3.70087 4.16068C4.00066 3.27751 4.69417 2.58401 5.57734 2.28421C6.04635 2.125 6.62812 2.125 7.79166 2.125" stroke="currentColor" strokeWidth="1.25" />
        <path d="M12.75 2.125L12.75 6.375" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M14.875 4.25L10.625 4.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </>
    ),
    viewBox: "0 0 17 17",
    outline: true,
  },
  check: {
    d: <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m4.9 6.6a1.2 1.2 0 0 0-1.7.06l-4.6 5-1.85-1.7a1.2 1.2 0 1 0-1.62 1.77l2.74 2.5a1.2 1.2 0 0 0 1.69-.07l5.4-5.87a1.2 1.2 0 0 0-.06-1.7" />,
  },
  plus: {
    d: (
      <>
        <path d="M8.5 2.125C12.0208 2.125 14.875 4.97918 14.875 8.5C14.875 12.0208 12.0208 14.875 8.5 14.875C4.97918 14.875 2.125 12.0208 2.125 8.5C2.125 4.97918 4.97918 2.125 8.5 2.125ZM8.5 3.95898C7.94772 3.95898 7.5 4.4067 7.5 4.95898V7.5H4.95801C4.40587 7.50018 3.95801 7.94782 3.95801 8.5C3.95801 9.05218 4.40587 9.49982 4.95801 9.5H7.5V12.042C7.50018 12.5941 7.94782 13.042 8.5 13.042C9.05218 13.042 9.49982 12.5941 9.5 12.042V9.5H12.041C12.5933 9.5 13.041 9.05228 13.041 8.5C13.041 7.94772 12.5933 7.5 12.041 7.5H9.5V4.95898C9.5 4.4067 9.05228 3.95898 8.5 3.95898Z" fill="currentColor" />
      </>
    ),
    viewBox: "0 0 17 17",
    outline: true,
  },
  arrow: {
    viewBox: "0 0 25 19",
    d: <path d="M15.1.9a1.3 1.3 0 0 0-1.8 1.85l4.5 4.5H1.6a1.3 1.3 0 1 0 0 2.6h16.2l-4.5 4.5a1.3 1.3 0 1 0 1.84 1.84l6.7-6.72a1.3 1.3 0 0 0 0-1.84z" />,
  },
  filter: {
    d: <path d="M3.5 5.4A1.4 1.4 0 0 1 4.9 4h14.2a1.4 1.4 0 0 1 1.07 2.3l-5.27 6.3V19a1 1 0 0 1-1.45.9l-2.8-1.4a1 1 0 0 1-.55-.9v-4l-5.27-6.3a1.4 1.4 0 0 1-.33-.9" />,
  },
  close: {
    d: <path d="M5.7 4.3a1 1 0 0 0-1.4 1.4l6.3 6.3-6.3 6.3a1 1 0 1 0 1.4 1.4l6.3-6.3 6.3 6.3a1 1 0 0 0 1.4-1.4L13.4 12l6.3-6.3a1 1 0 0 0-1.4-1.4L12 10.6z" />,
  },
  trash: {
    d: <path d="M9.4 2.6h5.2a1.4 1.4 0 0 1 1.4 1.4v.9h4a1.1 1.1 0 1 1 0 2.2h-.55l-.83 12.1A2.6 2.6 0 0 1 16.03 21.6H7.97a2.6 2.6 0 0 1-2.59-2.4L4.55 7.1H4a1.1 1.1 0 0 1 0-2.2h4v-.9a1.4 1.4 0 0 1 1.4-1.4" />,
  },
  pen: {
    d: <path d="M16.4 2.9a2.9 2.9 0 0 1 4.1 4.1l-1.3 1.3-4.1-4.1zM13.7 5.6l4.1 4.1-8.4 8.4a2 2 0 0 1-.9.5l-4.6 1.3a.8.8 0 0 1-1-1l1.3-4.6a2 2 0 0 1 .5-.9z" />,
  },
  chevronRight: {
    d: <path d="M9.1 4.4a1.3 1.3 0 0 0 0 1.84L14.86 12 9.1 17.76a1.3 1.3 0 1 0 1.84 1.84l6.68-6.68a1.3 1.3 0 0 0 0-1.84L10.94 4.4a1.3 1.3 0 0 0-1.84 0" />,
  },
  chevronLeft: {
    d: <path d="M14.9 4.4a1.3 1.3 0 0 1 0 1.84L9.14 12l5.76 5.76a1.3 1.3 0 1 1-1.84 1.84l-6.68-6.68a1.3 1.3 0 0 1 0-1.84L13.06 4.4a1.3 1.3 0 0 1 1.84 0" />,
  },
  box: {
    d: <path d="M11.32 2.3a1.5 1.5 0 0 1 1.36 0l7.7 4a1.2 1.2 0 0 1 .62 1.06v9.28a1.2 1.2 0 0 1-.62 1.06l-7.7 4a1.5 1.5 0 0 1-1.36 0l-7.7-4A1.2 1.2 0 0 1 3 16.64V7.36A1.2 1.2 0 0 1 3.62 6.3zM12 4.6 5.9 7.8 12 11l6.1-3.2z" />,
  },
  cloud: {
    d: <path d="M12 3.6a6.4 6.4 0 0 1 6.28 5.15A4.9 4.9 0 0 1 17.5 18.4h-11a4.5 4.5 0 0 1-.9-8.9A6.4 6.4 0 0 1 12 3.6" />,
  },
  once: {
    d: <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m.9 4.4h-1.4a.8.8 0 0 0-.72.45l-1 2a.8.8 0 0 0 .72 1.15H10v9.6h2.9V7.2a.8.8 0 0 0-.8-.8z" />,
  },
  repeat: {
    d: <path d="M12 3a9 9 0 0 1 8.1 5.06 1.3 1.3 0 1 1-2.34 1.13A6.4 6.4 0 0 0 12 5.6a6.4 6.4 0 0 0-5.75 3.6h2.1a1.2 1.2 0 1 1 0 2.4H3.9a1.2 1.2 0 0 1-1.2-1.2V6.05a1.2 1.2 0 1 1 2.4 0v1.06A9 9 0 0 1 12 3m-8.1 11.94a1.3 1.3 0 0 1 1.74.57A6.4 6.4 0 0 0 12 18.4a6.4 6.4 0 0 0 5.75-3.6h-2.1a1.2 1.2 0 0 1 0-2.4h4.45a1.2 1.2 0 0 1 1.2 1.2v4.35a1.2 1.2 0 1 1-2.4 0v-1.06A9 9 0 0 1 3.9 15.5a1.3 1.3 0 0 1 0-.56" />,
  },
  tick: {
    d: <path d="M20.3 5.7a1.3 1.3 0 0 0-1.85.06l-8.6 9.2-3.3-3.1a1.3 1.3 0 1 0-1.78 1.9l4.24 4a1.3 1.3 0 0 0 1.84-.06l9.5-10.16a1.3 1.3 0 0 0-.05-1.84" />,
  },
  send: {
    d: <path d="M13.1 3.9a1.4 1.4 0 0 0-2 2l4.7 4.7H4.3a1.4 1.4 0 1 0 0 2.8h11.5l-4.7 4.7a1.4 1.4 0 0 0 2 2l7.1-7.1a1.4 1.4 0 0 0 0-2z" />,
  },
};

interface IconProps {
  name: IconName;
  /** Pixel size. Square unless the icon has its own aspect (arrow). */
  size?: number;
  className?: string;
  /** Accessible name. Omit for decorative icons — they get aria-hidden. */
  label?: string;
}

export default function Icon({ name, size = 20, className, label }: IconProps) {
  const { d, viewBox = "0 0 24 24", outline } = PATHS[name];
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      fill={outline ? "none" : "currentColor"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {d}
    </svg>
  );
}
