import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { inr, storeQuery } from "@/lib/store";

export function SiteHeader() {
  const { count } = useCart();
  const { data: store } = useQuery(storeQuery());
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-[0.2em]">
          {store?.name ?? "VIRA"}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/shop" className="hidden text-muted-foreground hover:text-foreground sm:inline" activeProps={{ className: "text-foreground" }}>
            Shop
          </Link>
          <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { data: store } = useQuery(storeQuery());
  return (
    <footer className="mt-24 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl tracking-[0.2em]">{store?.name ?? "VIRA"}</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{store?.tagline}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Visit</p>
          {store?.address && (
            <a href={store.maps_url ?? "#"} target="_blank" rel="noreferrer" className="flex gap-2 text-muted-foreground hover:text-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {store.address}
            </a>
          )}
          {store?.phone && <p className="text-muted-foreground">{store.phone}</p>}
          {store?.email && <p className="text-muted-foreground">{store.email}</p>}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Follow</p>
          {store?.instagram_url && (
            <a href={store.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Instagram className="h-4 w-4" /> Instagram
            </a>
          )}
          {store?.whatsapp_number && (
            <a href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          <Link to="/dashboard" className="block pt-4 text-xs text-muted-foreground hover:text-foreground">
            Seller login
          </Link>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {store?.name ?? "VIRA"}. Cash on Delivery across India.</p>
    </footer>
  );
}

export function StickyCartBar() {
  const { count, total } = useCart();
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:hidden">
      <Link to="/cart" className="flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-xl">
        <span className="text-sm">{count} item{count > 1 ? "s" : ""} · {inr(total)}</span>
        <span className="text-sm font-semibold">View cart →</span>
      </Link>
    </div>
  );
}
