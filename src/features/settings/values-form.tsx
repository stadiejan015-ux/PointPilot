"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Field } from "@/components/shared/field";
import { ProgramLabel } from "@/components/shared/program-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { programSettingsFor } from "@/core/calc";
import { parseDecimal, toInputDecimal } from "@/core/format";
import type { Settings } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { singularUnit } from "@/lib/units";

type Draft = Record<string, { value: string; min: string }>;

function toDraft(settings: Settings, programIds: string[]): Draft {
  const draft: Draft = {};
  for (const id of programIds) {
    const s = programSettingsFor(settings, id);
    draft[id] = { value: toInputDecimal(s.pointValueCents), min: toInputDecimal(s.minRedemptionCents) };
  }
  return draft;
}

/** Leer → null, sonst nicht negative Zahl. undefined = ungültig. */
function parseOptionalCents(text: string): number | null | undefined {
  if (text.trim() === "") return null;
  const value = parseDecimal(text);
  return value === null ? undefined : value;
}

export function ValuesForm({ settings }: { settings: Settings }) {
  const { catalog, actions } = useAppData();
  const programIds = catalog.programs.map((p) => p.id);
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(settings, programIds));
  const [toleranceText, setToleranceText] = React.useState(() => toInputDecimal(settings.borderlineTolerancePct));
  const [status, setStatus] = React.useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const tolerance = parseDecimal(toleranceText);
  const toleranceError = tolerance === null || tolerance > 100 ? "Bitte eine Zahl zwischen 0 und 100 eingeben." : null;

  const parsed = Object.fromEntries(
    programIds.map((id) => {
      const d = draft[id] ?? { value: "", min: "" };
      return [id, { pointValueCents: parseOptionalCents(d.value), minRedemptionCents: parseOptionalCents(d.min) }];
    }),
  );
  const hasErrors =
    toleranceError !== null ||
    Object.values(parsed).some((p) => p.pointValueCents === undefined || p.minRedemptionCents === undefined);

  function update(id: string, key: "value" | "min", text: string) {
    setDraft((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { value: "", min: "" }), [key]: text } }));
    setStatus("idle");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (hasErrors || tolerance === null) return;
    const programs: Settings["programs"] = { ...settings.programs };
    for (const id of programIds) {
      const p = parsed[id]!;
      programs[id] = { pointValueCents: p.pointValueCents ?? null, minRedemptionCents: p.minRedemptionCents ?? null };
    }
    try {
      await actions.saveSettings({ programs, borderlineTolerancePct: tolerance });
      setStatus("saved");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="grid gap-5">
        <CardHeader>
          <CardTitle>Punktwerte & Mindestwerte</CardTitle>
          <CardDescription>
            In Cent pro Punkt bzw. Meile. Der <strong className="text-foreground/90">Punktwert</strong> ist deine eigene
            Schätzung für das Dashboard. Der <strong className="text-foreground/90">Mindestwert</strong> ist die Grenze,
            ab der sich eine Einlösung für dich lohnt. Leer lassen, wenn du keinen Wert festlegen willst.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {catalog.programs.map((program) => {
            const d = draft[program.id] ?? { value: "", min: "" };
            const p = parsed[program.id]!;
            const per = singularUnit(program);
            return (
              <fieldset
                key={program.id}
                className="grid gap-3 rounded-lg border border-border/80 bg-muted/30 p-4 sm:grid-cols-[minmax(0,12rem)_1fr_1fr] sm:items-start"
              >
                <legend className="sr-only">{program.name}</legend>
                <div className="pt-0.5 sm:pt-8">
                  <ProgramLabel program={program} className="font-medium" />
                </div>
                <Field
                  id={`value-${program.id}`}
                  label={`Punktwert (ct pro ${per})`}
                  error={p.pointValueCents === undefined ? "Ungültige Zahl" : null}
                >
                  <Input
                    id={`value-${program.id}`}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="z. B. 1,0"
                    value={d.value}
                    onChange={(e) => update(program.id, "value", e.target.value)}
                    aria-invalid={p.pointValueCents === undefined ? true : undefined}
                    className="tabular"
                  />
                </Field>
                <Field
                  id={`min-${program.id}`}
                  label={`Mindestwert (ct pro ${per})`}
                  error={p.minRedemptionCents === undefined ? "Ungültige Zahl" : null}
                >
                  <Input
                    id={`min-${program.id}`}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="z. B. 1,2"
                    value={d.min}
                    onChange={(e) => update(program.id, "min", e.target.value)}
                    aria-invalid={p.minRedemptionCents === undefined ? true : undefined}
                    className="tabular"
                  />
                </Field>
              </fieldset>
            );
          })}

          <Field
            id="tolerance"
            label="Zone „grenzwertig“ (± % um den Mindestwert)"
            hint="Beispiel 10 %: Bei 1,0 ct Mindestwert lohnt sich eine Einlösung ab 1,1 ct; unter 0,9 ct ist sie schlecht."
            error={toleranceError}
            className="max-w-md pt-2"
          >
            <Input
              id="tolerance"
              inputMode="decimal"
              autoComplete="off"
              value={toleranceText}
              onChange={(e) => {
                setToleranceText(e.target.value);
                setStatus("idle");
              }}
              aria-invalid={toleranceError ? true : undefined}
              className="tabular"
            />
          </Field>
        </CardContent>
        <CardFooter className="flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={hasErrors}>
            Speichern
          </Button>
          {status === "saved" ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-success" role="status">
              <Check className="size-4" /> Gespeichert
            </span>
          ) : null}
          {status === "error" && error ? <span className="text-sm text-danger">{error}</span> : null}
        </CardFooter>
      </form>
    </Card>
  );
}
