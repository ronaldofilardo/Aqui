import { Providers } from "../../components/providers";
import { Sidebar } from "../../components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </Providers>
  );
}
