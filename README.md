# DHL Sendungsverfolgung Karte

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Noack1978/ha-dhl-tracking-card/blob/main/LICENSE)

Lovelace-Karte für die [DHL Sendungsverfolgung Integration](https://github.com/Noack1978/ha-dhl-tracking).

## Features

- DHL-Branding (Rot/Gelb)
- Sendungen direkt in der Karte hinzufügen und entfernen
- Status mit Farbe (Grün = Zugestellt, Orange = In Zustellung, Blau = Transit usw.)
- Anzeige von: Sendungsnummer, Bezeichnung, Status, letzter Ort, letzte Änderung, voraussichtliches Lieferdatum
- Sofort-Aktualisieren-Button

## Voraussetzungen

Die Integration **DHL Sendungsverfolgung** muss installiert und eingerichtet sein: <https://github.com/Noack1978/ha-dhl-tracking>

## Installation via HACS

1. HACS öffnen → Frontend → Menü (⋮) → Benutzerdefinierte Repositories
2. URL: `https://github.com/Noack1978/ha-dhl-tracking-card`
3. Kategorie: **Lovelace**
4. Herunterladen
5. HA neu laden (F5)

## Manuell

1. `dhl-tracking-card.js` nach `<config>/www/dhl-tracking-card.js` kopieren
2. Einstellungen → Dashboards → Ressourcen → Hinzufügen:
   - URL: `/local/dhl-tracking-card.js`
   - Typ: JavaScript-Modul

## Karte einbinden

```yaml
type: custom:dhl-tracking-card
```

Die Karte erkennt automatisch alle Sensoren der DHL Sendungsverfolgung Integration.

## Statusfarben

| Farbe  | Status                             |
| ------ | ---------------------------------- |
| Grün   | Zugestellt                         |
| Orange | In Zustellung                      |
| Blau   | In Transit                         |
| Lila   | Voranmeldung                       |
| Rot    | Fehler / Zustellung fehlgeschlagen |
| Grau   | Nicht gefunden / Unbekannt         |

## Lizenz

MIT
