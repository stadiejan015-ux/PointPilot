"use client";

import * as React from "react";
import { balancesByProgram, deltaForNewBalance } from "@/core/calc";
import { catalog } from "@/core/catalog";
import type { AppData, Balances, BackupFile, Catalog, ProgramId, Settings, TransactionType } from "@/core/model";
import { createBrowserRepository, newId, StorageError, type BrowserRepository } from "@/storage";

export type AppDataState =
  | { status: "loading" }
  | { status: "ready"; data: AppData }
  | { status: "error"; error: StorageError; raw: string | null };

export interface BalanceChangeInput {
  programId: ProgramId;
  newBalance: number;
  type: TransactionType;
  occurredAt: string;
  note?: string;
  counterpartProgramId?: ProgramId;
}

export interface AppDataActions {
  recordBalanceChange(input: BalanceChangeInput): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  exportBackup(): Promise<BackupFile>;
  importBackup(backup: BackupFile): Promise<void>;
  reset(): Promise<void>;
}

interface AppDataContextValue {
  state: AppDataState;
  catalog: Catalog;
  actions: AppDataActions;
  /** Steigt, wenn Daten komplett ersetzt werden (Import, Zurücksetzen, anderer Tab) – zum Neuaufbau von Formularen. */
  generation: number;
}

const AppDataContext = React.createContext<AppDataContextValue | null>(null);

function toStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  return new StorageError("unavailable", error instanceof Error ? error.message : "Unbekannter Fehler");
}

/**
 * Verbindet React mit der Datenzugriffsschicht. Lädt erst im Browser (nach dem Rendern),
 * weil der statische Export auf dem Server kein localStorage kennt.
 */
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppDataState>({ status: "loading" });
  const [generation, setGeneration] = React.useState(0);
  const repoRef = React.useRef<BrowserRepository | null>(null);

  React.useEffect(() => {
    let browserRepo: BrowserRepository;
    try {
      browserRepo = createBrowserRepository();
    } catch (error) {
      setState({ status: "error", error: toStorageError(error), raw: null });
      return;
    }
    repoRef.current = browserRepo;
    const load = () =>
      browserRepo.repository
        .load()
        .then((data) => setState({ status: "ready", data }))
        .catch((error: unknown) =>
          setState({ status: "error", error: toStorageError(error), raw: browserRepo.readRaw?.() ?? null }),
        );
    void load();
    return browserRepo.repository.subscribe?.(() => {
      setGeneration((g) => g + 1);
      void load();
    });
  }, []);

  const actions = React.useMemo<AppDataActions>(() => {
    const repo = () => {
      const current = repoRef.current;
      if (!current) throw new StorageError("unavailable", "Daten sind noch nicht geladen.");
      return current.repository;
    };
    const apply = async (run: () => Promise<AppData>) => {
      const data = await run();
      setState({ status: "ready", data });
    };

    return {
      async recordBalanceChange(input) {
        const data = await repo().load();
        const current = balancesByProgram(data.transactions, [input.programId])[input.programId] ?? 0;
        const check = deltaForNewBalance(current, input.newBalance);
        if (!check.ok) throw new StorageError("invalid-data", "Der Stand hat sich nicht geändert oder ist ungültig.");
        await apply(() =>
          repo().addTransactions([
            {
              id: newId(),
              programId: input.programId,
              type: input.type,
              delta: check.delta,
              occurredAt: input.occurredAt,
              ...(input.note ? { note: input.note } : {}),
              ...(input.counterpartProgramId ? { counterpartProgramId: input.counterpartProgramId } : {}),
            },
          ]),
        );
      },
      deleteTransaction: (id) => apply(() => repo().deleteTransaction(id)),
      saveSettings: (settings) => apply(() => repo().saveSettings(settings)),
      exportBackup: () => repo().exportBackup(),
      async importBackup(backup) {
        await apply(() => repo().importBackup(backup));
        setGeneration((g) => g + 1);
      },
      async reset() {
        const fresh = repoRef.current ?? createBrowserRepository();
        repoRef.current = fresh;
        await apply(() => fresh.repository.reset());
        setGeneration((g) => g + 1);
      },
    };
  }, []);

  const value = React.useMemo(() => ({ state, catalog, actions, generation }), [state, actions, generation]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = React.useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData muss innerhalb von <AppDataProvider> verwendet werden.");
  return ctx;
}

/** Stände je Katalogprogramm – oder null, solange nichts geladen ist. */
export function useBalances(): Balances | null {
  const { state, catalog: cat } = useAppData();
  const transactions = state.status === "ready" ? state.data.transactions : null;
  return React.useMemo(
    () => (transactions ? balancesByProgram(transactions, cat.programs.map((p) => p.id)) : null),
    [transactions, cat],
  );
}
