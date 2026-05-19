# Fraud Detection

SvelteKit tabanlı doküman inceleme aracı. Uygulama JPG/PNG doküman görselleri üzerinde OCR çalıştırır, kelime güven skorlarını ve işaretlenmiş bölgeleri görsel katman olarak gösterir, ardından kullanıcıya manuel bir forged/genuine kararı vermek için odaklı bir çalışma alanı sunar.

## Ne yapar?

- Doküman görsellerini pan/zoom destekli bir canvas üzerinde gösterir.
- Tesseract.js ile OCR çıktısı üretir ve kelime bounding box verilerini saklar.
- OCR confidence değerine göre kelimeleri safe/suspicious/critical gruplarına ayırır.
- Fixture metadata içindeki işaretli bölgeleri doküman üstünde overlay olarak gösterir.
- İnceleme sonunda dokümanı forged veya genuine olarak işaretlemeye izin verir.
- Hazır fixture dokümanları ve yeni yüklenen görsellerle aynı analiz arayüzünü kullanır.

Bu proje otomatik hukuki/finansal karar motoru değildir. Üretilen skorlar ve etiketler inceleme sinyali olarak düşünülmelidir; nihai karar kullanıcı incelemesine bırakılır.

## Tech Stack

- Svelte 5
- SvelteKit
- TypeScript
- apple-svelte
- Tesseract.js
- Sharp
- Material Symbols Rounded

## Proje Yapısı

```text
src/
  routes/
    +page.svelte              # Project overview
    analyze/+page.svelte      # Document review workspace
    api/documents/+server.ts  # Fixture document loader
    api/ocr/+server.ts        # Upload + OCR endpoint
  lib/
    components/               # Viewer, overlays, lists, controls
    stores/document.svelte.ts # Document/OCR/review state
    types/anomaly.ts          # Shared document and anomaly types
    assets/documents/         # Tracked fixture images and OCR JSON
static/assets/documents/      # Uploaded images and generated OCR JSON in dev
```

## OCR ve Sinyal Akışı

1. `src/lib/assets/documents` içindeki fixture görselleri `/api/documents` tarafından listelenir.
2. Yanındaki `*.ocr.json` dosyaları varsa OCR cache olarak okunur.
3. Yeni yüklenen JPG/PNG dosyaları `/api/ocr` endpoint'i üzerinden Tesseract.js ile işlenir.
4. OCR kelime confidence değeri deterministik olarak severity değerine çevrilir:
   - `< 50`: critical
   - `< 80`: suspicious
   - `>= 80`: safe
5. Fixture metadata içindeki anomaly bölgeleri overlay olarak çizilir.
6. Review score, OCR severity ve anomaly metadata üzerinden hesaplanır.

## Kurulum

```bash
bun install
```

Node kullanıyorsanız:

```bash
npm install
```

## Geliştirme

```bash
bun run dev
```

Tarayıcıda:

```text
http://127.0.0.1:5173/
```

## Kontrol

```bash
bun run check
bun run build
```

## Yeni Fixture Ekleme

1. Görseli `src/lib/assets/documents/` altına ekleyin.
2. Varsa OCR çıktısını aynı isimle `*.ocr.json` olarak ekleyin.
3. JSON yapısında `fullText`, `words`, ve isteğe bağlı `anomalies` alanlarını kullanın.

Örnek:

```json
{
  "fullText": "Invoice ...",
  "words": [
    {
      "text": "Invoice",
      "confidence": 91.2,
      "bbox": { "x0": 100, "y0": 120, "x1": 180, "y1": 150 }
    }
  ],
  "anomalies": [
    {
      "id": 1,
      "text": "Amount",
      "x": 120,
      "y": 240,
      "width": 220,
      "height": 48,
      "type": "forged"
    }
  ]
}
```

## Notlar

- OCR kalitesi görsel çözünürlüğüne, dil verisine ve doküman düzenine bağlıdır.
- Upload endpoint'i geliştirme ortamında dosyaları `static/assets/documents` altına yazar.
- Mevcut anomaly detection katmanı fixture metadata ve OCR confidence sinyallerine dayanır; model tabanlı sahtecilik tespiti eklenmek istenirse bu katman ayrı bir servis olarak tasarlanmalıdır.
