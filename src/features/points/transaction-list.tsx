"use client";

import { Trash2 } from "lucide-react";
import { ProgramDot } from "@/components/shared/program-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { balanceAfterEach } from "@/core/calc";
import { findProgram } from "@/core/catalog";
import { formatDate, formatPoints, formatSignedPoints } from "@/core/format";
import { TRANSACTION_TYPE_LABELS, type Transaction } from "@/core/model";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";

/**
 * Liste von Buchungen. `transactions` ist bereits gefiltert/sortiert;
 * `allTransactions` wird für den Stand nach jeder Buchung gebraucht.
 */
export function TransactionList({
  transactions,
  allTransactions,
  compact = false,
  onDelete,
}: {
  transactions: Transaction[];
  allTransactions: Transaction[];
  compact?: boolean;
  onDelete?: (tx: Transaction) => void;
}) {
  const { catalog } = useAppData();
  const after = balanceAfterEach(allTransactions);

  if (transactions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Buchungen.</p>;
  }

  return (
    <ul className="divide-y divide-border/70">
      {transactions.map((tx) => {
        const program = findProgram(catalog, tx.programId);
        const counterpart = tx.counterpartProgramId ? findProgram(catalog, tx.counterpartProgramId) : undefined;
        const unit = program?.unit ?? "Punkte";
        const balanceAfter = after.get(tx.id);
        return (
          <li key={tx.id} className="flex items-start gap-3 py-3">
            <ProgramDot id={tx.programId} className="mt-1.5" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate font-medium">{program?.name ?? tx.programId}</span>
                <Badge variant="secondary">{TRANSACTION_TYPE_LABELS[tx.type]}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(tx.occurredAt)}
                {counterpart ? ` · ${tx.delta < 0 ? "an" : "von"} ${counterpart.name}` : ""}
                {tx.note ? ` · ${tx.note}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "tabular font-medium",
                  tx.delta > 0 ? "text-success" : "text-foreground/90",
                )}
              >
                {formatSignedPoints(tx.delta)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
              </p>
              {!compact && balanceAfter !== undefined ? (
                <p className="tabular text-xs text-muted-foreground">Stand {formatPoints(balanceAfter)}</p>
              ) : null}
            </div>
            {onDelete ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="-mr-1 shrink-0 text-muted-foreground hover:text-danger"
                onClick={() => onDelete(tx)}
                aria-label={`Buchung vom ${formatDate(tx.occurredAt)} löschen`}
              >
                <Trash2 />
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
