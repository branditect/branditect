import Link from "next/link";

const tools = [
  {
    title: "Unit Economics",
    desc: "Product margin calculator and wholesale vs retail analysis. Know your numbers before you sell.",
    href: "/dashboard/tools/unit-economics",
    icon: "📊",
  },
  {
    title: "SaaS Metrics",
    desc: "MRR, ARR, churn analysis, break-even modelling and monthly P&L for subscription businesses.",
    href: "/dashboard/tools/saas",
    icon: "📈",
  },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="px-8 pt-8 pb-5 border-b border-light">
        <h1 className="font-semibold text-[1.75rem] text-ink tracking-tight mb-1">Business Tools</h1>
        <p className="text-[0.78rem] text-muted">Financial intelligence for your brand. Model, analyse, and plan.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="bg-white border border-light rounded-xl p-6 hover:border-brand-orange hover:shadow-[0_2px_12px_rgba(232,86,42,0.08)] transition-all group"
            >
              <span className="text-2xl block mb-3">{t.icon}</span>
              <h2 className="font-semibold text-[1.05rem] text-ink mb-1.5 group-hover:text-brand-orange transition-colors">{t.title}</h2>
              <p className="text-[0.75rem] text-muted leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
