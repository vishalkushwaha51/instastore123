import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { myStoreQuery } from "@/lib/seller";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(myStoreQuery),
  component: SettingsPage,
});

const fields = [
  { key: "name", label: "Store name" },
  { key: "tagline", label: "Tagline (home page headline)" },
  { key: "description", label: "Description", area: true },
  { key: "logo_url", label: "Logo link" },
  { key: "instagram_url", label: "Instagram link" },
  { key: "whatsapp_number", label: "WhatsApp number (with country code, e.g. 919876543210)" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address", area: true },
  { key: "maps_url", label: "Google Maps link" },
] as const;
type Key = (typeof fields)[number]["key"] | "accent_color";

function SettingsPage() {
  const { data: store } = useSuspenseQuery(myStoreQuery);
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<Key, string>>(() => {
    const f = {} as Record<Key, string>;
    fields.forEach((x) => (f[x.key] = (store[x.key] as string | null) ?? ""));
    f.accent_color = store.accent_color ?? "#B5654A";
    return f;
  });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Store name is required"); return; }
    setBusy(true);
    const values = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() || null]));
    const { error } = await supabase.from("stores").update({ ...values, name: form.name.trim() }).eq("id", store.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Store settings saved");
    qc.invalidateQueries({ queryKey: ["my-store"] });
    qc.invalidateQueries({ queryKey: ["store"] });
  }

  const input = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring";
  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <h1 className="text-3xl sm:text-4xl">Store settings</h1>
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        {fields.map((f) => (
          <label key={f.key} className="block text-sm">
            {f.label}
            {"area" in f ? (
              <textarea rows={3} className={input} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            ) : (
              <input className={input} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            )}
          </label>
        ))}
        <label className="flex items-center gap-3 text-sm">
          Accent colour
          <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-9 w-14 cursor-pointer rounded border border-input" />
        </label>
      </div>
      <button disabled={busy} className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {busy ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
