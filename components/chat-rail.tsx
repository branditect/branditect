"use client";

import { useEffect, useRef, useState } from "react";
import { saveAnswerAsNote, noteTitleFrom } from "@/lib/note-from-chat";
import Link from "next/link";
import Icon from "@/components/icon";
import { useBrandChat } from "@/lib/useBrandChat";
import { useT } from "@/lib/i18n/use-t.tsx";

export interface SourceChip {
  filename: string;
  href: string;
}

interface ChatRailProps {
  indexedFileCount: number;
  /** exactly 3 */
  suggestions: string[];
  /** Named when the answer cited a file. */
  source?: SourceChip;
}

/**
 * The TRAINED badge and the indexed count are the point of this panel — they're
 * what makes the brain feel real. The source chip stays on every answer:
 * naming the file it read is the difference between an assistant and a chatbot.
 *
 * This is a working chat, not a preview. It shares its conversation loop with
 * the Andy panel via useBrandChat so the two can't drift apart.
 */
export default function ChatRail({ indexedFileCount, suggestions, source }: ChatRailProps) {
  const t = useT();
  const { messages, loading, send } = useBrandChat();
  /* Per answer, because a rail can hold several and "Copied" belongs to the
     one that was copied. Keyed by index, which is stable: the list only ever
     grows. */
  const [copied, setCopied] = useState<number | null>(null);
  const [noteState, setNoteState] = useState<Record<number, "saving" | "saved" | "failed">>({});

  async function copyAnswer(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 2000);
    } catch {
      /* A denied clipboard is the browser's call, and the answer is on screen
         to select by hand. Saying nothing is better than a scare. */
    }
  }

  async function keepAsNote(text: string, i: number) {
    if (noteState[i] === "saving" || noteState[i] === "saved") return;
    setNoteState((prev) => ({ ...prev, [i]: "saving" }));
    // The question above it makes the better title; the fallback is translated.
    const question = [...messages.slice(0, i)].reverse().find((m) => m.role === "user")?.content;
    const res = await saveAnswerAsNote(text, noteTitleFrom(question, t("chatRail.noteFromChat")));
    setNoteState((prev) => ({ ...prev, [i]: res.ok ? "saved" : "failed" }));
  }
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest turn in view as answers arrive.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    void send(text);
  }

  const started = messages.length > 0;

  return (
    <aside
      aria-label={t("chat.title")}
      className="sticky top-3 m-3 ml-0 flex h-[calc(100dvh-24px)] w-chatrail shrink-0 flex-col overflow-hidden rounded-panel border border-rule bg-grad-chat px-4 pb-4 pt-[18px] shadow-[0_6px_18px_-12px_rgba(20,20,26,.10),0_1px_2px_rgba(20,20,26,.04)] chat:hidden"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[140px] -left-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(216,201,249,.5),rgba(216,201,249,0)_70%)]"
      />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-[7px]">
          <h3 className="text-[18px] font-bold tracking-[-.4px]">{t("chat.title")}</h3>
          <span aria-hidden="true" className="text-sm text-[#8b6bd8]">✦</span>
          <Link
            href="/chat"
            className="ml-auto text-micro font-bold text-accent underline underline-offset-2"
          >
            {t("chatRail.fullScreen")}
          </Link>
        </div>

        <div className="mt-[11px] flex items-center gap-1.5">
          <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-good" />
          <span className="text-micro font-bold tracking-[1px] text-ink-3">{t("chatRail.trained")}</span>
        </div>

        <p className="mt-[7px] text-xs font-normal leading-[1.45] text-muted-2">
          {t("chatRail.readsEverything")}{" "}
          {(() => {
            // The count keeps its tabular figures, wherever the sentence puts it.
            const [before, after = ""] = t("chatRail.filesIndexed").split("{count}");
            return <>{before}<span className="tabular-nums">{indexedFileCount}</span>{after}</>;
          })()}
        </p>

        {/* Suggestions seed the input rather than navigating away. */}
        {!started && (
          <div className="mt-4 flex flex-col gap-[7px]">
            {suggestions.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className={`rounded-tile border bg-white/90 px-3 py-2.5 text-left text-xs font-semibold hover:border-accent-line hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  i === 0 ? "border-accent-line text-accent" : "border-rule text-ink-2"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={scrollRef} className="mt-4 flex-1 overflow-y-auto">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="ml-auto mt-3 max-w-[230px] rounded-[13px_13px_4px_13px] bg-navy px-[13px] pb-[9px] pt-[11px] text-xs font-normal leading-[1.45] text-white drop-shadow-[0_8px_6px_rgba(29,39,72,.13)]"
              >
                {m.content}
              </div>
            ) : (
              <div key={i} className="mt-4">
                <div className="text-micro font-bold tracking-[1px] text-accent">BRANDITECT</div>
                <p className="mt-[7px] whitespace-pre-wrap text-xs font-normal leading-[1.6] text-ink-2">
                  {m.content}
                </p>
                {/* An answer worth reading is worth keeping: copy it, or keep
                    it as a real note in Studio ▸ Notes. */}
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copyAnswer(m.content, i)}
                    className="inline-flex items-center gap-1 rounded-nav px-1.5 py-1 text-2xs font-bold text-muted-2 hover:bg-white/60 hover:text-ink-2"
                  >
                    <Icon name="copy" size={12} />
                    {copied === i ? t("wr.copied") : t("chatRail.copyAnswer")}
                  </button>
                  <button
                    type="button"
                    onClick={() => keepAsNote(m.content, i)}
                    disabled={noteState[i] === "saving" || noteState[i] === "saved"}
                    className="inline-flex items-center gap-1 rounded-nav px-1.5 py-1 text-2xs font-bold text-muted-2 hover:bg-white/60 hover:text-ink-2 disabled:hover:bg-transparent"
                  >
                    <Icon name="pin" size={12} />
                    {noteState[i] === "saved"
                      ? t("chatRail.savedToNotes")
                      : noteState[i] === "saving"
                        ? t("chatRail.saving")
                        : noteState[i] === "failed"
                          ? t("chatRail.saveFailed")
                          : t("chatRail.saveAsNote")}
                  </button>
                  {noteState[i] === "saved" && (
                    <Link href="/studio/notes" className="rounded-nav px-1.5 py-1 text-2xs font-bold text-accent hover:underline">
                      {t("nav.studio.notes")}
                    </Link>
                  )}
                </div>
                {source && i === messages.length - 1 && (
                  <Link
                    href={source.href}
                    className="mt-3 flex items-center gap-2 rounded-tile border border-rule-2 bg-lavender px-[11px] py-[9px] text-2xs font-medium text-[#4a3d63] hover:border-accent-line"
                  >
                    <span className="shrink-0 text-[#7b5ea7]">
                      <Icon name="doc" size={13} />
                    </span>
                    <span className="truncate">{source.filename}</span>
                  </Link>
                )}
              </div>
            ),
          )}

          {loading && (
            <div className="mt-4" aria-live="polite">
              <div className="text-micro font-bold tracking-[1px] text-accent">BRANDITECT</div>
              <p className="mt-[7px] text-xs font-normal text-muted">
                {t("chatRail.reading")}
                <span className="gen-dot" />
                <span className="gen-dot" />
                <span className="gen-dot" />
              </p>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="mt-auto pt-[18px]">
          <div className="flex items-center gap-2 rounded-[13px] border border-rule bg-white py-[7px] pl-3.5 pr-[7px] drop-shadow-[0_5px_8px_rgba(20,20,26,.16)] focus-within:border-accent-line">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chatRail.placeholder")}
              aria-label={t("chatRail.ask")}
              disabled={loading}
              className="w-full border-0 bg-transparent p-0 text-xs font-normal text-ink placeholder:text-faint focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={t("chatRail.send")}
              className="ml-auto grid h-[34px] w-[34px] shrink-0 place-items-center rounded-nav bg-grad-mark text-white drop-shadow-[0_5px_6px_rgba(232,73,32,.55)] disabled:bg-none disabled:bg-rule-2 disabled:text-muted disabled:drop-shadow-none"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
