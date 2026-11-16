"use client";

import * as React from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import { Field } from "@/components/shared/field";
import { ProgramLabel } from "@/components/shared/program-label";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { calculateGoal, type GoalSourceOption } from "@/core/calc";
import { findProgram } from "@/core/catalog";
import { formatPoints, formatRatio, parseWholeNumber } from "@/core/format";
import type { Balances, Program } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";
import { NothingExecutedNote } from "./nothing-executed-note";

export function GoalCalculator({ balances }: { balances: Balances }) {
  const { catalog } = useAppData();
  const defaultTarget = catalog.programs.find((p) => p.id === "miles-and-more") ?? catalog.programs[0];
  const [targetId, setTargetId] = React.useState(defaultTarget?.id ?? "");
  const [amountText, setAmountText] = React.useState("10.000");

  const target = findProgram(catalog, targetId);
  const amount = parseWholeNumber(amountText);
  const amountError =
    amountText.trim() !== "" && (amount === null || amount === 0)
      ? "Bitte eine ganze Zahl größer 0 eingeben, z. B. 10.000."
      : null;
  const result =
    amount !== null && amount > 0
      ? calculateGoal({ targetProgramId: targetId, targetAmount: amount, balances, routes: catalog.routes })
      : null;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Ziel festlegen</CardTitle>
          <CardDescription>Welche deiner Programme können laut Transfer-Tabelle dorthin übertragen?</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="goal-target" label="Zielprogramm">
            <NativeSelect id="goal-target" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              {catalog.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="goal-amount" label={`Zielmenge (${target?.unit ?? "Punkte"})`} error={amountError}>
            <Input
              id="goal-amount"
              inputMode="numeric"
              autoComplete="off"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              onFocus={(e) => e.target.select()}
              aria-invalid={amountError ? true : undefined}
              className="tabular"
            />
          </Field>
        </CardContent>
      </Card>

      {result && target ? (
        <div className="grid gap-5" aria-live="polite">
          <Card className="gap-3">
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Stat label="Zielmenge" value={formatPoints(result.targetAmount)} unit={target.unit} />
              <Stat label={`Aktuell bei ${target.name}`} value={formatPoints(result.currentInTarget)} unit={target.unit} />
              <Stat
                label="Fehlt ohne Transfer"
                value={formatPoints(result.missingWithoutTransfer)}
                unit={target.unit}
                tone={result.missingWithoutTransfer === 0 ? "success" : undefined}
              />
            </CardContent>
            <CardContent>
              <Progress value={result.currentInTarget} max={result.targetAmount} />
            </CardContent>
          </Card>

          {result.reachedAlready ? (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>Ziel bereits erreicht</AlertTitle>
              <AlertDescription>
                <p>Du hast schon genug {target.unit} – kein Transfer nötig.</p>
              </AlertDescription>
            </Alert>
          ) : null}

          {result.options.length === 0 ? (
            <Alert>
              <Info />
              <AlertTitle>Keine Route zu {target.name}</AlertTitle>
              <AlertDescription>
                <p>Laut Transfer-Tabelle kann keines deiner Programme zu {target.name} übertragen.</p>
              </AlertDescription>
            </Alert>
          ) : (
            <section className="grid gap-3" aria-label="Mögliche Quellen">
              <h3 className="text-sm font-medium text-muted-foreground">Mögliche Quellen</h3>
              <div className={cn("grid gap-3", result.options.length > 1 && "md:grid-cols-2")}>
                {result.options.map((option) => (
                  <SourceOptionCard
                    key={option.route.id}
                    option={option}
                    source={findProgram(catalog, option.sourceProgramId)}
                    target={target}
                    targetAmount={result.targetAmount}
                    reachedAlready={result.reachedAlready}
                  />
                ))}
              </div>
            </section>
          )}

          {result.combined && result.combined.sourceProgramIds.length > 1 ? (
            <Card className="gap-3 border-primary/30">
              <CardHeader>
                <CardTitle>Alle berechenbaren Quellen zusammen</CardTitle>
                <CardDescription>
                  {result.combined.sourceProgramIds.map((id) => findProgram(catalog, id)?.name ?? id).join(" + ")} –
                  erst in {target.unit} umgerechnet, dann addiert.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat label="Kommt an" value={`+${formatPoints(result.combined.pointsReceived)}`} unit={target.unit} />
                  <Stat label="Danach" value={formatPoints(result.combined.totalAfter)} unit={target.unit} />
                  <Stat
                    label="Fehlt noch"
                    value={formatPoints(result.combined.stillMissing)}
                    unit={target.unit}
                    tone={result.combined.stillMissing === 0 ? "success" : undefined}
                  />
                </div>
                <Progress value={result.combined.totalAfter} max={result.targetAmount} />
                {result.combined.includesUnverified ? (
                  <p className="text-xs text-warning">Enthält nicht verifizierte Verhältnisse.</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <NothingExecutedNote />
        </div>
      ) : null}
    </div>
  );
}

function SourceOptionCard({
  option,
  source,
  target,
  targetAmount,
  reachedAlready,
}: {
  option: GoalSourceOption;
  source: Program | undefined;
  target: Program;
  targetAmount: number;
  reachedAlready: boolean;
}) {
  const unit = source?.unit ?? "Punkte";
  const { route } = option;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">
          {source ? <ProgramLabel program={source} /> : option.sourceProgramId}
        </CardTitle>
        <CardDescription className="tabular">
          Stand {formatPoints(option.sourceBalance)} {unit}
          {route.ratio ? (
            <>
              {" · "}
              <span className="whitespace-nowrap">Verhältnis {formatRatio(route.ratio)}</span>
            </>
          ) : null}
        </CardDescription>
        <CardAction>
          <VerificationBadge verified={route.verified} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 text-sm">
        {option.status === "ratio-unknown" ? (
          <p className="flex items-start gap-2 text-warning">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            Verhältnis fehlt in der Transfer-Tabelle – keine Berechnung möglich.
          </p>
        ) : null}

        {option.status === "no-balance" ? (
          <p className="text-muted-foreground">Kein Stand vorhanden.</p>
        ) : null}

        {option.status === "below-minimum" ? (
          <p className="flex items-start gap-2 text-muted-foreground">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            Stand unter der Mindestmenge von {formatPoints(option.transfer?.effectiveMinimum ?? 0)} {unit}.
          </p>
        ) : null}

        {option.status === "ok" && option.pointsReceived !== null && option.totalAfter !== null ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">Ganzer Stand übertragen</span>
              <span className="tabular font-semibold text-success">
                +{formatPoints(option.pointsReceived)} {target.unit}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">Danach bei {target.name}</span>
              <span className="tabular font-medium">
                {formatPoints(option.totalAfter)} {target.unit}
              </span>
            </div>
            <Progress value={option.totalAfter} max={targetAmount} />
            {option.stillMissing === 0 ? (
              <Badge variant="success">
                <CheckCircle2 /> Ziel erreicht
              </Badge>
            ) : (
              <p className="tabular">
                Es fehlen noch{" "}
                <span className="font-semibold">
                  {formatPoints(option.stillMissing ?? 0)} {target.unit}
                </span>
              </p>
            )}
            {option.transfer && option.transfer.remainder > 0 ? (
              <p className="text-xs text-muted-foreground">
                {formatPoints(option.transfer.remainder)} {unit} bleiben wegen der Schrittweite übrig.
              </p>
            ) : null}
          </>
        ) : null}

        {!reachedAlready && option.sourceNeededForGap !== null && option.sourceNeededForGap > 0 ? (
          <p
            className={cn(
              "rounded-md border px-3 py-2 text-xs leading-relaxed",
              option.coversGap ? "border-success/25 bg-success/8" : "border-border bg-muted/50 text-muted-foreground",
            )}
          >
            Für die ganze Lücke bräuchtest du{" "}
            <span className="tabular font-semibold text-foreground">
              {formatPoints(option.sourceNeededForGap)} {unit}
            </span>
            {option.coversGap ? " – dein Stand reicht." : ` – du hast ${formatPoints(option.sourceBalance)}.`}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: "success" }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-1 truncate text-xl font-semibold tracking-tight", tone === "success" && "text-success")}>
        {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn("h-full rounded-full transition-[width]", pct >= 100 ? "bg-success" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
