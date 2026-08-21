/**
 * The Branditect icon set — 19 filled icons, `fill="currentColor"`.
 *
 * Stand-ins for the MingCute filled set used in Figma. They match the real
 * set's size, weight and colour behaviour, so swapping in the licensed
 * exports is a paths-only change and nothing else has to move.
 *
 * One mechanism, not two: every icon in the app comes from here.
 */

export type IconName =
  | "home" | "brand" | "know" | "studio" | "numbers" | "chat"
  | "search" | "bell" | "doc" | "img" | "bag" | "pres" | "link"
  | "target" | "upload" | "check" | "plus" | "arrow" | "send";

const PATHS: Record<IconName, { d: React.ReactNode; viewBox?: string }> = {
  home: {
    d: <path d="M11.02 2.6a1.5 1.5 0 0 1 1.96 0l8 6.93c.33.29.52.7.52 1.13V20a2 2 0 0 1-2 2h-4.25a.75.75 0 0 1-.75-.75V16a1.5 1.5 0 0 0-1.5-1.5h-2A1.5 1.5 0 0 0 9.5 16v5.25a.75.75 0 0 1-.75.75H4.5a2 2 0 0 1-2-2v-9.34c0-.43.19-.84.52-1.13z" />,
  },
  brand: {
    d: (
      <>
        <path d="M11.32 2.3a1.5 1.5 0 0 1 1.36 0l8.2 4.25c.83.43.83 1.62 0 2.05l-8.2 4.25a1.5 1.5 0 0 1-1.36 0L3.12 8.6c-.83-.43-.83-1.62 0-2.05z" />
        <path d="M2.9 12.03a1.2 1.2 0 0 1 1.6-.53l7.5 3.83 7.5-3.83a1.2 1.2 0 1 1 1.1 2.13l-8.05 4.11a1.2 1.2 0 0 1-1.1 0L3.4 13.63a1.2 1.2 0 0 1-.5-1.6z" opacity=".5" />
      </>
    ),
  },
  know: {
    d: (
      <>
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H11a.5.5 0 0 1 .5.5v19a.5.5 0 0 1-.72.45l-1.9-.95a2 2 0 0 0-1.79 0l-1.9.95A.5.5 0 0 1 4 21.5z" />
        <path d="M12.5 2.5A.5.5 0 0 1 13 2h4.5A2.5 2.5 0 0 1 20 4.5v15a2.5 2.5 0 0 1-2.5 2.5H13a.5.5 0 0 1-.5-.5z" opacity=".5" />
      </>
    ),
  },
  studio: {
    d: (
      <>
        <path d="M16.4 2.9a2.9 2.9 0 0 1 4.1 4.1l-1.3 1.3-4.1-4.1z" />
        <path d="M13.7 5.6l4.1 4.1-8.4 8.4a2 2 0 0 1-.9.5l-4.6 1.3a.8.8 0 0 1-1-1l1.3-4.6a2 2 0 0 1 .5-.9z" />
      </>
    ),
  },
  numbers: {
    d: (
      <>
        <rect x="3" y="12" width="4.4" height="9" rx="1.6" />
        <rect x="9.8" y="4" width="4.4" height="17" rx="1.6" />
        <rect x="16.6" y="9" width="4.4" height="12" rx="1.6" opacity=".5" />
      </>
    ),
  },
  chat: {
    d: <path d="M12 3c5.2 0 9.4 3.5 9.4 7.9s-4.2 7.9-9.4 7.9a11 11 0 0 1-2.3-.24l-4.3 2.3a.7.7 0 0 1-1.03-.72l.66-3.5C3.5 15.2 2.6 13.2 2.6 10.9 2.6 6.5 6.8 3 12 3" />,
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
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 3.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6" />
        <circle cx="12" cy="12" r="3.4" />
      </>
    ),
  },
  upload: {
    d: (
      <>
        <path d="M11.15 2.87a1.2 1.2 0 0 1 1.7 0l4.4 4.4a1.2 1.2 0 1 1-1.7 1.7l-2.35-2.35V15a1.2 1.2 0 0 1-2.4 0V6.62L8.45 8.97a1.2 1.2 0 0 1-1.7-1.7z" />
        <path d="M4 15.4a1.2 1.2 0 0 1 1.2 1.2v1.6a1 1 0 0 0 1 1h11.6a1 1 0 0 0 1-1v-1.6a1.2 1.2 0 1 1 2.4 0v1.6a3.4 3.4 0 0 1-3.4 3.4H6.2a3.4 3.4 0 0 1-3.4-3.4v-1.6A1.2 1.2 0 0 1 4 15.4" opacity=".5" />
      </>
    ),
  },
  check: {
    d: <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m4.9 6.6a1.2 1.2 0 0 0-1.7.06l-4.6 5-1.85-1.7a1.2 1.2 0 1 0-1.62 1.77l2.74 2.5a1.2 1.2 0 0 0 1.69-.07l5.4-5.87a1.2 1.2 0 0 0-.06-1.7" />,
  },
  plus: {
    d: <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m0 4.6a1.2 1.2 0 0 0-1.2 1.2v3h-3a1.2 1.2 0 1 0 0 2.4h3v3a1.2 1.2 0 1 0 2.4 0v-3h3a1.2 1.2 0 1 0 0-2.4h-3v-3A1.2 1.2 0 0 0 12 6.6" />,
  },
  arrow: {
    viewBox: "0 0 25 19",
    d: <path d="M15.1.9a1.3 1.3 0 0 0-1.8 1.85l4.5 4.5H1.6a1.3 1.3 0 1 0 0 2.6h16.2l-4.5 4.5a1.3 1.3 0 1 0 1.84 1.84l6.7-6.72a1.3 1.3 0 0 0 0-1.84z" />,
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
  const { d, viewBox = "0 0 24 24" } = PATHS[name];
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {d}
    </svg>
  );
}
