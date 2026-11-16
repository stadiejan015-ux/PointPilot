import { Calculator, LayoutDashboard, Settings, Wallet, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Hauptnavigation. Ein späteres Modul (z. B. KI-Advisor, Flugsuche, Deals, Kreditkarten)
 * bekommt hier einen Eintrag, eine Route unter src/app/<modul>/ und einen Ordner src/features/<modul>/.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/punkte/", label: "Meine Punkte", icon: Wallet },
  { href: "/rechner/", label: "Rechner", icon: Calculator },
  { href: "/einstellungen/", label: "Einstellungen", icon: Settings },
];

/** Aktiver Menüpunkt – unabhängig von abschließendem Schrägstrich. */
export function isActivePath(pathname: string, href: string): boolean {
  const strip = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const current = strip(pathname);
  const target = strip(href);
  return target === "/" ? current === "/" : current === target || current.startsWith(`${target}/`);
}
