import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Store = Tables<"stores">;
export type Product = Tables<"products">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;

export const DEFAULT_STORE_SLUG = "vira";
export const ORDER_STATUSES = [
  "Order Received",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export const inr = (n: number | string) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const discountPct = (mrp: number, sale: number) =>
  mrp > 0 && sale < mrp ? Math.round(((mrp - sale) / mrp) * 100) : 0;

export const storeQuery = (slug = DEFAULT_STORE_SLUG) =>
  queryOptions({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
  });

export const productsQuery = (storeId: string) =>
  queryOptions({
    queryKey: ["products", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_listed", true)
        .order("popularity", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export type PublicOrder = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  items: { product_name: string; image_url: string | null; unit_price: number; mrp: number; quantity: number }[];
};

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order", { _order_id: id });
      if (error) throw error;
      return data as unknown as PublicOrder | null;
    },
  });

export function whatsappLink(number: string | null | undefined, text: string) {
  const n = (number ?? "").replace(/\D/g, "");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
