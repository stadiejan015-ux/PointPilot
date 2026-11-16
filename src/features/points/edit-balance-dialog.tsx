"use client";

import * as React from "react";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { allowedTypesForDelta, deltaForNewBalance } from "@/core/calc";
import { dateInputToIso, formatPoints, formatSignedPoints, parseWholeNumber, toDateInputValue } from "@/core/format";
import { TRANSACTION_TYPE_LABELS, type Program, type TransactionType } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";

/**
 * Stand direkt bearbeiten. Gespeichert wird die Differenz als Buchung.
 */
export function EditBalanceDialog({
  program,
  currentBalance,
  open,
  onOpenChange,
}: {
  program: Program;
  currentBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { catalog, actions } = useAppData();
  const [balanceText, setBalanceText] = React.useState("");
  const [type, setType] = React.useState<TransactionType | "">("");
  const [dateText, setDateText] = React.useState("");
  const [note, setNote] = React.useState("");
  const [counterpart, setCounterpart] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setBalanceText(formatPoints(currentBalance));
    setType("");
    setDateText(toDateInputValue(new Date()));
    setNote("");
    setCounterpart("");
    setError(null);
  }, [open, currentBalance]);

  const parsed = parseWholeNumber(balanceText);
  const check = parsed === null ? null : deltaForNewBalance(currentBalance, parsed);
  const delta = check?.ok ? check.delta : 0;
  const allowed = allowedTypesForDelta(delta);
  const effectiveType: TransactionType | null = type && allowed.includes(type) ? type : (allowed[0] ?? null);

  let balanceError: string | null = null;
  if (balanceText.trim() !== "" && parsed === null) balanceError = "Bitte eine ganze Zahl eingeben, z. B. 6.000.";
  else if (check && !check.ok && check.reason === "negative") balanceError = "Der Stand kann nicht negativ sein.";

  const today = toDateInputValue(new Date());
  const occurredAt = dateInputToIso(dateText, new Date());
  const dateError = occurredAt === null ? "Bitte ein gültiges Datum wählen." : dateText > today ? "Das Datum liegt in der Zukunft." : null;

  const canSave = check?.ok === true && effectiveType !== null && dateError === null && !saving;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || parsed === null || occurredAt === null || effectiveType === null) return;
    setSaving(true);
    setError(null);
    try {
      await actions.recordBalanceChange({
        programId: program.id,
        newBalance: parsed,
        type: effectiveType,
        occurredAt,
        note: note.trim() || undefined,
        counterpartProgramId: effectiveType === "transferred" && counterpart ? counterpart : undefined,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  const otherPrograms = catalog.programs.filter((p) => p.id !== program.id);
  const fieldId = (name: string) => `edit-${program.id}-${name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSave} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{program.name}: Stand ändern</DialogTitle>
            <DialogDescription>
              Aktuell {formatPoints(currentBalance)} {program.unit}. Gespeichert wird die Differenz als Buchung.
            </DialogDescription>
          </DialogHeader>

          <Field id={fieldId("balance")} label={`Neuer Stand (${program.unit})`} error={balanceError}>
            <Input
              id={fieldId("balance")}
              inputMode="numeric"
              autoComplete="off"
              value={balanceText}
              onChange={(e) => setBalanceText(e.target.value)}
              onFocus={(e) => e.target.select()}
              aria-invalid={balanceError ? true : undefined}
              className="tabular text-lg md:text-lg"
            />
          </Field>

          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              delta > 0 && "border-success/30 bg-success/8",
              delta < 0 && "border-border bg-muted/60",
              delta === 0 && "border-dashed border-border text-muted-foreground",
            )}
            aria-live="polite"
          >
            {delta === 0 ? (
              "Keine Änderung"
            ) : (
              <>
                Änderung:{" "}
                <span className={cn("tabular font-semibold", delta > 0 ? "text-success" : "text-foreground")}>
                  {formatSignedPoints(delta)} {program.unit}
                </span>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={fieldId("type")} label="Art">
              <NativeSelect
                id={fieldId("type")}
                value={effectiveType ?? ""}
                onChange={(e) => setType(e.target.value as TransactionType)}
                disabled={allowed.length === 0}
              >
                {allowed.length === 0 ? <option value="">–</option> : null}
                {allowed.map((t) => (
                  <option key={t} value={t}>
                    {TRANSACTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id={fieldId("date")} label="Datum" error={dateError}>
              <Input
                id={fieldId("date")}
                type="date"
                max={today}
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                aria-invalid={dateError ? true : undefined}
              />
            </Field>
          </div>

          {effectiveType === "transferred" ? (
            <Field
              id={fieldId("counterpart")}
              label={delta < 0 ? "Übertragen an (optional)" : "Übertragen von (optional)"}
              hint="Nur ein Verweis. Den Stand im anderen Programm änderst du dort separat."
            >
              <NativeSelect id={fieldId("counterpart")} value={counterpart} onChange={(e) => setCounterpart(e.target.value)}>
                <option value="">– keine Angabe –</option>
                {otherPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : null}

          <Field id={fieldId("note")} label="Notiz (optional)">
            <Input
              id={fieldId("note")}
              value={note}
              maxLength={500}
              placeholder="z. B. Einkauf, Prämienflug FRA–LIS"
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!canSave}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
