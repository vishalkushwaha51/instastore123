import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Instagram, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { ProductCard } from "@/components/store/ProductCard";
import { discountPct, productsQuery, storeQuery } from "@/lib/store";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "VIRA — Everyday women's fashion" },
      { name: "description", content: "Soft tees, ribbed tops, totes and minimal jewellery from VIRA. Cash on Delivery across India." },
      { property: "og:title", content: "VIRA — Everyday women's fashion" },
      { property: "og:description", content: "Soft tees, ribbed tops, totes and minimal jewellery. Cash on Delivery across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    const store = await context.queryClient.ensureQueryData(storeQuery());
    await context.queryClient.ensureQueryData(productsQuery(store.id));
  },
  component: Home,
});

function Section({ title, children, link = true }: { title: string; children: React.ReactNode; link?: boolean }) {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {link && (
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Home() {
  const { data: store } = useSuspenseQuery(storeQuery());
  const { data: products } = useSuspenseQuery(productsQuery(store.id));
  const featured = products.filter((p) => p.is_featured);
  const best = products.filter((p) => p.is_best_seller);
  const sale = [...products]
    .filter((p) => p.stock > 0)
    .sort((a, b) => discountPct(+b.mrp, +b.sale_price) - discountPct(+a.mrp, +a.sale_price))
    .slice(0, 4);
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl">
          <img src={hero} alt="VIRA new season" width={1600} height={1008} className="h-[70vh] min-h-[420px] w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:justify-center sm:p-14">
            <p className="animate-rise text-xs font-semibold uppercase tracking-[0.3em] text-accent">New season</p>
            <h1 className="animate-rise mt-3 max-w-md text-5xl leading-[1.05] sm:text-6xl">{store.tagline}</h1>
            <div className="animate-rise mt-8 flex gap-3">
              <Link to="/shop" className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Shop the collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl px-4 text-center">
        <p className="font-display text-2xl leading-relaxed sm:text-3xl">{store.description}</p>
      </section>

      <Section title="Featured">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </Section>

      <Section title="Shop by category" link={false}>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link key={c} to="/shop" search={{ category: c }} className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition hover:border-foreground">
              {c}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Best sellers">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {best.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </Section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="rounded-3xl bg-accent px-6 py-12 text-accent-foreground sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-80">On sale now</p>
          <h2 className="mt-2 text-4xl">Up to {Math.max(0, ...sale.map((p) => discountPct(+p.mrp, +p.sale_price)))}% off</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {sale.map((p) => (
              <div key={p.id} className="rounded-2xl bg-background p-2 text-foreground">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
        {store.instagram_url && (
          <a href={store.instagram_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-card p-6 transition hover:border-foreground">
            <Instagram className="h-6 w-6 text-accent" />
            <p className="mt-4 font-semibold">Follow on Instagram</p>
            <p className="text-sm text-muted-foreground">New drops and styling every week.</p>
          </a>
        )}
        {store.whatsapp_number && (
          <a href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-card p-6 transition hover:border-foreground">
            <MessageCircle className="h-6 w-6 text-accent" />
            <p className="mt-4 font-semibold">Chat on WhatsApp</p>
            <p className="text-sm text-muted-foreground">Sizing help and order questions.</p>
          </a>
        )}
        {store.address && (
          <a href={store.maps_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-card p-6 transition hover:border-foreground">
            <MapPin className="h-6 w-6 text-accent" />
            <p className="mt-4 font-semibold">Visit the store</p>
            <p className="text-sm text-muted-foreground">{store.address}</p>
          </a>
        )}
      </section>
    </main>
  );
}
