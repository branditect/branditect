"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/**
 * The account row at the foot of the sidebar, as a menu trigger.
 *
 * Ported from reference/dashboard.html per spec/components.md. The menu opens
 * *upward* and is anchored to the row — absolutely positioned inside a
 * relative wrapper around the row, not the panel, so it stays correct when the
 * sidebar collapses on narrow screens.
 *
 * Profile, Settings and Help render enabled with a no-op handler and a `Soon`
 * tag. Deliberately not `disabled`: a disabled item takes no focus, so a
 * keyboard user never discovers it exists. The tag is what tells the truth.
 *
 * Log out is the only wired item and the only destructive one. It sits last,
 * behind a separator, so it is never adjacent to something clicked casually.
 */

type Item = {
  label: string;
  icon: React.ReactNode;
  soon?: boolean;
};

const ITEMS: Item[] = [
  {
    label: "Profile",
    soon: true,
    icon: <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-5 0-9 2.7-9 6v2h18v-2c0-3.3-4-6-9-6" />,
  },
  {
    label: "Settings",
    soon: true,
    icon: <path d="m19.4 13-.1-1 2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.8-1l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.6a8 8 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.8 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.8-1l2.4 1 2-3.4-2-1.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7" />,
  },
  {
    label: "Help",
    soon: true,
    icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 16.2a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7m1.9-6.1c-.8.6-.9.9-.9 1.5v.3h-2v-.5c0-1.3.5-2 1.5-2.8.8-.6 1.1-.9 1.1-1.5 0-.8-.6-1.3-1.6-1.3s-1.7.6-1.8 1.6h-2c.1-2 1.6-3.4 3.8-3.4s3.6 1.2 3.6 3c0 1.2-.5 1.9-1.7 2.8" />,
  },
];

const SIGN_OUT_ICON = (
  <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5zm5.6 3.6L14.2 8l3 3H9v2h8.2l-3 3 1.4 1.4L21 12z" />
);

export default function AccountMenu({
  name,
  org,
  avatar,
  onSignOut,
}: {
  name: string;
  org: string;
  /** The row's avatar. A node rather than a URL so the sidebar keeps passing
   *  the Branditect mark it already renders. */
  avatar: React.ReactNode;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const triggerId = useId();

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Opening moves focus to the first item.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [open]);

  // A click anywhere outside closes it. mousedown rather than click so the
  // menu is gone before the outside target reacts.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  // Escape closes and returns focus to the row that opened it.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Up and down walk the items and wrap.
  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
    );
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? i + 1 : i - 1;
    items[(next + items.length) % items.length].focus();
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    // The menu deliberately stays open: closing it first unmounts the pending
    // label before anyone can read it, and signing out is a network round
    // trip. Navigation unmounts the whole sidebar; if it fails instead, the
    // item resets so a second attempt is possible.
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative mt-3">
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={onMenuKeyDown}
          className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-40 rounded-[14px] border border-rule bg-card p-[5px] shadow-[0_18px_40px_-14px_rgba(20,20,26,.28),0_2px_6px_rgba(20,20,26,.06)]"
        >
          {ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => { /* Not built yet — the Soon tag says so. */ }}
              className="flex w-full items-center gap-[9px] rounded-[9px] px-[9px] py-2 text-sm font-semibold text-muted-2 hover:bg-tile focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[17px] w-[17px] flex-none fill-current text-faint">
                {item.icon}
              </svg>
              {item.label}
              <span className="ml-auto rounded-[4px] bg-tile px-[5px] py-[2px] text-[9px] font-bold uppercase tracking-[.4px] text-muted-2">
                Soon
              </span>
            </button>
          ))}

          <div role="separator" className="mx-1 my-[5px] h-px bg-rule" />

          {/* The only wired item, and the only red one. */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-[9px] rounded-[9px] px-[9px] py-2 text-sm font-semibold text-[#c8402a] hover:bg-[#fdeeea] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[17px] w-[17px] flex-none fill-current">
              {SIGN_OUT_ICON}
            </svg>
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      )}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-[11px] px-[3px] py-[5px] text-left hover:bg-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${open ? "bg-tile" : ""}`}
      >
        {avatar}
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-[-0.1px]">{name}</span>
          <span className="block truncate text-2xs font-normal text-faint">{org}</span>
        </span>
        <span
          aria-hidden="true"
          className={`ml-auto text-[10px] text-faint transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
    </div>
  );
}
