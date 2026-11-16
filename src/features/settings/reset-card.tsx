"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/hooks/use-app-data";

export function ResetCard() {
  const { actions } = useAppData();
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="border-danger/20">
      <CardHeader>
        <CardTitle>Zurücksetzen</CardTitle>
        <CardDescription>
          Löscht alle Buchungen und Einstellungen auf diesem Gerät und legt die Startwerte neu an.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="text-danger hover:text-danger" onClick={() => setOpen(true)}>
          <RotateCcw /> Alle Daten zurücksetzen
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Alle Daten zurücksetzen?"
          description="Das lässt sich nicht rückgängig machen. Exportiere vorher ein Backup, falls du die Daten behalten willst."
          confirmLabel="Zurücksetzen"
          destructive
          onConfirm={actions.reset}
        />
      </CardContent>
    </Card>
  );
}
