/**
 * The Branditect logo, in two forms:
 *
 *   lockup — circular mark plus wordmark (public/branditect-logo.svg)
 *   mark   — the mark on its own (public/branditect-mark.svg)
 *
 * One mechanism, like components/icon.tsx. Before this, five surfaces each
 * hand-rolled their own version out of a gradient square holding the letter
 * "B" next to the word "Branditect", so the product had no consistent mark
 * anywhere. Callers set a height; width follows the artwork's own ratio, so a
 * caller setting one dimension cannot squash it.
 *
 * Use `mark` in square or round slots — the lockup is over four times wider
 * than it is tall and is unreadable below roughly 20px of height.
 */

const ASPECT = { lockup: 519 / 123, mark: 119 / 123 } as const;
const SRC = {
  lockup: "/branditect-logo.svg",
  mark: "/branditect-mark.svg",
} as const;

export default function Logo({
  height = 26,
  variant = "lockup",
  className = "",
}: {
  height?: number;
  variant?: "lockup" | "mark";
  className?: string;
}) {
  return (
    // A static SVG needs no optimisation, and next/image refuses SVG unless
    // dangerouslyAllowSVG is turned on globally — not worth it for one asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt="Branditect"
      width={Math.round(height * ASPECT[variant])}
      height={height}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
