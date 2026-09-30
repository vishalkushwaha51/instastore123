import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { inr, orderQuery, storeQuery, whatsappLink } from "@/lib/store";

export const Route = createFileRoute("/_store/order/$id")({
  head: () => ({
    meta: [
      { title: "Order confirmed — VIRA" },
      { name: "description", content: "Your VIRA order has been received." },
      { property: "og:title", content: "Order confirmed — VIRA" },
      { property: "og:description", content: "Your VIRA order has been received." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { data: order, isLoading } = useQuery(orderQuery(id));
  const { data: store } = useQuery(storeQuery());
  if (isLoading) return <p className="py-32 text-center text-muted-foreground">Loading your order…</p>;
  if (!order) return <p className="py-32 text-center">Order not found.</p>;

  const msg = `Hi ${store?.name ?? ""}! I just placed order ${order.order_number} for ${inr(order.total)} (Cash on Delivery). Name: ${order.customer_name}.`;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-12">
      <div className="animate-rise text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-4 text-4xl sm:text-5xl">Thank you, {order.customer_name.split(" ")[0]}!</h1>
        <p className="mt-3 text-muted-foreground">Your order has been placed.</p>
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-secondary px-4 py-2 text-sm">Order <b>{order.order_number}</b></span>
          <span className="rounded-full bg-accent/15 px-4 py-2 text-sm font-medium text-accent">{order.status}</span>
        </div>
      </div>
      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <ul className="space-y-3">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm">
              {i.image_url && <img src={i.image_url} alt="" className="h-14 w-12 rounded-lg object-cover" />}
              <span className="flex-1">{i.product_name} × {i.quantity}</span>
              <span>{inr(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inr(order.subtotal)}</span></div>
          <div className="flex justify-between text-accent"><span>Discount</span><span>−{inr(order.discount)}</span></div>
          <div className="flex justify-between text-base font-semibold"><span>Total ({order.payment_method})</span><span>{inr(order.total)}</span></div>
        </div>
        <div className="mt-5 border-t border-border pt-4 text-sm">
          <p className="font-semibold">Delivering to</p>
          <p className="text-muted-foreground">{order.customer_name} · {order.customer_phone}</p>
          <p className="text-muted-foreground">{order.address}, {order.city}, {order.state} {order.pincode}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {store?.whatsapp_number && (
          <a href={whatsappLink(store.whatsapp_number, msg)} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-success py-4 text-sm font-semibold text-primary-foreground">
            <MessageCircle className="h-4 w-4" /> Message seller on WhatsApp
          </a>
        )}
        <Link to="/shop" className="flex-1 rounded-full border border-border py-4 text-center text-sm font-semibold">Continue shopping</Link>
      </div>
    </main>
  );
}
