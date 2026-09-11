"use client";

/**
 * Section 2 of spec/settings.md. Brand name, website, industry.
 *
 * "These three are asked in onboarding and then never editable again, which
 * is the actual complaint hiding behind 'minimum settings': someone types
 * their brand name in the first minute, gets it slightly wrong, and has no
 * way back to it."
 *
 * The brand name is also what the delete confirmation is typed against, so
 * renaming here changes what has to be typed there. That is correct — the
 * confirmation asks for the brand's name, not for a password.
 *
 * The industry select keeps an unrecognised stored value as its own option.
 * Nine industries are offered and `brands.industry` holds whatever onboarding
 * wrote; silently dropping a value nobody offers any more would rewrite it on
 * the next save of an unrelated field.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";
import { useT } from "@/lib/i18n/use-t.tsx";
import { INDUSTRIES, isKnownIndustry } from "@/lib/industries";
import { normaliseBrandName, normaliseWebsite } from "@/lib/settings";
import SaveRow, { Row } from "./save-state";

const FIELD =
  "w-full rounded-[9px] border border-rule-2 bg-white px-[11px] py-[9px] text-[13px] font-medium text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-tint-1";

export default function BrandPanel() {
  const t = useT();
  const { brand, loading } = useBrand();
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [industry, setIndustry] = useState("");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded || !brand) return;
    setName(brand.brand_name ?? "");
    setSite(brand.website ?? "");
    setIndustry(brand.industry ?? "");
    setSeeded(true);
  }, [brand, seeded]);

  async function save(): Promise<string | null> {
    if (!brand?.id) return t("settings.saveFailed");

    const website = normaliseWebsite(site);
    if (!website.ok) return t("settings.websiteInvalid");

    // `.select()` is not decoration. An UPDATE that RLS filters out returns
    // { error: null } and changes nothing — supabase-js cannot tell "you are
    // not allowed" from "done". Without the returned row this panel said
    // "Saved" over a write that never happened, which is precisely the third
    // silent failure criterion 4 is about. Found by forcing one.
    const { data, error } = await supabase.from("brands").update({
      brand_name: normaliseBrandName(name) ?? brand.brand_name,
      website: website.value,
      industry: industry === "" ? null : industry,
    }).eq("id", brand.id).select("id");

    if (error) return error.message;
    if (!data || data.length === 0) return t("settings.saveFailed");
    return null;
  }

  // An industry the list no longer offers still has to be selectable, or the
  // select shows the first option and a save quietly changes it.
  const extra = industry !== "" && !isKnownIndustry(industry) ? industry : null;

  return (
    <>
      <Row label={t("settings.brandName")}>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={loading}
          aria-label={t("settings.brandName")} className={FIELD} />
      </Row>
      <Row label={t("settings.website")}>
        <input value={site} onChange={(e) => setSite(e.target.value)} disabled={loading}
          inputMode="url" aria-label={t("settings.website")} className={FIELD} />
      </Row>
      <Row label={t("settings.industry")}>
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={loading}
          aria-label={t("settings.industry")} className={FIELD}>
          <option value="" />
          {INDUSTRIES.map((i) => (
            <option key={i.value} value={i.value}>{`${i.emoji}  ${t(i.labelKey)}`}</option>
          ))}
          {extra && <option value={extra}>{extra}</option>}
        </select>
      </Row>
      <SaveRow save={save} disabled={loading} />
    </>
  );
}
