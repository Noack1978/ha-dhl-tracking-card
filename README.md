# DHL Sendungsverfolgung Karte

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Noack1978/ha-dhl-tracking-card/blob/main/LICENSE)

Lovelace-Karte für die [DHL Sendungsverfolgung Integration](https://github.com/Noack1978/ha-dhl-tracking).

## Features

- DHL-Branding (Rot/Gelb)
- Sendungen direkt in der Karte hinzufügen und entfernen
- Status mit Farbe (Grün = Zugestellt, Orange = In Zustellung, Blau = Transit usw.)
- Anzeige von: Sendungsnummer, Bezeichnung, Status, letzter Ort, letzte Änderung, voraussichtliches Lieferdatum
- Sofort-Aktualisieren-Button
- 📦 Archiv-Button bei zugestellten Sendungen
- 🗂️ Aufklappbarer Archiv-Bereich unterhalb der aktiven Sendungen
- 🗑️ Bereinigen-Button mit Bestätigungs-Dialog – zeigt was gelöscht wird, fällige Sendungen werden markiert

## Voraussetzungen

Die Integration **DHL Sendungsverfolgung** v1.3.0 oder neuer muss installiert und eingerichtet sein: <https://github.com/Noack1978/ha-dhl-tracking>

## Installation via HACS

[![In HACS öffnen](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Noack1978&repository=ha-dhl-tracking-card&category=frontend)

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

## Changelog

### v1.2.0
- 📦 Archiv-Button bei zugestellten Sendungen
- 🗂️ Aufklappbarer Archiv-Bereich unterhalb der aktiven Sendungen
- 🗑️ Bereinigen-Button mit Modal-Dialog: zeigt was gelöscht wird, Bestätigung erforderlich
- Fällige Sendungen werden mit Warnhinweis markiert

### v1.1.0
- Icon und Logo hinzugefügt

### v1.0.0
- Erstveröffentlichung

## Lizenz

MIT
 
