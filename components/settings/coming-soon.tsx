"use client";

/**
 * Below the line. Five rows, named rather than greyed.
 *
 * "A greyed row that says only 'Soon' is indistinguishable from a broken one."
 * So each says what it will do, in one line, and none of them is interactive:
 * no handler, no href, no tabIndex, no hover, no cursor. A test fails if one
 * ever gains an `onClick` or an `href`.
 *
 * They are ordered by when they arrive, not by importance — "a list where the
 * top item ships next is a list people stop checking".
 *
 * The tinted left edge is what says deliberate where flat grey says broken.
 * Violet, as the reference draws it, now that 7a has made it a token — it
 * ran on `lav-line` into `lavender` while it had no name. Credit use carries
 * a dimmed bar so the shape of the thing is visible before it works —
 * decoration, with no number behind it and `aria-hidden` so it is not read
 * as data.
 */
import { useT } from "@/lib/i18n/use-t.tsx";
import type { StringKey } from "@/lib/i18n/en";
import { COMING_SOON } from "@/lib/settings";

export default function ComingSoon() {
  const t = useT();
  return (
    <div className="mt-7">
      <div className="flex items-center gap-[9px] px-1 pb-[11px]">
        <h2 className="text-micro font-extrabold uppercase tracking-[1px] text-violet">
          {t("settings.comingUp")}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-2 to-transparent" />
      </div>
      <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2">
        {COMING_SOON.map((row) => (
          <div
            key={row.key}
            className="relative select-none overflow-hidden rounded-card border border-rule bg-card py-[13px] pl-[17px] pr-[15px]"
          >
            <div aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b from-violet-2 to-lavender" />
            <div className="text-[13px] font-extrabold text-ink-2 opacity-[.72]">{t(row.titleKey as StringKey)}</div>
            <div className="mt-[3px] text-xs leading-snug text-muted opacity-[.82]">{t(row.descKey as StringKey)}</div>
            {row.meter && (
              <div aria-hidden="true" className="mt-[9px] h-[5px] overflow-hidden rounded-[3px] bg-lavender">
                <i className="block h-full w-[38%] rounded-[3px] bg-violet opacity-[.55]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
