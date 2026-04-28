import { Providers } from "../../components/providers";
import { Sidebar } from "../../components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </Providers>
  );
}
