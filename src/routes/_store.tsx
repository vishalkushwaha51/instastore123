import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteFooter, SiteHeader, StickyCartBar } from "@/components/store/StoreChrome";
import { storeQuery } from "@/lib/store";

export const Route = createFileRoute("/_store")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storeQuery()),
  component: () => (
    <div className="min-h-screen pb-20 sm:pb-0">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <StickyCartBar />
    </div>
  ),
});
