"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActivePath } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "./logo";

/**
 * Rahmen der App, mobil zuerst:
 * - Handy: Kopfzeile oben, Navigation als Leiste unten (Daumenbereich)
 * - ab md (iPad hochkant): schmale Seitenleiste mit Symbolen
 * - ab lg (iPad quer, Desktop): breite Seitenleiste mit Beschriftung
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-dvh">
      {/* Seitenleiste – Tablet & Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-24 flex-col border-r border-border/70 bg-[#081227]/80 backdrop-blur-xl md:flex lg:w-64">
        <div className="flex h-20 items-center justify-center px-5 lg:justify-start">
          <Link href="/" aria-label="PointPilot – zum Dashboard" className="rounded-md">
            <span className="lg:hidden">
              <LogoMark className="size-9" />
            </span>
            <span className="hidden lg:inline">
              <Logo />
            </span>
          </Link>
        </div>
        <nav aria-label="Hauptnavigation" className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground lg:flex-row lg:gap-3 lg:px-3 lg:text-sm",
                  active && "bg-accent text-foreground shadow-[inset_0_0_0_1px_rgb(143_179_255/0.18)]",
                )}
              >
                <Icon className={cn("size-5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="text-center leading-tight lg:text-left">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <p className="hidden px-6 pb-6 text-xs leading-relaxed text-muted-foreground/80 lg:block">
          Rechnet und empfiehlt nur – ausgeführt wird nichts.
        </p>
      </aside>

      {/* Kopfzeile – Handy */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center px-4">
          <Link href="/" aria-label="PointPilot – zum Dashboard">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12 md:pl-24 lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:pt-10 lg:px-10">{children}</div>
      </main>

      {/* Navigation unten – Handy */}
      <nav
        aria-label="Hauptnavigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-[#081227]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="grid h-16 grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors",
                    active && "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-primary/15",
                    )}
                  >
                    <Icon className={cn("size-5", active && "text-primary")} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
