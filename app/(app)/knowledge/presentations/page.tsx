import NotBuiltYet from "@/components/not-built-yet";

export default function Page() {
  return (
    <NotBuiltYet
      icon="pres"
      title="Presentations"
      description="Presentations you upload will be indexed here alongside your documents, so Studio can quote a deck the same way it quotes a PDF. Decks currently land in Documents — nothing is lost, they just aren't separated out yet."
      cta={{ label: "Go to Documents", href: "/knowledge/documents" }}
    />
  );
}
