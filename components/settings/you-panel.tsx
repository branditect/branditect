"use client";

/**
 * Section 1 of spec/settings.md. Name, and a read-only email.
 *
 * `lib/useUser.ts` has always *read* `user_metadata.full_name` and nothing
 * has ever written it, so it is empty for everyone and the greeting on Home
 * falls back to the email address. One `updateUser` call fixes that; no
 * migration, no table.
 *
 * Email is read-only on purpose. Changing it means a verification round trip
 * to both addresses, and a half-built version that swaps the address without
 * confirming it is an account-takeover path. The input says why rather than
 * sitting there disabled with no explanation.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { useT } from "@/lib/i18n/use-t.tsx";
import { normaliseName } from "@/lib/settings";
import SaveRow, { Row } from "./save-state";

export default function YouPanel() {
  const t = useT();
  const { user, loading } = useUser();
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);

  // Seeded once from the loaded user, and not again: re-seeding on every
  // render of the hook would wipe what is being typed.
  useEffect(() => {
    if (!touched && user?.fullName) setName(user.fullName);
  }, [user?.fullName, touched]);

  async function save(): Promise<string | null> {
    const full_name = normaliseName(name);
    const { error } = await supabase.auth.updateUser({ data: { full_name } });
    return error ? error.message : null;
  }

  return (
    <>
      <Row label={t("settings.name")}>
        <input
          value={name}
          onChange={(e) => { setTouched(true); setName(e.target.value); }}
          disabled={loading}
          aria-label={t("settings.name")}
          className="w-full rounded-[9px] border border-rule-2 bg-white px-[11px] py-[9px] text-[13px] font-medium text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-tint-1"
        />
      </Row>
      <Row label={t("settings.email")} hint={t("settings.emailFixed")}>
        <input
          value={user?.email ?? ""}
          readOnly
          aria-label={t("settings.email")}
          className="w-full rounded-[9px] border border-dashed border-rule-2 bg-tile-2 px-[11px] py-[9px] text-[13px] font-medium text-muted"
        />
      </Row>
      <SaveRow save={save} disabled={loading} />
    </>
  );
}
