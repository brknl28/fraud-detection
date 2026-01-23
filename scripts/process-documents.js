import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directory relative to this script
const DOCUMENTS_DIR = path.join(__dirname, '../static/assets/documents');

/**
 * Creates a unique key for a bounding box
 */
function createBboxKey(bbox, prefix = '') {
    const base = `${bbox.x0}-${bbox.y0}-${bbox.x1}-${bbox.y1}`;
    return prefix ? `${prefix}-${base}` : base;
}

/**
 * Checks if a word object has valid text and bounding box
 */
function isValidWord(word) {
    return word.text && word.text.trim().length > 0 && word.bbox;
}

/**
 * Attempts to add a word to the collection if not already seen
 * Returns true if added, false if duplicate
 */
function addWordToCollection(word, words, seenBboxes, bboxKey) {
    if (seenBboxes.has(bboxKey)) {
        return false;
    }
    seenBboxes.add(bboxKey);
    words.push({
        text: word.text,
        confidence: word.confidence || 0,
        bbox: word.bbox
    });
    return true;
}

/**
 * Extracts words from a single word array
 */
function extractWordsFromArray(wordArray, words, seenBboxes) {
    for (const word of wordArray) {
        if (isValidWord(word)) {
            const bboxKey = createBboxKey(word.bbox);
            addWordToCollection(word, words, seenBboxes, bboxKey);
        }
    }
}

/**
 * Processes a line to extract any missing words not found in word-level extraction
 */
function processMissingLineWords(line, words, seenBboxes) {
    if (!line.text || line.text.trim().length === 0 || !line.bbox) {
        return;
    }

    const lineWords = line.text.split(/\s+/).filter(w => w.length > 0);

    // Use Set for O(1) lookup instead of array with .includes()
    const existingLineWords = new Set(
        words
            .filter(w => w.bbox.y0 >= line.bbox.y0 - 5 && w.bbox.y1 <= line.bbox.y1 + 5)
            .map(w => w.text)
    );

    for (const lw of lineWords) {
        if (!existingLineWords.has(lw)) {
            const bboxKey = `line-${line.bbox.x0}-${line.bbox.y0}-${lw}`;
            addWordToCollection(
                { text: lw, confidence: line.confidence || 0, bbox: line.bbox },
                words,
                seenBboxes,
                bboxKey
            );
        }
    }
}

/**
 * Processes a single paragraph's lines for word extraction
 */
function processParagraphLines(lines, words, seenBboxes) {
    for (const line of lines) {
        extractWordsFromArray(line.words || [], words, seenBboxes);
        processMissingLineWords(line, words, seenBboxes);
    }
}

/**
 * Extracts words from OCR blocks structure
 */
function extractWordsFromBlocks(blocks, words, seenBboxes) {
    for (const block of blocks) {
        for (const paragraph of block.paragraphs || []) {
            processParagraphLines(paragraph.lines || [], words, seenBboxes);
        }
    }
}

/**
 * Extracts words from top-level lines array
 */
function extractWordsFromLines(lines, words, seenBboxes) {
    for (const line of lines) {
        extractWordsFromArray(line.words || [], words, seenBboxes);
    }
}

function extractWords(blocks, lines) {
    const words = [];
    const seenBboxes = new Set();

    if (blocks) {
        extractWordsFromBlocks(blocks, words, seenBboxes);
    }

    if (lines) {
        extractWordsFromLines(lines, words, seenBboxes);
    }

    return words;
}

/**
 * Pre-process image to enhance OCR detection for low-contrast areas
 * - Normalize brightness and contrast
 * - Convert to grayscale with enhanced contrast
 */
async function preprocessImage(imagePath) {
    const imageBuffer = await sharp(imagePath)
        // Normalize - stretches contrast automatically
        .normalize()
        // Increase brightness to help with gray backgrounds
        .modulate({
            brightness: 1.1,
            saturation: 0 // Convert to grayscale
        })
        // Apply stronger linear contrast boost (50% increase)
        .linear(1.5, -(128 * 0.5))
        // Sharpen to make text edges clearer
        .sharpen({ sigma: 2 })
        // Apply gamma correction to enhance mid-tones (gray text)
        .gamma(1.2)
        .toBuffer();

    return imageBuffer;
}

console.log(`Scanning directory: ${DOCUMENTS_DIR}`);

try {
    const files = await fs.readdir(DOCUMENTS_DIR);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    if (imageFiles.length === 0) {
        console.log('No image files found.');
    } else {
        console.log(`Found ${imageFiles.length} images to process.`);

        // Create worker with Turkish + English language support for mixed content
        const worker = await createWorker('tur+eng');

        // Configure for better recognition - use SINGLE_BLOCK to avoid skipping text
        await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            preserve_interword_spaces: '1',
        });

        for (const file of imageFiles) {
            console.log(`Processing: ${file}...`);
            const imagePath = path.join(DOCUMENTS_DIR, file);

            // Pre-process image for better OCR
            console.log('  Preprocessing image for enhanced contrast...');
            const processedBuffer = await preprocessImage(imagePath);

            const ret = await worker.recognize(processedBuffer);
            const { text, blocks, lines } = ret.data;

            const wordData = extractWords(blocks, lines);

            // Log detection summary
            console.log(`  Found ${wordData.length} words`);
            if (wordData.length > 0) {
                const sampleWords = wordData.slice(0, 8).map(w => w.text).join(', ');
                console.log(`  Sample: ${sampleWords}...`);
            }

            const outputData = {
                scanDate: new Date().toISOString(),
                fullText: text,
                words: wordData
            };

            const outputFilename = `${file}.ocr.json`;
            const outputPath = path.join(DOCUMENTS_DIR, outputFilename);

            await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));
            console.log(`  Saved OCR data to: ${outputFilename}`);
        }

        await worker.terminate();
        console.log('All documents processed successfully.');
    }
} catch (err) {
    console.error('Error processing documents:', err);
    process.exit(1);
}
