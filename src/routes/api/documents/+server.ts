import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createWorker } from 'tesseract.js';


function extractWords(blocks: any[]) {
    if (!blocks) return [];
    return blocks
        .flatMap(block => block.paragraphs || [])
        .flatMap(paragraph => paragraph.lines || [])
        .flatMap(line => line.words || [])
        .map(w => ({
            text: w.text,
            confidence: w.confidence,
            bbox: w.bbox
        }));
}

export const GET: RequestHandler = async () => {
    try {
        const documentsDir = path.resolve('static/assets/documents');
        const files = await fs.readdir(documentsDir);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
        const documentList = [];
        let worker: any = null;

        for (const file of imageFiles) {
            const imagePath = path.join(documentsDir, file);
            const jsonFilename = `${file}.ocr.json`;
            const jsonPath = path.join(documentsDir, jsonFilename);

            let ocrData;
            let anomalies = [];

            try {
                const fileContent = await fs.readFile(jsonPath, 'utf-8');
                ocrData = JSON.parse(fileContent);

                anomalies = (ocrData.anomalies || []).map((a: any) => ({
                    ...a,
                    type: a.type || (Math.random() > 0.5 ? 'original' : 'forged')
                }));

                if (ocrData.anomalies?.some((a: any) => !a.type)) {
                    ocrData.anomalies = anomalies;
                    await fs.writeFile(jsonPath, JSON.stringify(ocrData, null, 2));
                }
            } catch {
                console.log(`Generating OCR for ${file}...`);

                if (!worker) {
                    worker = await createWorker('eng');
                }

                const ret = await worker.recognize(imagePath);
                const { text, blocks } = ret.data;
                const wordData = extractWords(blocks || []);

                ocrData = {
                    scanDate: new Date().toISOString(),
                    fullText: text,
                    words: wordData,
                    anomalies: [] // Default empty anomalies
                };

                await fs.writeFile(jsonPath, JSON.stringify(ocrData, null, 2));
            }

            documentList.push({
                id: file,
                label: file,
                imageSrc: `/assets/documents/${file}`,
                imageAlt: `Document ${file}`,
                ocrText: ocrData.fullText,
                anomalies: anomalies,
                ocrData: ocrData
            });
        }

        if (worker) {
            await worker.terminate();
        }

        return json(documentList);

    } catch (err) {
        console.error('Documents API Error:', err);
        return json({ error: 'Failed to load documents' }, { status: 500 });
    }
};
