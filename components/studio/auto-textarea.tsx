"use client";

/**
 * A textarea that is always exactly as tall as its text.
 *
 * The notes editor styles its blocks `overflow: hidden` so a block reads as a
 * paragraph rather than a form field, and gave them `rows={3}`. Together those
 * mean the fourth line onwards is painted outside the box and clipped: the
 * text is in the note and saved, but the writer cannot see it, and there is no
 * scrollbar to tell them it is there. Reported as "when I write a note I can
 * only see a tiny part of it".
 *
 * So the height is measured rather than declared. `rows` stays as the minimum
 * height for the first server render, and from the first layout onwards the
 * element is grown to its own `scrollHeight`. The pane around it scrolls, so a
 * long note pushes down the page the way a document does.
 *
 * Re-measured on every value change and on width changes: a narrower column
 * rewraps the same text onto more lines, and a height measured at the old
 * width would clip it again.
 */
import { useLayoutEffect, useRef } from "react";

export default function AutoTextarea({
  value,
  ...rest
}: React.ComponentPropsWithoutRef<"textarea"> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      // "auto" first: scrollHeight never shrinks below the height already set,
      // so measuring without resetting makes a shortened note keep its old
      // height for ever.
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    // The parent, not the textarea: observing the element whose height this
    // sets is a loop.
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [value]);

  return <textarea ref={ref} value={value} {...rest} />;
}
