import { inr } from "@/lib/store";

export function OrderTotals({ subtotal, total }: { subtotal: number; total: number }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (MRP)</span><span>{inr(subtotal)}</span></div>
      <div className="flex justify-between text-accent"><span>Discount</span><span>−{inr(subtotal - total)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>Free</span></div>
      <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>{inr(total)}</span></div>
    </div>
  );
}

