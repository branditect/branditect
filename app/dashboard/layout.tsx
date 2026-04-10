import Topbar from "@/components/topbar";
import Sidebar from "@/components/sidebar";
import FloatingNotes from "@/components/floating-notes";
import AndyTrigger from "@/components/andy-trigger";
import WelcomeModal from "@/components/welcome-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">{children}</main>
      </div>
      <FloatingNotes />
      <AndyTrigger />
      <WelcomeModal />
    </div>
  );
}
