import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, LayoutGrid, LogOut, Package, Settings, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { myStoreQuery } from "@/lib/seller";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — InstaStore" },
      { name: "description", content: "Manage your store's products, orders and settings." },
      { property: "og:title", content: "Seller dashboard — InstaStore" },
      { property: "og:description", content: "Manage your store's products, orders and settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myStoreQuery),
  errorComponent: ({ error }) => <p className="p-10 text-destructive">Couldn't load your store: {(error as Error).message}</p>,
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/dashboard/products", label: "Products", icon: Package },
  { to: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function DashboardLayout() {
  const { data: store } = useSuspenseQuery(myStoreQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40 md:flex">
      <aside className="border-b border-border bg-card md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block md:p-6">
          <div>
            <p className="font-display text-2xl tracking-[0.15em]">{store.name}</p>
            <p className="text-xs text-muted-foreground">Seller dashboard</p>
          </div>
          <button onClick={signOut} className="md:hidden" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n }}
              className="flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground font-medium" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden space-y-1 px-3 md:absolute md:bottom-4 md:block md:w-full">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"><ExternalLink className="h-4 w-4" /> View store</Link>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
