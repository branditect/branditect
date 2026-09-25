/**
 * Branditect HQ — the operator surface. spec: branditect-ui/spec/hq.md.
 *
 * Its own route group and layout, with no customer navigation: mixing an
 * admin view into the customer app is how a mis-scoped query becomes a leak.
 * The rail is violet into indigo on purpose (hq-accounts.md): HQ reads across
 * every brand, and one glance has to say "you are not in the product".
 *
 * ACCESS. A non-operator gets notFound() — a real 404, not a 403 (a 403
 * confirms the route exists). The check is the signed `bd_hq` cookie, set by
 * /api/hq/session for operators only (lib/hq-access.ts). The cookie unlocks
 * this empty shell and nothing else: all data comes from /api/hq/*, which
 * re-checks the Bearer token against HQ_OPERATOR_IDS on every request.
 *
 * NAV. Only Accounts is built. Today, Money, Usage & cost, Activation and
 * Health have no design yet, so they are not listed — a nav item that leads
 * to an empty page is worse than one that is missing (CLAUDE.md).
 */
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HQ_COOKIE, cookieKey, verifyHqCookie } from "@/lib/hq-access";
import { serviceClient } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Branditect HQ", robots: { index: false, follow: false } };

export default async function HqLayout({ children }: { children: React.ReactNode }) {
  const operatorId = verifyHqCookie(cookies().get(HQ_COOKIE)?.value, cookieKey());
  if (!operatorId) notFound();

  const { data } = await serviceClient().auth.admin.getUserById(operatorId);
  const email = data.user?.email ?? "Operator";

  return (
    <div className="min-h-screen bg-page text-ink lg:grid lg:grid-cols-[214px_minmax(0,1fr)]">
      <aside className="hidden lg:flex flex-col bg-grad-rail text-white px-3.5 py-[18px] sticky top-0 h-screen">
        <div className="flex items-center gap-[9px] px-2 pb-5">
          <span className="w-7 h-7 rounded-lg bg-grad-mark grid place-items-center text-[13px] font-extrabold">B</span>
          <span className="text-[15px] font-extrabold tracking-[-0.3px]">
            Branditect <b className="opacity-50 font-bold">HQ</b>
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          <Link
            href="/hq"
            className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-[9px] text-[13.5px] font-extrabold bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-none" aria-hidden="true">
              <circle cx="9" cy="8" r="3.6" />
              <path d="M2 20c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6z" />
              <circle cx="17.5" cy="9" r="2.8" />
              <path d="M17.5 13.4c2.8 0 4.5 1.6 4.5 3.8v1h-5.2c.1-1.8-.6-3.5-1.8-4.6a7 7 0 0 1 2.5-.2Z" />
            </svg>
            Accounts
          </Link>
        </nav>
        <div className="mt-auto pt-3.5 px-2.5 border-t border-white/10 text-[11.5px] font-semibold text-white/50 leading-normal">
          <b className="block text-white font-extrabold text-[12.5px] mb-0.5 break-all">{email}</b>
          Operator. Every action here is logged.
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 lg:px-[26px] lg:py-[22px] pb-16">{children}</main>
    </div>
  );
}
