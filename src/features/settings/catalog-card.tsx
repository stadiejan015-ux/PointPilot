"use client";

import { ArrowRight } from "lucide-react";
import { SourceLine } from "@/components/shared/source-line";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findProgram } from "@/core/catalog";
import { formatPoints, formatRatio } from "@/core/format";
import { useAppData } from "@/hooks/use-app-data";

/** Transfer-Tabelle aus dem Repo – nur lesend. Gepflegt wird in data/transfers.json. */
export function CatalogCard() {
  const { catalog } = useAppData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer-Tabelle</CardTitle>
        <CardDescription>
          Aus dem Repo (data/transfers.json). Änderungen dort vornehmen – nach dem nächsten Deploy erscheinen sie hier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {catalog.routes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Routen hinterlegt.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {catalog.routes.map((route) => {
              const from = findProgram(catalog, route.from);
              const to = findProgram(catalog, route.to);
              return (
                <li key={route.id} className="grid gap-2 py-3.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-medium">
                      {from?.name ?? route.from}
                      <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {to?.name ?? route.to}
                    </span>
                    <VerificationBadge verified={route.verified} />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
                    <span>
                      Verhältnis:{" "}
                      <span className="tabular whitespace-nowrap text-foreground">{route.ratio ? formatRatio(route.ratio) : "leer"}</span>
                    </span>
                    <span>
                      Mindestmenge:{" "}
                      <span className="tabular text-foreground">
                        {route.minAmount !== null ? formatPoints(route.minAmount) : "–"}
                      </span>
                    </span>
                    {route.step !== null ? (
                      <span>
                        Schritte: <span className="tabular text-foreground">{formatPoints(route.step)}</span>
                      </span>
                    ) : null}
                  </div>
                  <SourceLine source={route.source} asOf={route.asOf} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
