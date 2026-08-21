import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/icon";
import createImagesArt from "@/public/studio/create-images.png";

export type StudioVariant = "write" | "images" | "numbers" | "assets" | "more";

const VARIANTS: Record<StudioVariant, { bg: string; title: string; body: string }> = {
  write: { bg: "bg-grad-write", title: "text-white", body: "text-white/[.84]" },
  images: { bg: "bg-grad-images", title: "text-[#2b2340]", body: "text-[#5b5175]" },
  numbers: { bg: "bg-grad-numbers", title: "text-[#22304d]", body: "text-[#4d5c7a]" },
  assets: { bg: "bg-grad-assets", title: "text-[#1d3b36]", body: "text-[#41615c]" },
  more: { bg: "bg-grad-more", title: "text-[#7a3a26]", body: "text-[#a4685a]" },
};

/**
 * Card artwork. Decorative and aria-hidden throughout.
 *
 * `images` uses the real export; the other four are still CSS shapes standing
 * in for Figma PNGs, so swapping those in changes nothing else about the card.
 *
 * NOTE: create-images.png is a 1x asset at 69×44. It is drawn at native size
 * so it stays sharp, which makes it slightly smaller than the CSS shape it
 * replaced. A 2x export would let it fill the intended 84×48 slot and survive
 * retina displays.
 */
function Art({ variant }: { variant: StudioVariant }) {
  switch (variant) {
    case "write":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-[90px] w-[140px]">
          <span className="absolute bottom-6 left-0.5 h-7 w-24 rounded-b-[62%] border-b-[1.6px] border-white/[.32]" />
          <span className="absolute bottom-1.5 left-2 h-7 w-[84px] rounded-b-[62%] border-b-[1.6px] border-white/20" />
          <span className="absolute bottom-6 left-[72px] h-[46px] w-2.5 rotate-[38deg] rounded-sm bg-white shadow-[0_8px_14px_-8px_rgba(0,0,0,.55)] after:absolute after:-bottom-[9px] after:left-0 after:border-x-[5px] after:border-t-[10px] after:border-x-transparent after:border-t-white after:content-['']" />
        </span>
      );
    case "images":
      // The real export, not a CSS stand-in. Native size is 69×44, so it is
      // drawn at 1:1 rather than upscaled — see the note in Art below.
      return (
        <Image
          src={createImagesArt}
          alt=""
          aria-hidden="true"
          // No drop-shadow here: the export already carries its own.
          className="pointer-events-none absolute bottom-3 left-3.5 h-auto w-[69px]"
          unoptimized
        />
      );
    case "numbers":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-2.5 left-3.5 h-[46px] w-[92px]">
          <span className="absolute bottom-0 left-0 h-[38px] w-[27px] rounded-[5px] bg-[linear-gradient(160deg,#f6875c,#ef5a2f)] shadow-[0_5px_10px_-6px_rgba(20,30,60,.45)]" />
          <span className="absolute bottom-0 left-8 h-8 w-[26px] rounded-[5px] bg-[linear-gradient(160deg,#7fa4d8,#4a6ea8)] shadow-[0_5px_10px_-6px_rgba(20,30,60,.45)]" />
          <span className="absolute bottom-0 left-[62px] h-[42px] w-[26px] rounded-[5px] bg-[linear-gradient(160deg,#9b83d8,#6b53ac)] shadow-[0_5px_10px_-6px_rgba(20,30,60,.45)]" />
        </span>
      );
    case "assets":
      return (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-[15px] flex h-[42px] w-[100px] items-end gap-[5px]">
          <span className="block h-[25px] w-[19px] rounded-[5px] bg-navy shadow-[0_5px_10px_-6px_rgba(20,50,45,.45)]" />
          <span className="block h-[34px] w-[19px] rounded-[5px] bg-accent shadow-[0_5px_10px_-6px_rgba(20,50,45,.45)]" />
          <span className="block h-[29px] w-[19px] rounded-[5px] bg-[#5b8fd0] shadow-[0_5px_10px_-6px_rgba(20,50,45,.45)]" />
          <span className="block h-[38px] w-[19px] rounded-[5px] bg-[#7b5ea7] shadow-[0_5px_10px_-6px_rgba(20,50,45,.45)]" />
        </span>
      );
    case "more":
      return (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 left-[13px] h-[30px] w-[88px] rounded-b-[60%] border-b-2 border-accent/[.35]"
        />
      );
  }
}

interface StudioCardProps {
  title: string;
  description: string;
  href: string;
  variant: StudioVariant;
}

export default function StudioCard({ title, description, href, variant }: StudioCardProps) {
  const v = VARIANTS[variant];
  return (
    <Link
      href={href}
      className={`group relative block h-[148px] overflow-hidden rounded-card p-[15px] ${v.bg} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <h3 className={`text-h3 font-bold leading-[1.2] tracking-[-.3px] ${v.title}`}>{title}</h3>
      <p className={`mt-1.5 text-xs font-medium leading-[1.42] ${v.body}`}>{description}</p>
      <Art variant={variant} />
      <span
        className={`absolute bottom-3 right-3 grid h-5 w-[26px] place-items-center transition-transform group-hover:translate-x-[3px] motion-reduce:transition-none ${v.title}`}
      >
        <Icon name="arrow" size={19} />
      </span>
    </Link>
  );
}
