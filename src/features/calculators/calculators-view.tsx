"use client";

import * as React from "react";
import { ArrowRightLeft, Scale, Target } from "lucide-react";
import { DataGate } from "@/components/shared/data-gate";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBalances } from "@/hooks/use-app-data";
import { GoalCalculator } from "./goal-calculator";
import { RedemptionCalculator } from "./redemption-calculator";
import { TransferCalculator } from "./transfer-calculator";

const TABS = ["transfer", "ziel", "einloesung"] as const;
type Tab = (typeof TABS)[number];

function tabFromHash(hash: string): Tab | null {
  const value = hash.replace(/^#/, "");
  return (TABS as readonly string[]).includes(value) ? (value as Tab) : null;
}

export function CalculatorsView() {
  const [tab, setTab] = React.useState<Tab>("transfer");

  // Tab über die Adresse (#ziel) ansteuerbar – z. B. vom Dashboard aus.
  React.useEffect(() => {
    const sync = () => {
      const fromHash = tabFromHash(window.location.hash);
      if (fromHash) setTab(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function changeTab(value: string) {
    const next = tabFromHash(value);
    if (!next) return;
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  return (
    <>
      <PageHeader title="Rechner" description="Rechnet und empfiehlt – ausgeführt wird nichts." />
      <DataGate>
        {(data) => (
          <Tabs value={tab} onValueChange={changeTab}>
            <TabsList aria-label="Rechner wählen">
              <TabsTrigger value="transfer">
                <ArrowRightLeft /> Transfer
              </TabsTrigger>
              <TabsTrigger value="ziel">
                <Target /> Ziel
              </TabsTrigger>
              <TabsTrigger value="einloesung">
                <Scale /> Einlösung
              </TabsTrigger>
            </TabsList>
            <BalancesConsumer>
              {(balances) => (
                <>
                  <TabsContent value="transfer" forceMount className="data-[state=inactive]:hidden">
                    <TransferCalculator balances={balances} />
                  </TabsContent>
                  <TabsContent value="ziel" forceMount className="data-[state=inactive]:hidden">
                    <GoalCalculator balances={balances} />
                  </TabsContent>
                  <TabsContent value="einloesung" forceMount className="data-[state=inactive]:hidden">
                    <RedemptionCalculator balances={balances} settings={data.settings} />
                  </TabsContent>
                </>
              )}
            </BalancesConsumer>
          </Tabs>
        )}
      </DataGate>
    </>
  );
}

function BalancesConsumer({ children }: { children: (balances: Record<string, number>) => React.ReactNode }) {
  const balances = useBalances();
  return balances ? <>{children(balances)}</> : null;
}
