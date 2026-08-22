import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="target"
      title="Pricing & margin"
      description="Set a price and see the margin, or set a margin and see the price — worked from either end, always net of tax and against landed cost. Not built yet. The margin itself is live on every product card today."
      cta={{ label: "Open Products", href: "/knowledge/products" }}
    />
  );
}
