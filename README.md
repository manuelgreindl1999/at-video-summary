# at-video-summary

Dieses Projekt ist ein einfaches Web‑Tool, mit dem ein Video hochgeladen, automatisch in Screenshots zerlegt und anschließend mit einem lokalen multimodalen LLM (LLaVA über Ollama) beschrieben wird.

## Voraussetzungen

Um das Projekt lokal auszuführen, müssen folgende Programme installiert sein:

- **Node.js** (inkl. npm), damit das Express‑Backend läuft.
- **FFmpeg**, um aus dem hochgeladenen Video automatisch Screenshots zu erzeugen.
- **Ollama** als lokaler LLM‑Host.
  - Über Ollama muss ein Vision‑Modell (z. B. `llava` bzw. eine funktionierende LLaVA‑Variante) heruntergeladen sein.

Stelle außerdem sicher, dass der Ollama‑Server läuft (z. B. durch `ollama run llava` einmalig testen).

## Installation

1. Repository klonen (oder herunterladen).
2. Im Projektordner die Abhängigkeiten installieren:
   `npm install`
3. FFmpeg muss im System‑PATH verfügbar sein (Test im Terminal mit ffmpeg -version).
4. In Ollama das gewünschte Vision‑Modell bereitstellen, z. B.:
    `ollama pull llava`

## Starten der Anwendung

1. Im Projektordner den Server starten:
    `node server.js`
2. Im Browser die folgende Adresse aufrufen:
    http://localhost:3000
3. Auf der Webseite ein Video auswählen und hochladen.
4. Das Backend erstellt automatisch Screenshots des Videos, schickt einen (oder mehrere) Frames an das Vision‑Modell und zeigt eine kurze textuelle Beschreibung an.

## Hinweise

Hochgeladene Videos werden im Ordner uploads/ gespeichert, generierte Screenshots im Ordner screenshots/.
Beide Ordner werden typischerweise in .gitignore eingetragen und nicht versioniert.