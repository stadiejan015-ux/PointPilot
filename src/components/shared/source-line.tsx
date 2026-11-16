import { ExternalLink } from "lucide-react";
import { formatAsOf } from "@/core/format";

/** Quelle + Stand-Datum einer Katalogangabe. */
export function SourceLine({ source, asOf }: { source: string | null; asOf: string | null }) {
  if (!source && !asOf) return <span className="text-muted-foreground">Keine Quelle hinterlegt</span>;
  let host: string | null = null;
  if (source) {
    try {
      host = new URL(source).hostname.replace(/^www\./, "");
    } catch {
      host = source;
    }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground">
      {source ? (
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          {host}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      ) : (
        <span>ohne Quelle</span>
      )}
      {asOf ? <span>· Stand {formatAsOf(asOf)}</span> : null}
    </span>
  );
}
