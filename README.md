# PointPilot

Persönlicher Meilen- & Punkte-Optimizer. PointPilot zeigt nicht möglichst viele Punkte an. Es hilft bei der Entscheidung: **Welche Transfers und Einlösungen lohnen sich wirklich?**

- Next.js (statischer Export) · TypeScript · Tailwind CSS v4 · shadcn/ui
- Kein Backend, kein Login. Daten liegen im `localStorage` des Browsers.
- Gehostet auf GitHub Pages, Deploy per GitHub Actions.
- **Nichts wird automatisch ausgeführt.** PointPilot rechnet und empfiehlt nur.

## Funktionen (Phase 1)

| Bereich | Was es tut |
| --- | --- |
| **Dashboard** | Stand je Programm, geschätzter Wert in EUR (nach deinen Punktwerten), letzte Buchungen. Keine Gesamtsumme, denn Punkte verschiedener Programme sind nicht gleichwertig. |
| **Meine Punkte** | Stände direkt bearbeiten. Jede Änderung wird als Buchung gespeichert (gesammelt, übertragen, eingelöst, gekauft, Korrektur). Buchungen lassen sich filtern und löschen. |
| **Rechner → Transfer** | Quelle, Ziel, Menge → Zielpunkte. Mit Mindestmenge, Schrittweite, Rest und Warnung, wenn das Verhältnis nicht verifiziert ist oder fehlt. |
| **Rechner → Ziel** | Zielprogramm und Zielmenge, z. B. 10.000 Miles & More. Zeigt, welche Programme laut Transfer-Tabelle dorthin übertragen können, den Stand danach und was noch fehlt. |
| **Rechner → Einlösung** | Wert pro Punkt in Cent = (Cash-Preis − Zuzahlung) / Meilen, bewertet gegen deinen Mindestwert: lohnt sich / grenzwertig / schlechte Einlösung. |
| **Einstellungen** | Punktwert und Mindestwert je Programm, Breite der Zone „grenzwertig“, Backup (Export/Import als JSON), Transfer-Tabelle ansehen, Zurücksetzen. |

## Lokal starten

Voraussetzung: Node.js ≥ 20.9 (empfohlen: 22).

```bash
npm ci              # Abhängigkeiten installieren
npm run dev         # Entwicklungsserver auf http://localhost:3000
npm test            # Tests für Rechenkern, Datenschicht und Katalog
npm run typecheck   # TypeScript-Prüfung
npm run build       # statischer Export nach ./out
```

Auf dem iPad oder Handy im selben WLAN testen: `npm run dev -- -H 0.0.0.0`, dann `http://<IP-deines-Rechners>:3000` öffnen.

## Veröffentlichen auf GitHub Pages

Einmalig:

1. Im Repo auf GitHub: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**.
2. Den Branch mit dem Code nach `main` mergen.

Danach baut und veröffentlicht der Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) bei jedem Push auf `main`. Vorher laufen Typprüfung und Tests. Wenn sie fehlschlagen, wird nicht veröffentlicht. Bei Pull Requests läuft nur die Prüfung, ohne Deploy.

Die App liegt dann unter `https://<github-name>.github.io/PointPilot/`. Den Pfad (`/PointPilot`) setzt der Workflow automatisch über `PAGES_BASE_PATH`.

**Zum Home-Bildschirm:** Auf dem iPad in Safari „Teilen → Zum Home-Bildschirm“, auf Android in Chrome „Zum Startbildschirm hinzufügen“. Die App startet dann im Vollbild.

## Deine Daten

- Buchungen und Einstellungen liegen **nur im Browser des jeweiligen Geräts** (`localStorage`, Schlüssel `pointpilot:data`).
- iPad und Handy haben **getrennte** Daten. Zum Übertragen in den Einstellungen exportieren und auf dem anderen Gerät importieren. Ein Import ersetzt alle Daten auf dem Zielgerät.
- Wenn du Website-Daten im Browser löschst, sind die Daten weg. Mach regelmäßig ein Backup.
- Beim ersten Öffnen werden die Startwerte als Buchungen „Startbestand“ angelegt: PAYBACK 5.822, Revolut RevPoints 5.510, Miles & More, Flying Blue und Avios je 0.

## Programme und Transfer-Tabelle pflegen

Beides liegt als JSON im Repo und wird beim Build geprüft. Ein Fehler in den Daten lässt den Build (und damit den Deploy) scheitern, damit nie mit kaputten Daten gerechnet wird.

### `data/transfers.json`

```json
{
  "id": "payback__miles-and-more",
  "from": "payback",
  "to": "miles-and-more",
  "ratio": { "from": 1, "to": 1 },
  "minAmount": 200,
  "step": null,
  "source": "https://www.payback.de/partner/miles-and-more",
  "asOf": "2026-11-16",
  "verified": false,
  "note": "optional"
}
```

| Feld | Bedeutung |
| --- | --- |
| `ratio` | `{ "from": Quellpunkte, "to": Zielpunkte }` als **ganze Zahlen**. 3:2 heißt `{ "from": 3, "to": 2 }`, 1:0,8 heißt `{ "from": 5, "to": 4 }`. `null` bedeutet unbekannt: Der Rechner zeigt dann „Verhältnis fehlt“. |
| `minAmount` | Mindestmenge in Quellpunkten je Transfer, `null` = keine. |
| `step` | Nur Vielfache davon übertragbar (z. B. 1000), `null` = beliebig. |
| `source`, `asOf` | URL der Quelle und Stand-Datum (`JJJJ-MM-TT`). **Pflicht, sobald ein Verhältnis eingetragen ist.** |
| `verified` | `true` erst setzen, nachdem du die Angaben selbst beim Anbieter geprüft hast. |

Befristete Transferboni gehören nicht ins Verhältnis. Schreib sie höchstens in `note`.

### `data/programs.json`

Ein neues Programm braucht `id` (Kleinbuchstaben und Bindestriche), `name`, `unit`, `category` (`bank`, `retail`, `airline`, `hotel`, `other`) sowie `source`, `asOf` und `verified`. Danach erscheint es automatisch in allen Ansichten. Seinen Startwert trägst du in der App unter „Meine Punkte“ ein.

### Stand der mitgelieferten Daten (16.11.2026)

Alle Einträge stehen auf `verified: false`. Die Herstellerseiten ließen sich beim Anlegen nicht direkt laden, ausgewertet wurden deshalb Suchergebnisse dieser Seiten.

- **PAYBACK → Miles & More:** 1:1 ab 200 °Punkten, max. 999.999 je Transaktion. Laut payback.de und miles-and-more.com.
- **Revolut → Flying Blue / Avios:** Verhältnis **leer**. Revolut nennt offiziell nur „je nach Partner bis zu 1:1“. Den genauen Wert, eventuell abhängig vom Revolut-Plan, findest du in der App.
- **Revolut → Miles & More** und **PAYBACK → Flying Blue/Avios:** nicht angelegt, weil eine offizielle Bestätigung fehlt.

## Rechenregeln

- Punkte werden **nie programmübergreifend addiert**. Nur im Ziel-Rechner werden Zielpunkte nach der Umrechnung in die Zieleinheit zusammengezählt („alle Quellen“).
- Transfer: Die Menge wird auf ein Vielfaches von `step` abgerundet, die Zielpunkte werden ebenfalls abgerundet. Der nicht übertragbare Rest wird angezeigt. Unter der Mindestmenge gibt es keinen Transfer.
- Ziel-Rechner: nur direkte Routen (A → Ziel), keine Ketten (A → B → Ziel).
- Einlösung, bei Mindestwert *m* und Toleranz *t* (Standard 10 %):
  - **lohnt sich** ab *m* × (1 + *t*)
  - **grenzwertig** von *m* × (1 − *t*) bis unter *m* × (1 + *t*)
  - **schlechte Einlösung** darunter
  - Ohne Mindestwert gibt es keine Bewertung.
- Geld wird intern in Cent gerechnet. Eingaben verstehen deutsche Schreibweise („1.234,56“, „5.822“).

## Projektstruktur

```
data/                     Programme & Transfer-Tabelle (von dir gepflegt)
src/
  app/                    Nur Routing (Next.js App Router)
  core/                   Ohne React und ohne Browser: rein und getestet
    model/                zod-Schemas + Typen (prüfen Katalog und Backups)
    calc/                 balances, transfer, goal, redemption, valuation (+ *.test.ts)
    catalog/              lädt und prüft data/*.json
    format/               deutsche Zahlen/Daten lesen und anzeigen
  storage/                Datenzugriffsschicht
    repository.ts         Interface DataRepository
    local-storage-repository.ts
    create-repository.ts  die eine Stelle, an der die Implementierung gewählt wird
    backup.ts  seed.ts
  hooks/use-app-data.tsx  verbindet React mit dem Repository
  features/               UI je Modul: dashboard, points, calculators, settings
  components/ui/          shadcn/ui-Bausteine
  components/layout/      App-Rahmen (Leiste unten am Handy, Seitenleiste am iPad)
  config/navigation.ts    Menüeinträge
```

### Später: Supabase

Die UI kennt nur das Interface `DataRepository`. Für Supabase schreibst du eine `SupabaseRepository`-Klasse mit denselben Methoden und gibst sie in `src/storage/create-repository.ts` zurück. Seiten und Rechner bleiben unverändert. Der statische Export funktioniert weiterhin, weil Supabase direkt aus dem Browser angesprochen wird.

### Später: weitere Module (KI-Advisor, Flugsuche, Deals, Kreditkarten)

1. Ordner `src/features/<modul>/` für die UI anlegen.
2. Route `src/app/<modul>/page.tsx` anlegen.
3. Eintrag in `src/config/navigation.ts` ergänzen.
4. Reine Logik nach `src/core/`, mit Tests.

### shadcn/ui

Die Komponenten in `src/components/ui/` entsprechen shadcn/ui (Stil „new-york“, Radix). Weitere kannst du mit `npx shadcn@latest add <komponente>` holen. Die `components.json` ist vorhanden.
