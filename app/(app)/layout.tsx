import Sidebar from "@/components/sidebar";
import Localised from "@/lib/i18n/server.tsx";
import LocaleSync from "@/components/locale-sync";
import WelcomeModal from "@/components/welcome-modal";

// One navigation. The top bar was removed — every destination it held is in
// the sidebar, and its "Brand Library" link landed on Visual Identity.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Localised>
      <div className="h-screen flex overflow-hidden bg-page">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <WelcomeModal />
        <LocaleSync />
      </div>
    </Localised>
  );
}
