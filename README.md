# Fraud Detection

Document fraud detection and verification system built with **Svelte 5** and **Tailwind CSS**.

## Links
* **Live Demo:** [fraud-detection-brknl28.vercel.app](https://fraud-detection-brknl28.vercel.app)

## Features

* **Document Viewer** — Pan and zoom document images with keyboard navigation
* **OCR Analysis** — Text extraction from documents using **Tesseract.js**
* **Fraud Detection** — Highlights forged and suspicious areas with color-coded overlays
* **Trust Score** — Visual score ring evaluating document authenticity
* **OCR Word List** — Browse extracted text grouped by severity (Forged / Suspicious / Safe)
* **Accessibility** — Full keyboard controls and screen reader support
* **Responsive** — Works on desktop and mobile

## Tech Stack

* **Svelte 5** with SvelteKit
* **Tailwind CSS**
* **Tesseract.js** for OCR
* **Lucide** for icons

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
