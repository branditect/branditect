import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="chat"
      title="AI Chat"
      description="The full-page conversation with your brand-trained assistant, reading your Brand, your Numbers and everything in Knowledge. The rail on Home is live; this larger view is still to come."
      cta={{ label: "Back to Home", href: "/home" }}
    />
  );
}
