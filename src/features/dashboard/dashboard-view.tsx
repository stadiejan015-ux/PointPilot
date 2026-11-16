"use client";

import Link from "next/link";
import { ArrowRight, ArrowRightLeft, Info, Scale, Target } from "lucide-react";
import { DataGate } from "@/components/shared/data-gate";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramDot } from "@/components/shared/program-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { estimateValueCents, programSettingsFor, recentTransactions } from "@/core/calc";
import { formatCentsPerPoint, formatEuroFromCents, formatPoints } from "@/core/format";
import { PROGRAM_CATEGORY_LABELS, type AppData, type Program } from "@/core/model";
import { TransactionList } from "@/features/points/transaction-list";
import { useAppData, useBalances } from "@/hooks/use-app-data";
import { singularUnit } from "@/lib/units";

export function DashboardView() {
  return (
    <>
      <PageHeader title="Dashboard" description="Deine Stände – jedes Programm für sich." />
      <DataGate>{(data) => <DashboardContent data={data} />}</DataGate>
    </>
  );
}

function DashboardContent({ data }: { data: AppData }) {
  const { catalog } = useAppData();
  const balances = useBalances() ?? {};
  const recent = recentTransactions(data.transactions, 5);

  return (
    <div className="grid gap-6 sm:gap-8">
      <section aria-labelledby="balances-heading" className="grid gap-3">
        <h2 id="balances-heading" className="sr-only">
          Stände
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {catalog.programs.map((program) => (
            <ProgramBalanceCard
              key={program.id}
              program={program}
              balance={balances[program.id] ?? 0}
              pointValueCents={programSettingsFor(data.settings, program.id).pointValueCents}
            />
          ))}
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Keine Gesamtsumme: Punkte verschiedener Programme sind nicht gleichwertig. Der Euro-Wert ist eine Schätzung auf
          Basis deiner eigenen Punktwerte.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Letzte Buchungen</CardTitle>
            <CardDescription>Jede Änderung deiner Stände</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/punkte/">
                  Alle <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={recent} allTransactions={data.transactions} compact />
          </CardContent>
        </Card>

        <section aria-labelledby="tools-heading" className="grid gap-3">
          <h2 id="tools-heading" className="text-sm font-medium text-muted-foreground">
            Rechner
          </h2>
          <QuickLink
            href="/rechner/#transfer"
            icon={<ArrowRightLeft />}
            title="Transfer"
            text="Was kommt beim Zielprogramm an?"
          />
          <QuickLink href="/rechner/#ziel" icon={<Target />} title="Ziel" text="Wie viel fehlt bis zur Wunschmenge?" />
          <QuickLink
            href="/rechner/#einloesung"
            icon={<Scale />}
            title="Einlösung"
            text="Lohnt sich diese Einlösung wirklich?"
          />
        </section>
      </div>
    </div>
  );
}

function ProgramBalanceCard({
  program,
  balance,
  pointValueCents,
}: {
  program: Program;
  balance: number;
  pointValueCents: number | null;
}) {
  const valueCents = estimateValueCents(balance, pointValueCents);
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground/90">
          <ProgramDot id={program.id} />
          <span className="truncate">{program.name}</span>
        </CardTitle>
        <CardAction>
          <Badge variant="outline">{PROGRAM_CATEGORY_LABELS[program.category]}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3 px-4">
        <p className="flex items-baseline gap-2">
          <span className="tabular text-3xl font-semibold tracking-tight">{formatPoints(balance)}</span>
          <span className="text-sm text-muted-foreground">{program.unit}</span>
        </p>
        <div className="flex items-baseline justify-between gap-3 border-t border-border/70 pt-3 text-sm">
          <span className="text-muted-foreground">Geschätzter Wert</span>
          {valueCents === null ? (
            <Link href="/einstellungen/" className="text-primary underline-offset-4 hover:underline">
              Punktwert festlegen
            </Link>
          ) : (
            <span className="tabular text-right">
              <span className="font-medium">≈ {formatEuroFromCents(valueCents)}</span>
              <span className="block text-xs text-muted-foreground">
                bei {formatCentsPerPoint(pointValueCents ?? 0)} pro {singularUnit(program)}
              </span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="surface group flex items-center gap-3 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
