/**
 * Full screen throughout — never a modal over the dashboard. The old welcome
 * modal reopened over every page on every load; this replaces it.
 */
export default function StartLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-page">{children}</div>;
}
