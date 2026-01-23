import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const images = import.meta.glob('/src/lib/assets/documents/*.{png,jpg,jpeg}', { eager: true, as: 'url' });
const jsonFiles = import.meta.glob('/src/lib/assets/documents/*.json', { eager: true, as: 'raw' });

export const GET: RequestHandler = async () => {
    try {
        const documentList = [];

        for (const [filePath, imageUrl] of Object.entries(images)) {
            const filename = filePath.split('/').pop() || 'unknown';
            const jsonPath = `${filePath}.ocr.json`;
            const jsonContent = jsonFiles[jsonPath];

            let ocrData: any = null;
            let anomalies: any[] = [];

            if (jsonContent) {
                try {
                    ocrData = JSON.parse(jsonContent as string);

                    anomalies = (ocrData.anomalies || []).map((a: any) => ({
                        ...a,
                        type: a.type || (Math.random() > 0.5 ? 'original' : 'forged')
                    }));

                    if (ocrData.anomalies?.some((a: any) => !a.type)) {
                        ocrData.anomalies = anomalies;
                    }
                } catch (e) {
                    console.error(`Error parsing JSON for ${filename}`, e);
                }
            }

            if (!ocrData) {
                ocrData = {
                    scanDate: new Date().toISOString(),
                    fullText: "",
                    words: [],
                    anomalies: []
                };
            }

            documentList.push({
                id: filename,
                label: filename,
                imageSrc: imageUrl,
                imageAlt: `Document ${filename}`,
                ocrText: ocrData.fullText,
                anomalies: anomalies,
                ocrData: ocrData
            });
        }

        return json(documentList);

    } catch (err) {
        console.error('Documents API Error:', err);
        return json({ error: 'Failed to load documents' }, { status: 500 });
    }
};
