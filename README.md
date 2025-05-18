# Hypercube Text Verschlüsselung (Gebilde-Modell)

Dieses Projekt implementiert eine clientseitige Textverschlüsselungs- und Entschlüsselungsanwendung mittels HTML, CSS und JavaScript. Die Methode basiert auf einem konzeptionellen N-dimensionalen Hypercube ("Gebilde"), dessen Zellen mit ASCII-Zeichen initialisiert werden.

## Funktionsweise

Die Kernidee der Verschlüsselung ist wie folgt:

1.  **Dimensionen (`N`)**: Der Benutzer wählt die Anzahl der Dimensionen für den Hypercube. Jede Dimension hat eine Kantenlänge von 26 (symbolisiert durch die Buchstaben 'a'-'z').
2.  **Hypercube-Initialisierung**:
    * Ein konzeptioneller Hypercube mit $26^N$ Zellen wird erstellt.
    * Diese Zellen werden mit einer definierten Untermenge von ASCII-Zeichen gefüllt (aktuell druckbare Zeichen von ASCII 32 (Leerzeichen) bis ASCII 126 (~)). Diese Zeichenfolge wird zyklisch wiederholt, um alle Zellen des Hypercubes zu füllen.
    * Für jedes Zeichen der ASCII-Untermenge werden bis zu `K_ALTERNATIVES_PER_CHAR` (aktuell 50) verschiedene Koordinatensätze im Hypercube gesammelt und zwischengespeichert. Dieser Prozess kann bei höheren Dimensionen (N=3, N=4) einige Zeit in Anspruch nehmen und wird mit einer Fortschrittsanzeige visualisiert.
3.  **Verschlüsselung**:
    * Für jedes Zeichen im Eingabetext:
        * Es wird in der Liste der gesammelten Koordinaten nachgeschlagen.
        * Um Varianz für wiederholte Zeichen zu erzielen (d.h., zwei gleiche Eingabezeichen führen zu unterschiedlichen Ausgaben), wird zyklisch (Round-Robin) einer der bis zu `K_ALTERNATIVES_PER_CHAR` verfügbaren Koordinatensätze für das Zeichen ausgewählt.
        * Die resultierenden numerischen Koordinaten (0-25) werden in Buchstaben ('a'-'z') umgewandelt und bilden den Chiffretext für das ursprüngliche Zeichen.
        * Zeichen, die nicht in der definierten ASCII-Untermenge enthalten sind, werden unverändert übernommen.
4.  **Entschlüsselung**:
    * Der Chiffretext wird in Blöcke der Länge `N` zerlegt.
    * Jeder Block wird von Buchstaben in numerische Koordinaten umgewandelt.
    * Anhand dieser Koordinaten wird im konzeptionellen Hypercube das ursprüngliche Zeichen nachgeschlagen (basierend auf dem linearen Index und der zyklischen ASCII-Untermenge).
    * Teile des Eingabetextes, die nicht als gültige Koordinatenblöcke erkannt werden, werden als unverschlüsselt interpretiert und direkt übernommen.

## Dateien im Projekt

* `index.html`: Die Haupt-HTML-Datei, welche die Benutzeroberfläche strukturiert.
* `style.css`: Enthält die CSS-Regeln für das Erscheinungsbild der Anwendung.
* `javascript.js`: Beinhaltet die gesamte Logik für die Initialisierung des Hypercubes, die Fortschrittsanzeige, die Ver- und Entschlüsselung sowie die Interaktion mit der Benutzeroberfläche.

## Benutzung

1.  Öffne die `index.html`-Datei in einem modernen Webbrowser.
2.  Gib die gewünschte Anzahl der Dimensionen (N) ein (empfohlen: 1-4).
3.  Klicke auf "Hypercube Initialisieren". Die Initialisierung kann je nach gewählter Dimension einige Sekunden dauern (besonders bei N=4). Eine Fortschrittsanzeige informiert über den Stand.
4.  Nach erfolgreicher Initialisierung können die Buttons "Verschlüsseln" und "Entschlüsseln" verwendet werden.
5.  Gib den zu verarbeitenden Text in das Feld "Eingabetext" ein.
6.  Klicke auf den entsprechenden Button, um den Text zu ver- oder entschlüsseln.
7.  Der Ergebnisstext erscheint im Feld "Ausgabetext". Statusmeldungen informieren über den Prozess.

## Technische Details und Konstanten

* **`CHARSET_S`**: Die Menge der für das Gebilde verwendeten Zeichen (ASCII 32-126).
* **`K_ALTERNATIVES_PER_CHAR`**: Maximale Anzahl alternativer Koordinaten, die pro Zeichen für die Verschlüsselungsvarianz gesammelt werden (Standard: 50).
* **`N_MAX_DIMENSION_ALLOWED`**: Maximal erlaubte Dimension für die Initialisierung, um Performance-Probleme zu vermeiden (Standard: 4).
* Die Initialisierung des Koordinaten-Caches erfolgt asynchron in Chunks, um die Benutzeroberfläche währenddessen responsiv zu halten.

## Mögliche Erweiterungen

* Implementierung eines Passwort- oder Schlüsselsystems, um die Reihenfolge in `CHARSET_S` oder die Auswahl der Koordinaten zu beeinflussen.
* Optionale Verwendung eines Web Workers für die rechenintensive Initialisierung, um die UI vollständig von Blockaden zu befreien.
* Verbesserte Behandlung von gemischtem (verschlüsseltem/unverschlüsseltem) Text bei der Entschlüsselung.
* Hinzufügen einer Option zum Speichern/Laden des initialisierten Koordinaten-Mappings, um wiederholte Initialisierungen zu vermeiden.

## Autor

* Kay Beckmann (GitHub: @KayBeckmann)

---

Viel Spaß bei der Nutzung und Weiterentwicklung!
