import { Link } from "@tanstack/react-router";
import { discountPct, inr, type Product } from "@/lib/store";

export function PriceTag({ mrp, sale, large }: { mrp: number; sale: number; large?: boolean }) {
  const pct = discountPct(mrp, sale);
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={large ? "text-2xl font-semibold" : "font-semibold"}>{inr(sale)}</span>
      {pct > 0 && (
        <>
          <span className="text-sm text-muted-foreground line-through">{inr(mrp)}</span>
          <span className="text-sm font-semibold text-accent">{pct}% off</span>
        </>
      )}
    </div>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] font-medium text-background">Sold out</span>;
  if (stock <= 10) return <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium">Only {stock} left</span>;
  return null;
}

export function ProductCard({ p }: { p: Product }) {
  const out = p.stock <= 0;
  return (
    <Link to="/product/$id" params={{ id: p.id }} className="group block animate-rise">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        {p.image_url && (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            width={896}
            height={1120}
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${out ? "opacity-60 grayscale" : ""}`}
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {discountPct(Number(p.mrp), Number(p.sale_price)) > 0 && !out && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
              -{discountPct(Number(p.mrp), Number(p.sale_price))}%
            </span>
          )}
          <StockBadge stock={p.stock} />
        </div>
      </div>
      <div className="mt-3 space-y-1 px-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</p>
        <p className="font-medium">{p.name}</p>
        <PriceTag mrp={Number(p.mrp)} sale={Number(p.sale_price)} />
      </div>
    </Link>
  );
}
