# InstaStore MVP — VIRA storefront + seller dashboard

A mobile-first online-store platform. Two sides: a customer storefront and a seller dashboard. Built multi-seller from day one — every product and order belongs to a store — with one demo store, VIRA (women's fashion), to start.

## Before I can build the saving/login parts

You asked to use your own Supabase project (`instastore-mvp`). I can't connect it from chat — you do it in Lovable under **Project Settings → Connectors → Supabase**, then pick `instastore-mvp`. Once that's connected I can create the tables, seller login, and real saving of products and orders.

So the build runs in two stages:

**Stage 1 (now, no connection needed):** the complete app — every page, every screen, all the layout and design — running on realistic VIRA demo data.

**Stage 2 (after you connect `instastore-mvp`):** tables, seller email/password login, and real saving. Screens stay the same; only the data source changes.

## Customer storefront

- **Home** — VIRA logo, hero banner, brand intro, featured products, best sellers, categories, a sale section, Instagram and WhatsApp links, store location, footer.
- **Catalogue** — product grid with photo, name, MRP struck through, sale price, auto-calculated discount %, stock badge. Category filter, search, sort by price and popularity. Out-of-stock items clearly marked and not addable to cart.
- **Product detail** — large photo, description, pricing and discount, stock, quantity picker, Add to Cart, Buy Now, related products.
- **Cart** — items, quantity controls, remove, subtotal, discount, total, continue shopping, checkout. Sticky cart bar on mobile.
- **Checkout** — name, mobile, optional email, full address, city, state, pincode. Cash on Delivery only. Order summary shown before placing.
- **Order confirmation** — order ID, summary, customer details, total, status "Order Received", and a button to message the seller on WhatsApp (a normal wa.me link, no paid API).

## Seller dashboard

Separate area with Overview, Products, Orders, Store Settings.

- **Overview** — total orders, total sales, total products, out-of-stock count, recent orders, best sellers.
- **Products** — table with add, edit, delete, list/unlist, mark out of stock, update stock, MRP and sale price; discount % calculated automatically. Product form: name, description, category, image, MRP, sale price, stock, listed status, featured, best-selling.
- **Orders** — order ID, date, customer name, phone, address, items, quantity, total, payment method, and status moving through Order Received → Confirmed → Packed → Shipped → Delivered → Cancelled.
- **Store Settings** — store name, logo, description, Instagram URL, WhatsApp number, email, phone, address, maps link, accent colour.

## Design

Premium modern Instagram-brand feel, not a generic template: warm off-white canvas, deep ink text, a soft clay accent, one elegant serif for headings against a clean sans for everything else. Large photography, generously rounded cards, lots of whitespace, subtle motion on hover and page entry, strong contrast. Mobile-first throughout. Product photos generated for the five demo items: Oversized T-Shirt, Ribbed Top, Classic Tote Bag, Everyday Hoodie, Minimal Pendant — priced realistically (e.g. MRP ₹999, sale ₹499).

## Technical notes

- React + TypeScript on TanStack Start; reusable components; design tokens in `src/styles.css` (no hardcoded colours).
- Routes: storefront at `/`, `/shop`, `/product/$id`, `/cart`, `/checkout`, `/order/$id`; dashboard under a protected `_authenticated` layout at `/dashboard`, `/dashboard/products`, `/dashboard/orders`, `/dashboard/settings`; `/auth` for seller sign-in.
- All data flows through a typed store/product/order data layer keyed by `store_id`, so Stage 2 swaps demo data for Supabase queries without touching UI code.
- Stage 2 schema: `stores`, `products`, `orders`, `order_items`, all carrying `store_id`; row-level security so a seller only sees their own store; public read for listed products. Cart state stays in browser storage.
- Excluded as requested: payment gateway, WhatsApp/shipping APIs, subscription billing, custom domains, advanced analytics.
