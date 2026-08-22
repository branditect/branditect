import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="bag"
      title="True cost per unit"
      description="Everything one sale costs — production, freight, packaging, payment fees and the cost of a return. It is the number every other figure in Numbers stands on, which is why it is calculator one. Not built yet; record landed cost directly on each product card meanwhile, and the margins are already computed from it."
      cta={{ label: "Open Products", href: "/knowledge/products" }}
    />
  );
}
