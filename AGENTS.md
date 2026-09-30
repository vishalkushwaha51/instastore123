# Architecture rules
- Browser Supabase client + RLS for all data; public checkout/order lookup via SECURITY DEFINER RPCs (place_order, get_order) — no auth needed for customers, prices/stock enforced in DB.
- Every product/order row carries store_id; sellers get their store via ensure_my_store() RPC (first signup claims VIRA) — keeps multi-seller ready.
- Cart lives in localStorage (src/lib/cart.tsx) — no customer accounts in MVP.
- Product images are URLs (demo images in public/products); public storage buckets are blocked in this workspace.
