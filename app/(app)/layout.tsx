import Sidebar from "@/components/sidebar";
import WelcomeModal from "@/components/welcome-modal";

// One navigation. The top bar was removed — every destination it held is in
// the sidebar, and its "Brand Library" link landed on Visual Identity.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden bg-page">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <WelcomeModal />
    </div>
  );
}
