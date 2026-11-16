import type * as React from "react";
import { cn } from "@/lib/utils";

export function DetailList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <dl className={cn("divide-y divide-border/70 text-sm", className)}>{children}</dl>;
}

export function DetailRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular text-right font-medium">{children}</dd>
    </div>
  );
}
