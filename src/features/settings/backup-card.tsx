"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList, DetailRow } from "@/components/shared/detail-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { balancesByProgram } from "@/core/calc";
import { formatDate, formatPoints } from "@/core/format";
import type { BackupFile } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { downloadTextFile } from "@/lib/download";
import { backupFileName, parseBackupText } from "@/storage";

export function BackupCard({ transactionCount }: { transactionCount: number }) {
  const { catalog, actions } = useAppData();
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState<BackupFile | null>(null);
  const [message, setMessage] = React.useState<{ tone: "success" | "destructive"; text: string } | null>(null);

  async function handleExport() {
    try {
      const backup = await actions.exportBackup();
      downloadTextFile(backupFileName(new Date()), JSON.stringify(backup, null, 2));
      setMessage({ tone: "success", text: "Backup erstellt." });
    } catch (e) {
      setMessage({ tone: "destructive", text: e instanceof Error ? e.message : "Export fehlgeschlagen." });
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = parseBackupText(await file.text());
    if (!result.ok) {
      setMessage({ tone: "destructive", text: result.error });
      return;
    }
    setMessage(null);
    setPending(result.backup);
  }

  const pendingBalances = pending
    ? balancesByProgram(pending.data.transactions, catalog.programs.map((p) => p.id))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup</CardTitle>
        <CardDescription>
          Deine Daten liegen nur in diesem Browser auf diesem Gerät ({formatPoints(transactionCount)} Buchungen). iPad und
          Handy haben getrennte Daten – zum Übertragen hier exportieren und dort importieren.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport}>
            <Download /> Exportieren (JSON)
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload /> Importieren …
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
            aria-label="Backup-Datei auswählen"
          />
        </div>
        {message ? (
          <Alert variant={message.tone}>
            <AlertDescription>
              <p>{message.text}</p>
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Backup importieren?"
        description="Alle aktuellen Daten auf diesem Gerät werden durch das Backup ersetzt. Exportiere vorher, falls du sie behalten willst."
        confirmLabel="Ersetzen"
        destructive
        onConfirm={async () => {
          if (!pending) return;
          await actions.importBackup(pending);
          setMessage({ tone: "success", text: "Backup importiert." });
        }}
      >
        {pending && pendingBalances ? (
          <DetailList className="rounded-lg border border-border px-4">
            <DetailRow label="Erstellt am">{formatDate(pending.exportedAt)}</DetailRow>
            <DetailRow label="Buchungen">{formatPoints(pending.data.transactions.length)}</DetailRow>
            {catalog.programs.map((p) => (
              <DetailRow key={p.id} label={p.name}>
                {formatPoints(pendingBalances[p.id] ?? 0)} {p.unit}
              </DetailRow>
            ))}
          </DetailList>
        ) : null}
      </ConfirmDialog>
    </Card>
  );
}
