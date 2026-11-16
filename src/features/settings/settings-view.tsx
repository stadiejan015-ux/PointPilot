"use client";

import { DataGate } from "@/components/shared/data-gate";
import { PageHeader } from "@/components/shared/page-header";
import { useAppData } from "@/hooks/use-app-data";
import { BackupCard } from "./backup-card";
import { CatalogCard } from "./catalog-card";
import { ResetCard } from "./reset-card";
import { ValuesForm } from "./values-form";

export function SettingsView() {
  const { generation } = useAppData();
  return (
    <>
      <PageHeader title="Einstellungen" description="Deine Punktwerte, Mindestwerte und Datensicherung." />
      <DataGate>
        {(data) => (
          <div className="grid gap-6">
            <ValuesForm key={generation} settings={data.settings} />
            <BackupCard transactionCount={data.transactions.length} />
            <CatalogCard />
            <ResetCard />
          </div>
        )}
      </DataGate>
    </>
  );
}
