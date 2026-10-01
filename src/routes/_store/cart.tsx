import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/store";
import { OrderTotals } from "@/components/store/OrderTotals";

export const Route = createFileRoute("/_store/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — VIRA" },
      { name: "description", content: "Review the items in your VIRA cart." },
      { property: "og:title", content: "Your cart — VIRA" },
      { property: "og:description", content: "Review the items in your VIRA cart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, total } = useCart();
  if (items.length === 0)
    return (
      <main className="mx-auto max-w-md px-4 py-32 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Find something you love.</p>
        <Link to="/shop" className="mt-8 inline-block rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground">Start shopping</Link>
      </main>
    );
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="text-4xl sm:text-5xl">Your cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i.product_id} className="flex gap-4 py-5">
              {i.image_url && <img src={i.image_url} alt={i.name} className="h-28 w-24 rounded-xl object-cover" />}
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{i.name}</p>
                  <button onClick={() => remove(i.product_id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="text-sm"><span className="font-semibold">{inr(i.sale_price)}</span> <span className="text-muted-foreground line-through">{inr(i.mrp)}</span></p>
                <div className="mt-auto inline-flex w-fit items-center rounded-full border border-border">
                  <button aria-label="Decrease" className="p-2" onClick={() => setQty(i.product_id, i.quantity - 1)}><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-7 text-center text-sm">{i.quantity}</span>
                  <button aria-label="Increase" className="p-2" onClick={() => setQty(i.product_id, i.quantity + 1)}><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <OrderTotals subtotal={subtotal} total={total} />
          <Link to="/checkout" className="mt-6 block rounded-full bg-primary py-4 text-center text-sm font-semibold text-primary-foreground">Checkout</Link>
          <Link to="/shop" className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground">Continue shopping</Link>
        </aside>
      </div>
    </main>
  );
}
