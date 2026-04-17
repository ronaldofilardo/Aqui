import { Providers } from "../../components/providers";
import { Sidebar } from "../../components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </Providers>
  );
}
