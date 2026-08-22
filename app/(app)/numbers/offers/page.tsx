import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="numbers"
      title="Offers & discounts"
      description="The deepest discount a product can carry while still clearing its floor — which becomes the limit Studio writes inside. Not built yet. Set max discount and minimum margin per product on the card's Pricing tab and Studio already obeys them."
      cta={{ label: "Open Products", href: "/knowledge/products" }}
    />
  );
}
