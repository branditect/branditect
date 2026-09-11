"use client";

/**
 * Deleting the account, from Settings. Queue item 4.
 *
 * WHY THE BRAND NAME AND NOT A CHECKBOX. A checkbox is one click from a
 * mis-click, and this is the one action in the app with no undo: Supabase Free
 * has no point-in-time recovery, so the rows and the files are gone the moment
 * the route returns. Typing the name is a sentence you have to mean.
 *
 * The button stays disabled until what is typed matches, so the refusal is the
 * button not being available rather than an error after the fact. The server
 * checks it again anyway — this is a courtesy, not the guard.
 *
 * WHAT IT SAYS BEFORE IT ASKS. The count of what will go is read from the same
 * route's answer, not promised here: a list of table names in this file would
 * be a second copy of the enumeration the route reads from the database, and
 * the two would drift.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useBrand } from "@/lib/useBrand";
import { authedJson } from "@/lib/authed-fetch";
import { useT } from "@/lib/i18n/use-t.tsx";

export default function DeleteAccount() {
  const t = useT();
  const router = useRouter();
  const { brand } = useBrand();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = brand?.brand_name ?? "";
  const armed = name !== "" && typed.trim() === name;

  async function remove() {
    if (!armed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await authedJson("/api/account/delete", "POST", { confirm: typed.trim() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // The route says what is still there. Showing "something went wrong"
        // over a partial deletion is how someone concludes it worked.
        setError(json.error ?? t("settings.deleteFailed"));
        setBusy(false);
        return;
      }
      // Bound, not discarded — but it cannot be shown to anyone. The account
      // is gone by now, so a failed sign-out means only a stale local session
      // for a user that no longer exists, and there is nothing the person can
      // do about it. It is logged and the redirect happens either way;
      // leaving them on a settings page for a deleted brand is worse.
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error("[delete-account] signed out locally:", signOutError.message);
      router.replace("/");
    } catch {
      setError(t("settings.deleteFailed"));
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="text-sm font-semibold text-ink">{t("settings.deleteAccount")}</div>
      <p className="mt-1 text-xs font-medium text-muted">{t("settings.deleteAccountHelp")}</p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-card bg-white px-4 py-2 text-sm font-semibold text-danger drop-shadow-btn"
        >
          {t("settings.deleteAccount")}
        </button>
      ) : (
        <div className="mt-4 rounded-card border border-danger/30 bg-white p-4">
          <p className="text-xs font-semibold text-ink">{t("settings.deleteWhatGoes")}</p>
          <label className="mt-3 block text-xs font-medium text-muted" htmlFor="confirm-brand">
            {t("settings.deleteTypeName", { name })}
          </label>
          <input
            id="confirm-brand"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={busy}
            autoComplete="off"
            aria-label={t("settings.deleteTypeNameLabel")}
            className="mt-2 w-full rounded-card border border-hair bg-white px-3 py-2 text-sm text-ink"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={!armed || busy}
              className={
                armed && !busy
                  ? "rounded-card bg-danger px-4 py-2 text-sm font-bold text-white drop-shadow-btn"
                  : "rounded-card bg-hair px-4 py-2 text-sm font-bold text-muted-2"
              }
            >
              {busy ? t("settings.deleting") : t("settings.deleteForever")}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setTyped(""); setError(null); }}
              disabled={busy}
              className="rounded-card bg-white px-4 py-2 text-sm font-semibold text-ink drop-shadow-btn"
            >
              {t("common.cancel")}
            </button>
          </div>
          {error && <p className="mt-3 text-xs font-medium text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
