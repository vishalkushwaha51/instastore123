import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { discountPct, inr, type Product } from "@/lib/store";
import { myProductsQuery, myStoreQuery } from "@/lib/seller";

export const Route = createFileRoute("/_authenticated/dashboard/products")({
  loader: async ({ context }) => {
    const s = await context.queryClient.ensureQueryData(myStoreQuery);
    await context.queryClient.ensureQueryData(myProductsQuery(s.id));
  },
  component: ProductsPage,
});

type Draft = {
  id?: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  mrp: string;
  sale_price: string;
  stock: string;
  is_listed: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
};
const empty: Draft = { name: "", description: "", category: "", image_url: "", mrp: "", sale_price: "", stock: "0", is_listed: true, is_featured: false, is_best_seller: false };

function ProductsPage() {
  const { data: store } = useSuspenseQuery(myStoreQuery);
  const { data: products } = useSuspenseQuery(myProductsQuery(store.id));
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  async function patch(p: Product, values: Partial<Product>) {
    const { error } = await supabase.from("products").update(values).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const mrp = Number(draft.mrp), sale = Number(draft.sale_price), stock = parseInt(draft.stock, 10);
    if (!draft.name.trim()) return toast.error("Add a product name");
    if (!(mrp > 0) || !(sale > 0)) return toast.error("Enter MRP and sale price");
    if (sale > mrp) return toast.error("Sale price can't be higher than MRP");
    if (isNaN(stock) || stock < 0) return toast.error("Stock must be 0 or more");
    setSaving(true);
    const values = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      category: draft.category.trim() || "General",
      image_url: draft.image_url.trim() || null,
      mrp, sale_price: sale, stock,
      is_listed: draft.is_listed, is_featured: draft.is_featured, is_best_seller: draft.is_best_seller,
    };
    const { error } = draft.id
      ? await supabase.from("products").update(values).eq("id", draft.id)
      : await supabase.from("products").insert({ ...values, store_id: store.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(draft.id ? "Product updated" : "Product added");
    setDraft(null);
    refresh();
  }

  const input = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl">Products</h1>
        <button onClick={() => setDraft(empty)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-4">Product</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Listed</th><th className="p-4" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-14 w-12 rounded-lg object-cover" /> : <div className="h-14 w-12 rounded-lg bg-muted" />}
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}{p.is_featured ? " · Featured" : ""}{p.is_best_seller ? " · Best seller" : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-medium">{inr(p.sale_price)}</p>
                  <p className="text-xs text-muted-foreground"><span className="line-through">{inr(p.mrp)}</span> · {discountPct(+p.mrp, +p.sale_price)}% off</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={0} defaultValue={p.stock} key={p.stock}
                      onBlur={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 0 && v !== p.stock) patch(p, { stock: v }); }}
                      className="w-20 rounded-lg border border-input bg-background px-2 py-1.5"
                      aria-label={`Stock for ${p.name}`}
                    />
                    {p.stock > 0 ? (
                      <button onClick={() => patch(p, { stock: 0 })} className="text-xs text-muted-foreground underline hover:text-foreground">Mark sold out</button>
                    ) : (
                      <span className="text-xs font-medium text-destructive">Sold out</span>
                    )}
                  </div>
                </td>
                <td className="p-4"><Switch checked={p.is_listed} onCheckedChange={(v) => patch(p, { is_listed: v })} aria-label="Listed" /></td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <button aria-label="Edit" onClick={() => setDraft({ id: p.id, name: p.name, description: p.description ?? "", category: p.category, image_url: p.image_url ?? "", mrp: String(p.mrp), sale_price: String(p.sale_price), stock: String(p.stock), is_listed: p.is_listed, is_featured: p.is_featured, is_best_seller: p.is_best_seller })} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                    <button aria-label="Delete" onClick={() => remove(p)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No products yet. Add your first one.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{draft?.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
          {draft && (
            <form onSubmit={save} className="space-y-3">
              <label className="block text-sm">Name<input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
              <label className="block text-sm">Description<textarea rows={3} className={input} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">Category<input className={input} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Tops" /></label>
                <label className="block text-sm">Stock<input type="number" min={0} className={input} value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /></label>
                <label className="block text-sm">MRP (₹)<input type="number" min={0} className={input} value={draft.mrp} onChange={(e) => setDraft({ ...draft, mrp: e.target.value })} /></label>
                <label className="block text-sm">Sale price (₹)<input type="number" min={0} className={input} value={draft.sale_price} onChange={(e) => setDraft({ ...draft, sale_price: e.target.value })} /></label>
              </div>
              {Number(draft.mrp) > 0 && Number(draft.sale_price) > 0 && (
                <p className="text-sm text-accent">Discount: {discountPct(Number(draft.mrp), Number(draft.sale_price))}% off</p>
              )}
              <label className="block text-sm">Image link<input className={input} value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://…" /></label>
              {draft.image_url && <img src={draft.image_url} alt="" className="h-28 w-24 rounded-lg object-cover" />}
              <div className="space-y-2 pt-2">
                {([["is_listed", "Listed in store"], ["is_featured", "Featured on home page"], ["is_best_seller", "Best seller"]] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center justify-between text-sm">{l}<Switch checked={draft[k]} onCheckedChange={(v) => setDraft({ ...draft, [k]: v })} /></label>
                ))}
              </div>
              <button disabled={saving} className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {saving ? "Saving…" : "Save product"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
