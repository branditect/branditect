"use client";

import Link from "next/link";
import Icon from "@/components/icon";

export interface SourceChip {
  filename: string;
  href: string;
}

export interface ChatExchange {
  question: string;
  answer: string;
  at: string;
  source?: SourceChip;
}

interface ChatRailProps {
  indexedFileCount: number;
  /** exactly 3 */
  suggestions: string[];
  lastExchange?: ChatExchange;
}

/**
 * The TRAINED badge and the indexed count are the point of this panel —
 * they're what makes the brain feel real. The source chip stays on every
 * answer: naming the file it read is the difference between an assistant and
 * a chatbot.
 */
export default function ChatRail({
  indexedFileCount,
  suggestions,
  lastExchange,
}: ChatRailProps) {
  return (
    <aside
      aria-label="AI Chat"
      className="relative m-3 ml-0 flex min-h-[860px] w-chatrail shrink-0 flex-col self-start overflow-hidden rounded-panel border border-rule bg-grad-chat px-4 pb-4 pt-[18px] shadow-[0_6px_18px_-12px_rgba(20,20,26,.10),0_1px_2px_rgba(20,20,26,.04)] chat:hidden"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[140px] -left-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(216,201,249,.5),rgba(216,201,249,0)_70%)]"
      />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center gap-[7px]">
          <h3 className="text-[18px] font-bold tracking-[-.4px]">AI Chat</h3>
          <span aria-hidden="true" className="text-sm text-[#8b6bd8]">
            ✦
          </span>
        </div>

        <div className="mt-[11px] flex items-center gap-1.5">
          <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-good" />
          <span className="text-micro font-bold tracking-[1px] text-ink-3">TRAINED</span>
        </div>

        <p className="mt-[7px] text-xs font-normal leading-[1.45] text-muted-2">
          Reads your Brand, your Numbers and everything in Knowledge.{" "}
          <span className="tabular-nums">{indexedFileCount}</span> files indexed.
        </p>

        <div className="mt-4 flex flex-col gap-[7px]">
          {suggestions.map((s, i) => (
            <Link
              key={s}
              href="/chat"
              className={`rounded-tile border bg-white/90 px-3 py-2.5 text-xs font-semibold hover:border-accent-line hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                i === 0 ? "border-accent-line text-accent" : "border-rule text-ink-2"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>

        {lastExchange && (
          <>
            <div className="mt-[18px] max-w-[230px] self-end rounded-[13px_13px_4px_13px] bg-navy px-[13px] pb-[9px] pt-[11px] text-xs font-normal leading-[1.45] text-white drop-shadow-[0_8px_6px_rgba(29,39,72,.13)]">
              {lastExchange.question}
              <span className="mt-[7px] block text-right text-micro text-white/55">
                {lastExchange.at}
              </span>
            </div>

            <div className="mt-[18px] text-micro font-bold tracking-[1px] text-accent">
              BRANDITECT
            </div>
            <p className="mt-[7px] text-xs font-normal leading-[1.6] text-ink-2">
              {lastExchange.answer}
            </p>

            {lastExchange.source && (
              <Link
                href={lastExchange.source.href}
                className="mt-3 flex items-center gap-2 rounded-tile border border-rule-2 bg-lavender px-[11px] py-[9px] text-2xs font-medium text-[#4a3d63] hover:border-accent-line"
              >
                <span className="shrink-0 text-[#7b5ea7]">
                  <Icon name="doc" size={13} />
                </span>
                <span className="truncate">{lastExchange.source.filename}</span>
              </Link>
            )}
          </>
        )}

        <div className="mt-auto pt-[18px]">
          <Link
            href="/chat"
            className="flex items-center gap-2 rounded-[13px] border border-rule bg-white py-[7px] pl-3.5 pr-[7px] drop-shadow-[0_5px_8px_rgba(20,20,26,.16)]"
          >
            <span className="text-xs font-normal text-faint">Ask about your brand…</span>
            <span className="ml-auto grid h-[34px] w-[34px] shrink-0 place-items-center rounded-nav bg-grad-mark text-white drop-shadow-[0_5px_6px_rgba(232,73,32,.55)]">
              <Icon name="send" size={16} />
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
