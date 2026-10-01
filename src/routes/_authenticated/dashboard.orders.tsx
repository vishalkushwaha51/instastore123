import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { inr, ORDER_STATUSES } from "@/lib/store";
import { myOrdersQuery, myStoreQuery } from "@/lib/seller";

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  loader: async ({ context }) => {
    const s = await context.queryClient.ensureQueryData(myStoreQuery);
    await context.queryClient.ensureQueryData(myOrdersQuery(s.id));
  },
  component: OrdersPage,
});

function OrdersPage() {
  const { data: store } = useSuspenseQuery(myStoreQuery);
  const { data: orders } = useSuspenseQuery(myOrdersQuery(store.id));
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("All");
  const list = filter === "All" ? orders : orders.filter((o) => o.status === filter);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["my-orders"] });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl sm:text-4xl">Orders</h1>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...ORDER_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${filter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
            {s}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No orders here yet.</p>}
      <div className="space-y-4">
        {list.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {o.payment_method}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={o.status} />
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm" aria-label="Order status">
                  {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-medium">{o.customer_name}</p>
                <a href={`tel:${o.customer_phone}`} className="text-muted-foreground underline">{o.customer_phone}</a>
                {o.customer_email && <p className="text-muted-foreground">{o.customer_email}</p>}
                <p className="mt-1 text-muted-foreground">{o.address}, {o.city}, {o.state} {o.pincode}</p>
              </div>
              <div>
                <ul className="space-y-1">
                  {o.order_items.map((i) => (
                    <li key={i.id} className="flex justify-between"><span>{i.product_name} × {i.quantity}</span><span>{inr(Number(i.unit_price) * i.quantity)}</span></li>
                  ))}
                </ul>
                <p className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span>{inr(o.total)}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
