import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="numbers"
      title="Recurring revenue"
      description="MRR, churn, lifetime value and how long it takes to earn back what you spent acquiring a customer. Shown because you charge a subscription. Not built yet."
      cta={{ label: "Back to Numbers", href: "/numbers" }}
    />
  );
}
