const tone: Record<string, string> = {
  "Order Received": "bg-accent/15 text-accent",
  Confirmed: "bg-secondary text-foreground",
  Packed: "bg-secondary text-foreground",
  Shipped: "bg-primary/10 text-foreground",
  Delivered: "bg-success/15 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tone[status] ?? "bg-secondary"}`}>{status}</span>;
}
