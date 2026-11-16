"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Info, XCircle } from "lucide-react";
import { DetailList, DetailRow } from "@/components/shared/detail-list";
import { Field } from "@/components/shared/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  estimateValueCents,
  programSettingsFor,
  rateRedemption,
  valuePerPointCents,
  type RedemptionRating,
} from "@/core/calc";
import { findProgram } from "@/core/catalog";
import {
  eurosToCents,
  formatCentsPerPoint,
  formatEuroFromCents,
  formatPercent,
  formatPoints,
  parseDecimal,
  parseWholeNumber,
} from "@/core/format";
import type { Balances, Settings } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";
import { singularUnit } from "@/lib/units";
import { NothingExecutedNote } from "./nothing-executed-note";

const RATING_UI: Record<
  Exclude<RedemptionRating, "no-threshold">,
  { label: string; className: string; icon: React.ReactNode }
> = {
  good: {
    label: "Lohnt sich",
    className: "border-success/35 bg-success/10 text-success",
    icon: <CheckCircle2 className="size-7" />,
  },
  borderline: {
    label: "Grenzwertig",
    className: "border-warning/35 bg-warning/10 text-warning",
    icon: <CircleAlert className="size-7" />,
  },
  poor: {
    label: "Schlechte Einlösung",
    className: "border-danger/35 bg-danger/10 text-danger",
    icon: <XCircle className="size-7" />,
  },
};

export function RedemptionCalculator({ balances, settings }: { balances: Balances; settings: Settings }) {
  const { catalog } = useAppData();
  const defaultProgram = catalog.programs.find((p) => p.id === "miles-and-more") ?? catalog.programs[0];
  const [programId, setProgramId] = React.useState(defaultProgram?.id ?? "");
  const [cashText, setCashText] = React.useState("");
  const [pointsText, setPointsText] = React.useState("");
  const [copayText, setCopayText] = React.useState("");

  const program = findProgram(catalog, programId);
  const unit = program?.unit ?? "Punkte";
  const perUnit = program ? singularUnit(program) : "Punkt";
  const programSettings = programSettingsFor(settings, programId);

  const cash = parseDecimal(cashText);
  const points = parseWholeNumber(pointsText);
  const copay = copayText.trim() === "" ? 0 : parseDecimal(copayText);

  const cashError = cashText.trim() !== "" && cash === null ? "Bitte einen Betrag eingeben, z. B. 450 oder 449,90." : null;
  const pointsError =
    pointsText.trim() !== "" && (points === null || points === 0) ? "Bitte eine ganze Zahl größer 0 eingeben." : null;
  const copayError = copayText.trim() !== "" && copay === null ? "Bitte einen Betrag eingeben, z. B. 89,90." : null;

  const value =
    cash !== null && points !== null && copay !== null
      ? valuePerPointCents({ cashPriceCents: eurosToCents(cash), points, copayCents: eurosToCents(copay) })
      : null;
  const valueOk = value?.ok ? value : null;
  const assessment = valueOk
    ? rateRedemption(valueOk.valueCents, programSettings.minRedemptionCents, settings.borderlineTolerancePct)
    : null;
  const ownValueCents = points !== null ? estimateValueCents(points, programSettings.pointValueCents) : null;
  const balance = balances[programId] ?? 0;

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>Einlösung bewerten</CardTitle>
          <CardDescription>Wert pro {perUnit} = (Cash-Preis − Zuzahlung) / benötigte {unit}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field id="red-program" label="Programm">
            <NativeSelect id="red-program" value={programId} onChange={(e) => setProgramId(e.target.value)}>
              {catalog.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            id="red-cash"
            label="Cash-Preis (€)"
            hint="Was die Leistung regulär kosten würde."
            error={cashError}
          >
            <Input
              id="red-cash"
              inputMode="decimal"
              autoComplete="off"
              placeholder="z. B. 450"
              value={cashText}
              onChange={(e) => setCashText(e.target.value)}
              aria-invalid={cashError ? true : undefined}
              className="tabular"
            />
          </Field>
          <Field id="red-points" label={`Benötigte ${unit}`} error={pointsError}>
            <Input
              id="red-points"
              inputMode="numeric"
              autoComplete="off"
              placeholder="z. B. 30.000"
              value={pointsText}
              onChange={(e) => setPointsText(e.target.value)}
              aria-invalid={pointsError ? true : undefined}
              className="tabular"
            />
          </Field>
          <Field
            id="red-copay"
            label="Zuzahlung (€)"
            hint="Steuern, Gebühren, Zuschläge. Leer = 0 €."
            error={copayError}
          >
            <Input
              id="red-copay"
              inputMode="decimal"
              autoComplete="off"
              placeholder="z. B. 89,90"
              value={copayText}
              onChange={(e) => setCopayText(e.target.value)}
              aria-invalid={copayError ? true : undefined}
              className="tabular"
            />
          </Field>
        </CardContent>
      </Card>

      <Card aria-live="polite">
        <CardHeader>
          <CardTitle>Bewertung</CardTitle>
          {!valueOk ? <CardDescription>Cash-Preis und benötigte {unit} eingeben.</CardDescription> : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border border-border/80 bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Wert pro {perUnit}</p>
            <p className="tabular mt-1 text-4xl font-semibold tracking-tight">
              {valueOk ? formatCentsPerPoint(valueOk.valueCents) : "–"}
            </p>
          </div>

          {assessment && assessment.rating !== "no-threshold" ? (
            <div
              className={cn("flex items-center gap-3 rounded-lg border p-4", RATING_UI[assessment.rating].className)}
              role="status"
            >
              {RATING_UI[assessment.rating].icon}
              <div>
                <p className="text-lg font-semibold">{RATING_UI[assessment.rating].label}</p>
                <p className="text-sm text-foreground/75">
                  Dein Mindestwert: {formatCentsPerPoint(programSettings.minRedemptionCents ?? 0)}
                </p>
              </div>
            </div>
          ) : null}

          {assessment?.rating === "no-threshold" ? (
            <Alert variant="info">
              <Info />
              <AlertTitle>Kein Mindestwert für {program?.name}</AlertTitle>
              <AlertDescription>
                <p>
                  Ohne Mindestwert keine Bewertung.{" "}
                  <Link href="/einstellungen/" className="text-primary underline underline-offset-4">
                    In den Einstellungen festlegen
                  </Link>
                </p>
              </AlertDescription>
            </Alert>
          ) : null}

          {valueOk ? (
            <DetailList>
              <DetailRow label="Gesparter Betrag">{formatEuroFromCents(valueOk.savedCents)}</DetailRow>
              {assessment && assessment.lowerBoundCents !== null && assessment.upperBoundCents !== null ? (
                <DetailRow label={`Grenzwertig (± ${formatPercent(settings.borderlineTolerancePct)})`}>
                  {formatCentsPerPoint(assessment.lowerBoundCents)} – {formatCentsPerPoint(assessment.upperBoundCents)}
                </DetailRow>
              ) : null}
              {ownValueCents !== null && points !== null ? (
                <DetailRow label={`${formatPoints(points)} ${unit} zu deinem Punktwert`}>
                  {formatEuroFromCents(ownValueCents)}
                </DetailRow>
              ) : null}
            </DetailList>
          ) : null}

          {valueOk && valueOk.savedCents < 0 ? (
            <p className="text-sm text-danger">Die Zuzahlung ist höher als der Cash-Preis.</p>
          ) : null}

          {points !== null && points > balance ? (
            <p className="text-sm text-muted-foreground">
              Dein Stand: {formatPoints(balance)} {unit} – es fehlen {formatPoints(points - balance)}. Der Ziel-Rechner
              zeigt, woher du sie übertragen könntest.
            </p>
          ) : null}

          <NothingExecutedNote />
        </CardContent>
      </Card>
    </div>
  );
}
