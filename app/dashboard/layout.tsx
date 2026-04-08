import Topbar from "@/components/topbar";
import Sidebar from "@/components/sidebar";
import FloatingNotes from "@/components/floating-notes";

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
    </div>
  );
}
