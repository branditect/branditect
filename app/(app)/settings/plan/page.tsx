import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="target"
      title="Your plan"
      description="Billing, plan tier and renewal date. Not wired up yet — your workspace is unaffected."
      cta={{ label: "Back to Home", href: "/home" }}
    />
  );
}
