import type { Metadata } from "next";
import { CalculatorsView } from "@/features/calculators/calculators-view";

export const metadata: Metadata = { title: "Rechner" };

export default function CalculatorsPage() {
  return <CalculatorsView />;
}
