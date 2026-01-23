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

export const GET: RequestHandler = async ({ url }) => {
    const filename = url.searchParams.get('file');
    if (!filename) {
        return json({ error: 'Missing file parameter' }, { status: 400 });
    }
    const safeFilename = path.basename(filename);
    const documentsDir = path.resolve('static/assets/documents');
    const imagePath = path.join(documentsDir, safeFilename);
    const jsonPath = path.join(documentsDir, `${safeFilename}.ocr.json`);

    try {
        try {
            const data = await fs.readFile(jsonPath, 'utf-8');
            return json(JSON.parse(data));
        } catch {
            console.log(`OCR cache missing for ${safeFilename}, generating...`);
        }

        try {
            await fs.access(imagePath);
        } catch {
            return json({ error: 'Image not found' }, { status: 404 });
        }

        const worker = await createWorker('eng');
        const ret = await worker.recognize(imagePath);
        const { text, blocks } = ret.data;
        const wordData = extractWords(blocks || []);
        await worker.terminate();

        const outputData = {
            scanDate: new Date().toISOString(),
            fullText: text,
            words: wordData
        };

        await fs.writeFile(jsonPath, JSON.stringify(outputData, null, 2));

        return json(outputData);

    } catch (err) {
        console.error('OCR Error:', err);
        return json({ error: 'Failed to process OCR' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
            return json({ error: 'Invalid file type' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const documentsDir = path.resolve('static/assets/documents');
        const safeFilename = file.name.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
        const imagePath = path.join(documentsDir, safeFilename);

        await fs.writeFile(imagePath, buffer);
        console.log(`Saved uploaded file to: ${imagePath}`);

        const worker = await createWorker('eng');
        const ret = await worker.recognize(buffer);
        const { text, blocks } = ret.data;
        const wordData = extractWords(blocks || []);
        await worker.terminate();

        const outputData = {
            scanDate: new Date().toISOString(),
            fullText: text,
            words: wordData,
            anomalies: []
        };

        const jsonPath = path.join(documentsDir, `${safeFilename}.ocr.json`);
        await fs.writeFile(jsonPath, JSON.stringify(outputData, null, 2));
        console.log(`Saved OCR data to: ${jsonPath}`);

        return json({
            ...outputData,
            savedFilename: safeFilename,
            imageSrc: `/assets/documents/${safeFilename}`
        });

    } catch (err) {
        console.error('OCR Upload Error:', err);
        return json({ error: 'Failed to process uploaded file' }, { status: 500 });
    }
};
