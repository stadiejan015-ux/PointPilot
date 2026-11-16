import type { Metadata } from "next";
import { SettingsView } from "@/features/settings/settings-view";

export const metadata: Metadata = { title: "Einstellungen" };

export default function SettingsPage() {
  return <SettingsView />;
}
