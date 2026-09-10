import EnsureBrand from "@/components/start/ensure-brand";
import Localised from "@/lib/i18n/server.tsx";

/**
 * Full screen throughout — never a modal over the dashboard. The old welcome
 * modal reopened over every page on every load; this replaces it.
 */
export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <Localised>
      <div className="min-h-screen bg-page">
        <EnsureBrand />
        {children}
      </div>
    </Localised>
  );
}
