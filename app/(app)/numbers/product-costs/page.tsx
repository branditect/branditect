import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="bag"
      title="Product costs"
      description="Cost per product — materials, shipping, fees — so margin can be calculated rather than guessed. This has no data model yet; it needs its own design pass before it can hold real numbers."
      cta={{ label: "See your products", href: "/brand/products" }}
    />
  );
}
