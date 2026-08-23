/**
 * The Branditect lockup — circular mark plus wordmark, from
 * public/branditect-logo.svg.
 *
 * One mechanism, like components/icon.tsx. Before this, five surfaces each
 * hand-rolled their own version out of a gradient square holding the letter
 * "B" next to the word "Branditect", so the product had no consistent mark
 * anywhere. Callers set a height; width follows the artwork's own ratio.
 *
 * Not to be confused with the user's brand logo in the sidebar's brand
 * switcher — that comes from Supabase and is a different thing entirely.
 */

const ASPECT = 519 / 123;

export default function Logo({
  height = 26,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static SVG needs
    // no optimisation, and next/image refuses SVG without dangerouslyAllowSVG.
    <img
      src="/branditect-logo.svg"
      alt="Branditect"
      width={Math.round(height * ASPECT)}
      height={height}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
