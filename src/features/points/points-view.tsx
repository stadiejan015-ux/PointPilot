"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataGate } from "@/components/shared/data-gate";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramDot } from "@/components/shared/program-label";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { sortNewestFirst } from "@/core/calc";
import { findProgram } from "@/core/catalog";
import { formatDate, formatPoints, formatSignedPoints } from "@/core/format";
import { TRANSACTION_TYPE_LABELS, type AppData, type Program, type Transaction } from "@/core/model";
import { useAppData, useBalances } from "@/hooks/use-app-data";
import { EditBalanceDialog } from "./edit-balance-dialog";
import { TransactionList } from "./transaction-list";

export function PointsView() {
  return (
    <>
      <PageHeader
        title="Meine Punkte"
        description="Stände direkt bearbeiten. Jede Änderung wird als Buchung gespeichert."
      />
      <DataGate>{(data) => <PointsContent data={data} />}</DataGate>
    </>
  );
}

function PointsContent({ data }: { data: AppData }) {
  const { catalog, actions } = useAppData();
  const balances = useBalances() ?? {};
  const [editing, setEditing] = React.useState<Program | null>(null);
  const [filter, setFilter] = React.useState("all");
  const [toDelete, setToDelete] = React.useState<Transaction | null>(null);

  const sorted = sortNewestFirst(data.transactions);
  const visible = filter === "all" ? sorted : sorted.filter((tx) => tx.programId === filter);
  const deleteProgram = toDelete ? findProgram(catalog, toDelete.programId) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <Card className="gap-2">
        <CardHeader>
          <CardTitle>Stände</CardTitle>
          <CardDescription>Tippe auf ein Programm, um den Stand zu ändern.</CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          <ul className="grid gap-1">
            {catalog.programs.map((program) => (
              <li key={program.id}>
                <button
                  type="button"
                  onClick={() => setEditing(program)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <ProgramDot id={program.id} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{program.name}</span>
                    <span className="block text-xs text-muted-foreground">{program.unit}</span>
                  </span>
                  <span className="tabular text-lg font-semibold">{formatPoints(balances[program.id] ?? 0)}</span>
                  <Pencil className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="sr-only">Stand von {program.name} ändern</span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buchungen</CardTitle>
          <CardDescription>
            {visible.length === 1 ? "1 Buchung" : `${formatPoints(visible.length)} Buchungen`}
          </CardDescription>
          <CardAction className="w-[11.5rem] sm:w-52">
            <NativeSelect
              aria-label="Nach Programm filtern"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-9"
            >
              <option value="all">Alle Programme</option>
              {catalog.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={visible} allTransactions={data.transactions} onDelete={setToDelete} />
        </CardContent>
      </Card>

      {editing ? (
        <EditBalanceDialog
          program={editing}
          currentBalance={balances[editing.id] ?? 0}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Buchung löschen?"
        description={
          toDelete
            ? `${deleteProgram?.name ?? toDelete.programId}: ${formatSignedPoints(toDelete.delta)} ${deleteProgram?.unit ?? ""} (${TRANSACTION_TYPE_LABELS[toDelete.type]}, ${formatDate(toDelete.occurredAt)}). Der Stand ändert sich entsprechend.`
            : undefined
        }
        confirmLabel="Löschen"
        destructive
        onConfirm={async () => {
          if (toDelete) await actions.deleteTransaction(toDelete.id);
        }}
      />
    </div>
  );
}
