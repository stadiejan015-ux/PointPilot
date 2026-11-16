import type { Metadata } from "next";
import { PointsView } from "@/features/points/points-view";

export const metadata: Metadata = { title: "Meine Punkte" };

export default function PointsPage() {
  return <PointsView />;
}
