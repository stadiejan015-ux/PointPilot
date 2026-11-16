import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid place-items-start gap-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Seite nicht gefunden</h1>
      <p className="text-muted-foreground">Diese Adresse gibt es in PointPilot nicht.</p>
      <Button asChild>
        <Link href="/">Zum Dashboard</Link>
      </Button>
    </div>
  );
}
