# Fraud Detection

## Links
* **Live Demo:** [https://fraud-detection-brknl28.vercel.app](fraud-detection-brknl28.vercel.app)

## Projektübersicht

### Entwicklungsprozess und Details
Ich habe das Projekt mit **Svelte 5** (neueste Version) und **Tailwind CSS** gestartet. Ich habe ein "One-Page"-Design mit einer Sidebar rechts gebaut.

**Hier sind die wichtigen Punkte, die ich umgesetzt habe:**

* **Der Viewer:** Ich habe einen Viewer gebaut, in dem man das Bild bewegen und zoomen kann (Pan & Zoom).
* **Daten & OCR (Wichtig):** Ich habe zwei PDFs in PNG-Bilder umgewandelt. Um die Texte und Positionen zu finden, habe ich **Tesseract.js** benutzt.
    * Das System liest den Text und erstellt daraus JSON-Daten mit Koordinaten.
    * Es ist nicht perfekt, aber es funktioniert zu über **80% sehr gut**.
    * *Erkenntnis:* Man kann auch nur mit Frontend eine einfache Betrugserkennung realisieren. Für einen professionellen Einsatz wäre jedoch ein Backend notwendig.
* **Design:** Ich habe das Design an Ihre Firmenfarben und Schriftarten (**ICO-LUX**) angepasst, um ein professionelles Erscheinungsbild zu gewährleisten.
* **Mobile & Desktop:** Die App ist schnell und stabil. Sie funktioniert auch auf dem Handy, der Fokus lag jedoch auf der Desktop-Version.
* **Features:**
    * **Accessibility:** Ich habe eine Tastatur-Steuerung eingebaut.
    * **Betrugserkennung:** Es gibt Warnungen für falsche oder verdächtige Bereiche.
    * **Steuerung:** Ein "Toggle-Button", um Overlays an- oder auszuschalten.
    * **Score:** Ein "Punktestand", der die Genauigkeit bzw. das Risiko bewertet.

**KI-Tools:**
Wie in der Aufgabe erlaubt, habe ich KI benutzt. Ich habe Hilfe von **Claude** und **Google AI Tools** bekommen. Diese haben mir besonders bei der Planung und der Integration von Tesseract.js wertvolle Unterstützung geleistet.

---

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `bun install`), start a development server:

```bash
bun run dev
# or
npm run dev
```

## Building

To create a production version of your app:

```bash
bun run build
# or
npm run build
```

You can preview the production build with `bun run preview`.
