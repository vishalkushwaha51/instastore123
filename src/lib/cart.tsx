import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  store_id: string;
  name: string;
  image_url: string | null;
  mrp: number;
  sale_price: number;
  stock: number;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "instastore-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add: CartCtx["add"] = (item, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.product_id === item.product_id);
      if (found)
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, quantity: Math.min(i.quantity + qty, item.stock) } : i,
        );
      return [...prev, { ...item, quantity: Math.min(qty, item.stock) }];
    });
  const setQty = (id: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i)),
    );
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product_id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const total = items.reduce((s, i) => s + i.sale_price * i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, total }}>{children}</Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
