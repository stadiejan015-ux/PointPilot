"use client";

import * as React from "react";
import { ArrowDown, ArrowRight, CircleAlert, Info, ShieldAlert } from "lucide-react";
import { DetailList, DetailRow } from "@/components/shared/detail-list";
import { Field } from "@/components/shared/field";
import { ProgramLabel } from "@/components/shared/program-label";
import { SourceLine } from "@/components/shared/source-line";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { calculateTransfer } from "@/core/calc";
import { findProgram, findRoute, routesFrom } from "@/core/catalog";
import { formatPoints, formatRatio, parseWholeNumber } from "@/core/format";
import type { Balances } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { NothingExecutedNote } from "./nothing-executed-note";

export function TransferCalculator({ balances }: { balances: Balances }) {
  const { catalog } = useAppData();
  const sources = catalog.programs.filter((p) => routesFrom(catalog, p.id).length > 0);

  const [sourceId, setSourceId] = React.useState(sources[0]?.id ?? "");
  const targets = routesFrom(catalog, sourceId)
    .map((r) => findProgram(catalog, r.to))
    .filter((p) => p !== undefined);
  const [targetId, setTargetId] = React.useState(targets[0]?.id ?? "");
  const [amountText, setAmountText] = React.useState(() => formatPoints(balances[sources[0]?.id ?? ""] ?? 0));

  if (sources.length === 0) {
    return (
      <Alert>
        <Info />
        <AlertTitle>Keine Transfer-Routen hinterlegt</AlertTitle>
        <AlertDescription>Trag Routen in data/transfers.json ein.</AlertDescription>
      </Alert>
    );
  }

  const effectiveTargetId = targets.some((t) => t.id === targetId) ? targetId : (targets[0]?.id ?? "");
  const source = findProgram(catalog, sourceId);
  const target = findProgram(catalog, effectiveTargetId);
  const route = findRoute(catalog, sourceId, effectiveTargetId);
  const sourceBalance = balances[sourceId] ?? 0;

  const amount = parseWholeNumber(amountText);
  const amountError =
    amountText.trim() !== "" && amount === null ? "Bitte eine ganze Zahl eingeben, z. B. 5.822." : null;
  const result = route && amount !== null ? calculateTransfer(route, amount) : null;

  function changeSource(id: string) {
    setSourceId(id);
    setAmountText(formatPoints(balances[id] ?? 0));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>Transfer berechnen</CardTitle>
          <CardDescription>Quelle, Ziel und Menge – laut Transfer-Tabelle.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <Field id="transfer-source" label="Von">
              <NativeSelect id="transfer-source" value={sourceId} onChange={(e) => changeSource(e.target.value)}>
                {sources.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <ArrowRight className="hidden size-4 self-center text-muted-foreground sm:mb-3.5 sm:block sm:self-end" />
            <Field id="transfer-target" label="Nach">
              <NativeSelect id="transfer-target" value={effectiveTargetId} onChange={(e) => setTargetId(e.target.value)}>
                {targets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field
            id="transfer-amount"
            label={`Menge (${source?.unit ?? "Punkte"})`}
            error={amountError}
            hint={`Dein Stand: ${formatPoints(sourceBalance)} ${source?.unit ?? ""}`}
          >
            <div className="flex gap-2">
              <Input
                id="transfer-amount"
                inputMode="numeric"
                autoComplete="off"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                onFocus={(e) => e.target.select()}
                aria-invalid={amountError ? true : undefined}
                className="tabular"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setAmountText(formatPoints(sourceBalance))}
              >
                Ganzer Stand
              </Button>
            </div>
          </Field>
        </CardContent>
      </Card>

      {route && source && target ? (
        <Card aria-live="polite">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Ergebnis <VerificationBadge verified={route.verified} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1 rounded-lg border border-border/80 bg-muted/40 p-4">
              <p className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <ProgramLabel program={source} />
                <span className="tabular">
                  {result && result.status !== "invalid-amount" ? formatPoints(result.requestedAmount) : "–"} {source.unit}
                </span>
              </p>
              <ArrowDown className="mx-auto my-1 size-4 text-muted-foreground" aria-hidden="true" />
              <p className="flex items-center justify-between gap-2">
                <ProgramLabel program={target} className="text-sm text-muted-foreground" />
                <span className="tabular text-right">
                  <span className="text-3xl font-semibold tracking-tight">
                    {result?.targetPoints != null ? formatPoints(result.targetPoints) : "–"}
                  </span>{" "}
                  <span className="text-sm text-muted-foreground">{target.unit}</span>
                </span>
              </p>
            </div>

            {route.ratio === null ? (
              <Alert variant="warning">
                <CircleAlert />
                <AlertTitle>Verhältnis nicht hinterlegt</AlertTitle>
                <AlertDescription>
                  <p>
                    Für {source.name} → {target.name} fehlt das Transferverhältnis. Trag es nach Prüfung in
                    data/transfers.json ein.
                  </p>
                </AlertDescription>
              </Alert>
            ) : !route.verified ? (
              <Alert variant="warning">
                <ShieldAlert />
                <AlertTitle>Verhältnis nicht verifiziert</AlertTitle>
                <AlertDescription>
                  <p>Prüfe Verhältnis und Mindestmenge beim Anbieter, bevor du überträgst.</p>
                </AlertDescription>
              </Alert>
            ) : null}

            {result?.status === "below-minimum" ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>Unter der Mindestmenge</AlertTitle>
                <AlertDescription>
                  <p>
                    Übertragbar ab {formatPoints(result.effectiveMinimum)} {source.unit}.
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}

            {amount !== null && amount > sourceBalance ? (
              <Alert variant="info">
                <Info />
                <AlertDescription>
                  <p>
                    Mehr als dein Stand ({formatPoints(sourceBalance)} {source.unit}).
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}

            <DetailList>
              <DetailRow label="Verhältnis">{route.ratio ? formatRatio(route.ratio) : "unbekannt"}</DetailRow>
              <DetailRow label="Mindestmenge">
                {route.minAmount !== null ? `${formatPoints(route.minAmount)} ${source.unit}` : "keine Angabe"}
              </DetailRow>
              {route.step !== null ? (
                <DetailRow label="Nur in Schritten von">
                  {formatPoints(route.step)} {source.unit}
                </DetailRow>
              ) : null}
              {result && result.remainder > 0 && result.status !== "below-minimum" ? (
                <DetailRow label="Nicht übertragbarer Rest">
                  {formatPoints(result.remainder)} {source.unit}
                </DetailRow>
              ) : null}
              <DetailRow label="Quelle">
                <SourceLine source={route.source} asOf={route.asOf} />
              </DetailRow>
            </DetailList>

            {route.note ? <p className="text-xs leading-relaxed text-muted-foreground">{route.note}</p> : null}
            <NothingExecutedNote />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
