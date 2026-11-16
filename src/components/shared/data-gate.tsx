"use client";

import * as React from "react";
import { AlertTriangle, Download, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toDateInputValue } from "@/core/format";
import type { AppData } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { downloadTextFile } from "@/lib/download";

/** Zeigt Inhalte erst, wenn die Daten geladen sind – sonst Platzhalter oder Fehlerhilfe. */
export function DataGate({ children }: { children: (data: AppData) => React.ReactNode }) {
  const { state, actions } = useAppData();
  const [confirmReset, setConfirmReset] = React.useState(false);

  if (state.status === "loading") {
    return (
      <div className="grid gap-4" aria-busy="true" aria-label="Daten werden geladen">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (state.status === "error") {
    const canReset = state.error.kind === "corrupt";
    return (
      <div className="grid gap-4">
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Daten konnten nicht geladen werden</AlertTitle>
          <AlertDescription>
            <p>{state.error.message}</p>
            {state.error.kind === "unavailable" ? (
              <p>
                Prüfe, ob der Browser Website-Daten erlaubt (kein privater Modus). Die Rechner brauchen gespeicherte
                Daten für deine Stände.
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
        {canReset ? (
          <div className="flex flex-wrap gap-2">
            {state.raw ? (
              <Button
                variant="outline"
                onClick={() =>
                  downloadTextFile(`pointpilot-rohdaten-${toDateInputValue(new Date())}.txt`, state.raw ?? "", "text/plain")
                }
              >
                <Download /> Rohdaten sichern
              </Button>
            ) : null}
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>
              <RotateCcw /> Auf Startwerte zurücksetzen
            </Button>
            <ConfirmDialog
              open={confirmReset}
              onOpenChange={setConfirmReset}
              title="Auf Startwerte zurücksetzen?"
              description="Die beschädigten Daten werden überschrieben. Sichere vorher die Rohdaten, falls du sie noch brauchst."
              confirmLabel="Zurücksetzen"
              destructive
              onConfirm={actions.reset}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return <>{children(state.data)}</>;
}
