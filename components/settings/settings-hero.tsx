"use client";

/**
 * The hero. One gradient, at the top only.
 *
 * Orange into violet, as the reference draws it. The violet was raised rather
 * than added when this was built — it was not in the palette and CLAUDE.md is
 * explicit that a missing colour is a design decision. Inbox 7a made that
 * decision: `violet` is a token now, promoted from the raw hex it was already
 * shipping as in four files.
 *
 * TWO STOPS, NOT THREE. The reference smooths the run with `#8a5fb0`; 7a
 * drops it, because a gradient stop is not a colour anyone names and accent
 * to violet interpolates the midpoint on its own.
 */
import { useBrand } from "@/lib/useBrand";
import { useUser } from "@/lib/useUser";
import { useLocale } from "@/lib/i18n/use-t.tsx";
import { LOCALE_NAME } from "@/lib/i18n/index.ts";

export default function SettingsHero() {
  const { brand } = useBrand();
  const { user } = useUser();
  const locale = useLocale();

  return (
    <div className="relative overflow-hidden rounded-panel bg-grad-hero-settings px-7 py-[26px] drop-shadow-hero">
      {/* A light sweep, so the gradient has depth rather than reading as a flat fill. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 88% 8%, rgba(255,255,255,.26), transparent 55%)" }}
      />
      <div className="relative z-10 flex items-center gap-4">
        <div className="grid h-[58px] w-[58px] flex-none place-items-center rounded-full bg-white/95 text-[22px] font-extrabold text-accent-dark">
          {user?.initials ?? "·"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-display font-extrabold text-white">
            {user?.fullName || user?.email || " "}
          </h1>
          {user?.fullName && (
            <div className="mt-0.5 truncate text-[13px] font-semibold text-white/85">{user.email}</div>
          )}
          <div className="mt-2.5 flex flex-wrap gap-[7px]">
            {brand?.brand_name && (
              <span className="rounded-pill border border-white bg-white px-[11px] py-1 text-2xs font-extrabold text-[#b4360f]">
                {brand.brand_name}
              </span>
            )}
            <span className="rounded-pill border border-white/30 bg-white/20 px-[11px] py-1 text-2xs font-extrabold text-white">
              {LOCALE_NAME[locale]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
