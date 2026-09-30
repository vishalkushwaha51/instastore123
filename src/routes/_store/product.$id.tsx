import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { PriceTag, ProductCard } from "@/components/store/ProductCard";
import { useCart } from "@/lib/cart";
import { productQuery, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/_store/product/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!p) throw notFound();
    await context.queryClient.ensureQueryData(productsQuery(p.store_id));
    return { name: p.name, description: p.description ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Product"} — VIRA` },
      { name: "description", content: loaderData?.description ?? "" },
      { property: "og:title", content: `${loaderData?.name ?? "Product"} — VIRA` },
      { property: "og:description", content: loaderData?.description ?? "" },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <div className="py-32 text-center">
      <p className="text-2xl font-display">This product isn't available.</p>
      <Link to="/shop" className="mt-4 inline-block underline">Back to shop</Link>
    </div>
  ),
  errorComponent: () => <p className="py-32 text-center">Couldn't load this product. Please refresh.</p>,
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(id));
  const { data: all } = useSuspenseQuery(productsQuery(p!.store_id));
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const navigate = useNavigate();
  if (!p) return null;
  const out = p.stock <= 0;
  const related = all.filter((x) => x.id !== p.id).slice(0, 4);

  const addToCart = () =>
    add({ product_id: p.id, store_id: p.store_id, name: p.name, image_url: p.image_url, mrp: +p.mrp, sale_price: +p.sale_price, stock: p.stock }, qty);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8">
      <div className="grid gap-8 md:grid-cols-2 md:gap-14">
        <div className="overflow-hidden rounded-3xl bg-muted">
          {p.image_url && <img src={p.image_url} alt={p.name} width={896} height={1120} className="aspect-[4/5] w-full object-cover" />}
        </div>
        <div className="animate-rise md:py-6">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{p.category}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{p.name}</h1>
          <div className="mt-5"><PriceTag mrp={+p.mrp} sale={+p.sale_price} large /></div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{p.description}</p>
          <p className={`mt-6 text-sm font-medium ${out ? "text-destructive" : p.stock <= 10 ? "text-accent" : "text-success"}`}>
            {out ? "Out of stock" : p.stock <= 10 ? `Only ${p.stock} left` : "In stock"}
          </p>
          {!out && (
            <div className="mt-6 inline-flex items-center rounded-full border border-border">
              <button aria-label="Decrease" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button aria-label="Increase" className="p-3" onClick={() => setQty(Math.min(p.stock, qty + 1))}><Plus className="h-4 w-4" /></button>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={out}
              onClick={() => { addToCart(); toast.success("Added to cart"); }}
              className="flex-1 rounded-full border border-primary py-4 text-sm font-semibold transition hover:bg-secondary disabled:opacity-40"
            >
              Add to cart
            </button>
            <button
              disabled={out}
              onClick={() => { addToCart(); navigate({ to: "/checkout" }); }}
              className="flex-1 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Buy now
            </button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Cash on Delivery available · Ships in 2–4 days</p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-3xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </main>
  );
}
