import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="numbers"
      title="Pricing & offers"
      description="Floor price, maximum discount and minimum margin. These are the rules that let Studio refuse to write a promotion that kills your margin — the piece that makes this brand infrastructure rather than a spreadsheet. Not built yet."
      cta={{ label: "Open Profitability", href: "/numbers/profitability" }}
    />
  );
}
