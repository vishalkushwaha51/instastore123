import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderItem, Product, Store } from "./store";

export const myStoreQuery = queryOptions({
  queryKey: ["my-store"],
  queryFn: async (): Promise<Store> => {
    const { data: id, error } = await supabase.rpc("ensure_my_store");
    if (error) throw error;
    const { data, error: e2 } = await supabase.from("stores").select("*").eq("id", id).single();
    if (e2) throw e2;
    return data;
  },
});

export const myProductsQuery = (storeId: string) =>
  queryOptions({
    queryKey: ["my-products", storeId],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from("products").select("*").eq("store_id", storeId).order("created_at");
      if (error) throw error;
      return data;
    },
  });

export type OrderWithItems = Order & { order_items: OrderItem[] };

export const myOrdersQuery = (storeId: string) =>
  queryOptions({
    queryKey: ["my-orders", storeId],
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderWithItems[];
    },
  });
