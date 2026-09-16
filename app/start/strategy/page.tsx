"use client";

/**
 * "I already have a strategy" — the door, and the reading.
 *
 * branditect-ui/spec/strategy-in-and-again.md, part 1. A PDF or pasted text,
 * both, because a founder either has the deck or has the words in a doc
 * somewhere. What comes out the other end is an extraction that nothing has
 * saved yet: the review screen is where it gets read and confirmed.
 *
 * THE FILE IS A DOCUMENT LIKE ANY OTHER. It is uploaded to the same bucket and
 * the same table as Knowledge ▸ Documents, with doc_type "strategy", and read
 * by the same /api/vault/extract. Not a private store for onboarding: it stays
 * in the library afterwards for the same reason every other document does.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { authedJson } from "@/lib/authed-fetch";
import { useOnboarding } from "@/lib/use-onboarding";
import { StartShell } from "@/components/start/shell";
import { Rail, RailFoot } from "@/components/start/rail";
import { askedFields } from "@/lib/document-types";
import { INTAKE_HANDOFF, type IntakeHandoff } from "@/components/start/intake-handoff";
import { useT } from "@/lib/i18n/use-t.tsx";

const MAX_BYTES = 50 * 1024 * 1024;

type Phase = "idle" | "uploading" | "extracting" | "matching";

export default function BringYourStrategy() {
  const t = useT();
  const router = useRouter();
  const { state, flush, brandId } = useOnboarding();
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = phase !== "idle";

  /** Upload, insert the row, and let /api/vault/extract read the pages. */
  async function textFromPdf(f: File): Promise<{ text: string; documentId: string }> {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${brandId}/${Date.now()}_${safeName}`;

    setPhase("uploading");
    const { error: storageErr } = await supabase.storage
      .from("brand-documents")
      .upload(storagePath, f, { contentType: f.type });
    if (storageErr) throw new Error(storageErr.message);

    const { data: docRow, error: insertErr } = await supabase
      .from("brand_documents")
      .insert({
        brand_id: brandId,
        file_name: f.name,
        file_type: ext,
        ...askedFields({ docTypeId: "strategy", filename: f.name }),
        storage_path: storagePath,
        status: "processing",
        pages_count: 0,
      })
      .select()
      .single();
    // supabase-js resolves { data, error } rather than throwing, so an
    // unchecked insert here would leave a file in storage and no row, and the
    // extract below would 404 on a document that does not exist.
    // A code, not a sentence: this reaches a person only inside the keyed
    // "Could not read that: {msg}", and it means the insert returned neither
    // an error nor a row, which is a bug rather than something to explain.
    if (insertErr || !docRow) throw new Error(insertErr?.message ?? "no_row");

    setPhase("extracting");
    const res = await authedJson("/api/vault/extract", "POST", {
      documentId: docRow.id,
      storagePath,
      brandId,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error ?? String(res.status));
    return { text: String(body?.extracted_text ?? ""), documentId: docRow.id as string };
  }

  async function read() {
    if (busy) return;
    setError(null);

    const pasted = text.trim();
    if (tab === "upload" && !file) return setError(t("intake.bring.needText"));
    if (tab === "paste" && !pasted) return setError(t("intake.bring.needText"));
    if (file && file.size > MAX_BYTES) return setError(t("intake.bring.tooBig", { name: file.name }));

    try {
      await flush();
      let documentText = pasted;
      let documentId: string | null = null;
      let fileName: string | null = null;

      if (tab === "upload" && file) {
        const out = await textFromPdf(file);
        documentText = out.text;
        documentId = out.documentId;
        fileName = file.name;
        // A deck of pictures extracts to nothing. Saying so is better than
        // showing a review screen with no answers and no reason.
        if (documentText.trim().length < 40) {
          setPhase("idle");
          return setError(t("intake.bring.noText"));
        }
      }

      setPhase("matching");
      const res = await authedJson("/api/strategy-extract", "POST", { text: documentText });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? String(res.status));

      const handoff: IntakeHandoff = {
        found: Array.isArray(body?.found) ? body.found : [],
        missing: Array.isArray(body?.missing) ? body.missing : [],
        documentId,
        fileName,
      };
      // Held in the tab, not in the database: nothing about this is saved
      // until the review screen is confirmed.
      sessionStorage.setItem(INTAKE_HANDOFF, JSON.stringify(handoff));
      router.push("/start/strategy/review");
    } catch (e) {
      setPhase("idle");
      setError(t("intake.bring.failed", { msg: e instanceof Error ? e.message : String(e) }));
    }
  }

  const phaseLabel = phase === "uploading"
    ? t("intake.bring.uploadingFile", { name: file?.name ?? "" })
    : phase === "extracting"
      ? t("intake.bring.extracting")
      : phase === "matching"
        ? t("intake.bring.matching")
        : "";

  return (
    <StartShell
      flush={flush}
      counter={
        <span className="text-micro font-extrabold uppercase tracking-[1.2px] text-lav-ink">
          {t("intake.bring.eyebrow")}
        </span>
      }
      rail={
        <Rail
          eyebrow={t("intake.bring.eyebrow")}
          heading={t("intake.bring.heading")}
          lede={t("intake.bring.lede")}
          foot={<RailFoot icon="key">{t("intake.bring.foot")}</RailFoot>}
        />
      }
    >
      <h1 className="max-w-[20ch] text-h2 font-bold leading-[1.15] tracking-[-0.5px]">
        {t("intake.bring.title")}
      </h1>

      <div className="mt-6 flex gap-2" role="tablist">
        {(["upload", "paste"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            disabled={busy}
            onClick={() => { setTab(id); setError(null); }}
            className={`rounded-pill px-4 py-2 text-sm font-bold transition-colors disabled:opacity-60 ${
              tab === id ? "bg-ink text-white" : "bg-tile text-ink-2 hover:text-ink"
            }`}
          >
            {t(id === "upload" ? "intake.bring.uploadTab" : "intake.bring.pasteTab")}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <div className="mt-5 max-w-[620px] rounded-panel border-[1.5px] border-dashed border-rule-2 bg-card px-5 py-6">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              setError(null);
              if (picked && !/pdf$/i.test(picked.name)) return setError(t("intake.bring.pdfOnly"));
              setFile(picked);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-card border border-rule-2 bg-white px-5 py-2.5 text-sm font-bold text-ink-2 hover:border-accent-line disabled:opacity-60"
          >
            {t("intake.bring.chooseFile")}
          </button>
          {file && <span className="ml-3 text-sm font-semibold text-ink">{file.name}</span>}
          <p className="mt-3 text-xs font-medium text-muted-2">{t("intake.bring.fileTypes")}</p>
        </div>
      ) : (
        <div className="mt-5 max-w-[720px]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            disabled={busy}
            aria-label={t("intake.bring.pasteTab")}
            placeholder={t("intake.bring.pastePlaceholder")}
            className="min-h-[240px] w-full resize-y rounded-panel border-[1.5px] border-rule-2 bg-card px-5 py-[18px] text-base leading-[1.6] text-ink outline-none placeholder:font-normal placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-tint-1 disabled:opacity-60"
          />
          <p className="mt-2.5 text-xs font-medium text-muted-2">{t("intake.bring.pasteHelp")}</p>
        </div>
      )}

      {error && (
        <p className="mt-4 max-w-[620px] rounded-tile bg-tint-1 px-3.5 py-2.5 text-sm font-semibold text-accent-dark">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/start" className="text-sm font-semibold text-muted-2 hover:text-ink-2">
          {t("onboarding.back")}
        </Link>
        <button
          type="button"
          onClick={() => void read()}
          disabled={busy}
          className="ml-auto rounded-card bg-grad-mark px-6 py-3 text-sm font-bold text-white drop-shadow-btn disabled:opacity-50"
        >
          {busy ? t("intake.bring.reading") : t("intake.bring.read")}
        </button>
      </div>

      {/* Honest about the wait: a real deck measured 104s through the same
          extractor, and a spinner with no words reads as a hang. */}
      {busy && (
        <div className="mt-4" aria-live="polite">
          <p className="text-sm font-semibold text-ink-2">{phaseLabel}</p>
          <p className="mt-1 text-xs font-medium text-muted-2">{t("intake.bring.readingSlow")}</p>
        </div>
      )}

      {state.status === "partial" && (
        <p className="mt-6 text-xs font-medium text-muted-2">
          {t("start.answersSaved")}
        </p>
      )}
    </StartShell>
  );
}
