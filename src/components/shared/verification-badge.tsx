import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge variant="success">
      <ShieldCheck /> verifiziert
    </Badge>
  ) : (
    <Badge variant="warning">
      <ShieldAlert /> nicht verifiziert
    </Badge>
  );
}
