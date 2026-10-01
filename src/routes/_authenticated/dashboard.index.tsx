import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { inr } from "@/lib/store";
import { myOrdersQuery, myProductsQuery, myStoreQuery } from "@/lib/seller";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async ({ context }) => {
    const s = await context.queryClient.ensureQueryData(myStoreQuery);
    await Promise.all([
      context.queryClient.ensureQueryData(myProductsQuery(s.id)),
      context.queryClient.ensureQueryData(myOrdersQuery(s.id)),
    ]);
  },
  component: Overview,
});

function Overview() {
  const { data: store } = useSuspenseQuery(myStoreQuery);
  const { data: products } = useSuspenseQuery(myProductsQuery(store.id));
  const { data: orders } = useSuspenseQuery(myOrdersQuery(store.id));
  const live = orders.filter((o) => o.status !== "Cancelled");
  const stats = [
    { label: "Total orders", value: orders.length },
    { label: "Total sales", value: inr(live.reduce((s, o) => s + Number(o.total), 0)) },
    { label: "Products", value: products.length },
    { label: "Out of stock", value: products.filter((p) => p.stock <= 0).length },
  ];
  const sold = new Map<string, number>();
  live.forEach((o) => o.order_items.forEach((i) => sold.set(i.product_name, (sold.get(i.product_name) ?? 0) + i.quantity)));
  const best = [...sold.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl">Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-3xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex justify-between">
            <h2 className="text-xl">Recent orders</h2>
            <Link to="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet. Share your store link to get started.</p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.order_number} · {new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-3"><StatusBadge status={o.status} /><span className="font-medium">{inr(o.total)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-xl">Best sellers</h2>
          {best.length === 0 ? (
            <p className="text-sm text-muted-foreground">Appears once orders come in.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {best.map(([name, q]) => (
                <li key={name} className="flex justify-between"><span>{name}</span><span className="text-muted-foreground">{q} sold</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
