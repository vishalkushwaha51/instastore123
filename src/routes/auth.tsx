import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Seller sign in — InstaStore" },
      { name: "description", content: "Sign in to manage your store, products and orders." },
      { property: "og:title", content: "Seller sign in — InstaStore" },
      { property: "og:description", content: "Sign in to manage your store, products and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    if (!res.data.session) return toast.success("Check your email to confirm your account, then sign in.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-3xl tracking-[0.2em]">VIRA</Link>
        <h1 className="mt-8 text-4xl">{mode === "in" ? "Seller sign in" : "Create seller account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage products, orders and your store.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-ring" />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-ring" />
          <button disabled={busy} className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          {mode === "in" ? "New seller? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
