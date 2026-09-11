"use client";

/**
 * Section 4 of spec/settings.md. Signing out, and deleting the account.
 *
 * The reference shows an email route and a 30-day promise here, with a note
 * saying self-serve deletion is coming. It came: queue item 4 shipped
 * `POST /api/account/delete`, so the note is replaced by the control it was
 * standing in for, and `spec/privacy-and-terms.md` no longer promises the
 * email route either.
 *
 * Sign out sits above it, separated, and is the plain ghost button. The two
 * are not adjacent in weight: one is a Tuesday and the other is permanent.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n/use-t.tsx";
import DeleteAccount from "@/components/delete-account";

export default function AccountPanel() {
  const t = useT();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    // Criterion 4 of the spec: every write reports its result. A sign-out
    // that fails and says nothing leaves someone looking at a page they
    // believe they have left.
    const { error: e } = await supabase.auth.signOut();
    if (e) {
      setError(e.message);
      setSigningOut(false);
      return;
    }
    router.replace("/");
  }

  return (
    <>
      <div className="mt-4">
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="rounded-[9px] border border-rule-2 bg-white px-[18px] py-[9px] text-[13px] font-bold text-ink-2 hover:border-accent-line hover:text-accent-dark"
        >
          {signingOut ? t("settings.signingOut") : t("settings.signOut")}
        </button>
        {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
      </div>

      <div className="mt-6 border-t border-rule pt-5">
        <DeleteAccount />
      </div>
    </>
  );
}
