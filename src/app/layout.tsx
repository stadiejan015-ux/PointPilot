import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { AppDataProvider } from "@/hooks/use-app-data";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PointPilot", template: "%s · PointPilot" },
  description: "Persönlicher Meilen- & Punkte-Optimizer: Welche Transfers und Einlösungen lohnen sich wirklich?",
  applicationName: "PointPilot",
  appleWebApp: { capable: true, title: "PointPilot", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070f1f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="dark">
      <body>
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      </body>
    </html>
  );
}
