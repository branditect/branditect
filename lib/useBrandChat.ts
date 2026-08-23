"use client";

import { useCallback, useState } from "react";
import { useBrand } from "@/lib/useBrand";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/**
 * One conversation loop, shared by the Home rail and the Andy panel.
 *
 * Extracted rather than copied: two chat implementations calling the same
 * endpoint drift, and the one nobody is looking at is the one that breaks.
 */
export function useBrandChat(onReply?: (all: ChatMsg[]) => void) {
  const { brandId } = useBrand();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const next: ChatMsg[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setLoading(true);

      try {
        const res = await fetch("/api/andy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, brandId }),
        });
        const data = await res.json();
        const all: ChatMsg[] = [
          ...next,
          { role: "assistant", content: data.reply || "Something went wrong." },
        ];
        setMessages(all);
        onReply?.(all);
      } catch {
        setMessages([
          ...next,
          { role: "assistant", content: "Connection issue — please try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, brandId, onReply],
  );

  const reset = useCallback(() => setMessages([]), []);

  return { messages, setMessages, loading, send, reset, brandId };
}
