import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCUMENTS_DIR = path.join(__dirname, '../static/assets/documents');

// Hardcoded data we want to preserve
const invoice1Anomalies = [
    { id: 1, text: 'Invoice ID', x: 70, y: 205, width: 420, height: 26, type: 'original' },
    { id: 2, text: 'Date', x: 430, y: 205, width: 140, height: 24, type: 'original' },
    { id: 3, text: 'Product line', x: 120, y: 332, width: 260, height: 18, type: 'original' },
    { id: 4, text: 'Total tax line', x: 120, y: 462, width: 360, height: 18, type: 'original' },
    { id: 5, text: 'Payment method line', x: 120, y: 535, width: 220, height: 18, type: 'original' },
    { id: 6, text: 'Issuer information', x: 70, y: 790, width: 500, height: 22, type: 'original' }
];

const invoice2Anomalies = [
    { id: 1, text: 'Company information', x: 40, y: 40, width: 250, height: 24, type: 'original' },
    { id: 2, text: 'Invoice number', x: 420, y: 110, width: 140, height: 22, type: 'original' },
    { id: 3, text: 'Customer ID location', x: 40, y: 160, width: 320, height: 18, type: 'original' },
    { id: 4, text: 'Total amount change suspicion', x: 420, y: 155, width: 140, height: 28, type: 'forged' },
    { id: 5, text: 'Payment status', x: 420, y: 185, width: 140, height: 22, type: 'original' }
];

// Map filename (or partial) to anomalies
const mapping = {
    'doc1.png': invoice1Anomalies, // Assuming User renamed or these are the new files
    'doc2.png': invoice2Anomalies,
    'invoice1.jpg': invoice1Anomalies, // Old names just in case
    'invoice2.png': invoice2Anomalies
};

try {
    const files = await fs.readdir(DOCUMENTS_DIR);

    for (const file of files) {
        if (!file.endsWith('.ocr.json')) continue;

        const imageFile = file.replace('.ocr.json', '');
        const matchingAnomalies = mapping[imageFile];

        if (matchingAnomalies) {
            console.log(`Injecting anomalies for ${imageFile}...`);
            const filePath = path.join(DOCUMENTS_DIR, file);
            try {
                const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
                content.anomalies = matchingAnomalies;
                await fs.writeFile(filePath, JSON.stringify(content, null, 2));
                console.log('Success.');
            } catch (e) {
                console.error(`Failed to patch ${file}:`, e);
            }
        }
    }
} catch (error) {
    console.error('Migration failed:', error);
}
