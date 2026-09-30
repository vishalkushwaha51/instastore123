import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/store";
import { OrderTotals } from "./cart";

export const Route = createFileRoute("/_store/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — VIRA" },
      { name: "description", content: "Enter your delivery details and pay with Cash on Delivery." },
      { property: "og:title", content: "Checkout — VIRA" },
      { property: "og:description", content: "Enter your delivery details and pay with Cash on Delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email").max(200).or(z.literal("")),
  address: z.string().trim().min(5, "Enter your full address").max(500),
  city: z.string().trim().min(2, "Enter your city").max(100),
  state: z.string().trim().min(2, "Enter your state").max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
});
type Form = z.infer<typeof schema>;

const fields: { key: keyof Form; label: string; full?: boolean; type?: string }[] = [
  { key: "name", label: "Full name", full: true },
  { key: "phone", label: "Mobile number", type: "tel" },
  { key: "email", label: "Email (optional)", type: "email" },
  { key: "address", label: "Full address", full: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "Pincode" },
];

function Checkout() {
  const { items, subtotal, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);

  if (items.length === 0)
    return (
      <main className="py-32 text-center">
        <p className="font-display text-3xl">Your cart is empty</p>
        <Link to="/shop" className="mt-4 inline-block underline">Go shopping</Link>
      </main>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as keyof Form] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      _store_id: items[0].store_id,
      _customer: r.data,
      _items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("stock") ? error.message : "Couldn't place your order. Please try again.");
      return;
    }
    const res = data as { id: string };
    clear();
    navigate({ to: "/order/$id", params: { id: res.id } });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="text-4xl sm:text-5xl">Checkout</h1>
      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="text-xl">Delivery details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                <span className="text-sm text-muted-foreground">{f.label}</span>
                <input
                  type={f.type ?? "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-ring"
                />
                {errors[f.key] && <span className="mt-1 block text-xs text-destructive">{errors[f.key]}</span>}
              </label>
            ))}
          </div>
          <h2 className="mt-10 text-xl">Payment</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-primary bg-card p-4">
            <span className="h-4 w-4 rounded-full border-4 border-primary" />
            <div>
              <p className="font-medium">Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">Pay when your order arrives.</p>
            </div>
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">Order summary</h2>
          <ul className="my-4 space-y-3">
            {items.map((i) => (
              <li key={i.product_id} className="flex items-center gap-3 text-sm">
                {i.image_url && <img src={i.image_url} alt="" className="h-14 w-12 rounded-lg object-cover" />}
                <span className="flex-1">{i.name} × {i.quantity}</span>
                <span>{inr(i.sale_price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <OrderTotals subtotal={subtotal} total={total} />
          <button disabled={busy} className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Placing order…" : `Place order · ${inr(total)}`}
          </button>
        </aside>
      </form>
    </main>
  );
}
