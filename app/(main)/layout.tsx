import BottomNav from "@/components/layout/BottomNav";
import RouteGuard from "@/components/RouteGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="flex flex-col min-h-screen">
        {/* Main content */}
        <div className="flex-1">{children}</div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </RouteGuard>
  );
}
