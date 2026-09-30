import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { z } from "zod";
import { ProductCard } from "@/components/store/ProductCard";
import { productsQuery, storeQuery } from "@/lib/store";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["popular", "price-asc", "price-desc"]).optional(),
});

export const Route = createFileRoute("/_store/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop all — VIRA" },
      { name: "description", content: "Browse every VIRA piece: tops, outerwear, bags and accessories." },
      { property: "og:title", content: "Shop all — VIRA" },
      { property: "og:description", content: "Browse every VIRA piece: tops, outerwear, bags and accessories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    const store = await context.queryClient.ensureQueryData(storeQuery());
    await context.queryClient.ensureQueryData(productsQuery(store.id));
  },
  component: Shop,
});

function Shop() {
  const { category, q = "", sort = "popular" } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: store } = useSuspenseQuery(storeQuery());
  const { data: products } = useSuspenseQuery(productsQuery(store.id));
  const categories = Array.from(new Set(products.map((p) => p.category)));

  let list = products.filter(
    (p) => (!category || p.category === category) && p.name.toLowerCase().includes(q.toLowerCase()),
  );
  if (sort === "price-asc") list = [...list].sort((a, b) => +a.sale_price - +b.sale_price);
  if (sort === "price-desc") list = [...list].sort((a, b) => +b.sale_price - +a.sale_price);

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${active ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-border"}`;

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="text-4xl sm:text-5xl">Shop all</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => navigate({ search: (s) => ({ ...s, q: e.target.value || undefined }), replace: true })}
            placeholder="Search products"
            className="w-full rounded-full border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ring"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => navigate({ search: (s) => ({ ...s, sort: e.target.value as "popular" }) })}
          className="rounded-full border border-input bg-card px-4 py-2.5 text-sm"
        >
          <option value="popular">Most popular</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button className={chip(!category)} onClick={() => navigate({ search: (s) => ({ ...s, category: undefined }) })}>All</button>
        {categories.map((c) => (
          <button key={c} className={chip(category === c)} onClick={() => navigate({ search: (s) => ({ ...s, category: c }) })}>{c}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="py-24 text-center text-muted-foreground">No products match your search.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}
