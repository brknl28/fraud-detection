import { type Anomaly, type DocumentPreset, type OcrLine } from '$lib/types/anomaly';

type SeverityType = 'DANGER' | 'WARNING' | 'SAFE';

class DocumentStore {
	documents = $state<DocumentPreset[]>([]);
	isLoading = $state(true);
	isProcessingUpload = $state(false);

	imageSrc = $state('');
	imageAlt = $state('');
	imageNaturalWidth = $state(0);
	imageNaturalHeight = $state(0);
	activeDocumentId = $state<string>('');
	anomalies = $state<Anomaly[]>([]);
	ocrLines = $state<OcrLine[]>([]);
	fraudMarked = $state(false);
	ocrVisible = $state(false);
	allAnomaliesVisible = $state(false);
	checkedAnomalyIds = $state<Set<number>>(new Set());
	selectedOcrWordIds = $state<Set<number>>(new Set());
	ocrText = $state('');

	get visibleAnomalies() {
		if (!this.allAnomaliesVisible) return [];
		return this.anomalies;
	}

	get originalAnomalies() {
		return this.anomalies.filter((a) => a.type === 'original');
	}

	get forgedAnomalies() {
		return this.anomalies.filter((a) => a.type === 'forged');
	}

	get currentLabel() {
		const doc = this.documents.find((d) => d.id === this.activeDocumentId);
		return doc?.label ?? 'Unknown Document';
	}

	get checkedCount() {
		return this.checkedAnomalyIds.size;
	}

	get totalCount() {
		return this.anomalies.length;
	}

	get selectedOcrLines() {
		if (this.selectedOcrWordIds.size === 0) return [];
		return this.ocrLines.filter((_, idx) => this.selectedOcrWordIds.has(idx));
	}

	async init() {
		this.isLoading = true;
		try {
			const res = await fetch('/api/documents');
			if (!res.ok) throw new Error('Failed to load documents');

			const docs = await res.json();

			this.documents = docs.map((doc: any) => ({
				...doc,
				anomalies: this.assignRandomSeverity(doc.anomalies || [])
			}));

			if (this.documents.length > 0) {

				this.setDocument(this.documents[0].id);
			} else {

				console.warn('No documents returned from API');
			}
		} catch (err) {
			console.error('Init Error:', err);
		} finally {
			this.isLoading = false;
		}
	}

	rawOcrWords: any[] = [];

	mapWordsToLines(words: any[]) {
		if (this.imageNaturalWidth === 0 || this.imageNaturalHeight === 0) return;

		this.ocrLines = words.map((w: any) => {
			const { x0, y0, y1, x1 } = w.bbox;
			const height = y1 - y0;
			const width = x1 - x0;

			let severity = 'SAFE';
			const rand = Math.random();
			if (rand > 0.8) {
				severity = 'DANGER';
			} else if (rand > 0.6) {
				severity = 'WARNING';
			}

			return {
				text: w.text,
				x: x0 / this.imageNaturalWidth,

				y: y0 / this.imageNaturalHeight,
				width: width / this.imageNaturalWidth,
				height: height / this.imageNaturalHeight,

				fontSize: height / this.imageNaturalHeight,
				severity
			};
		});
	}

	toggleAnomaly(id: number) {
		const newSet = new Set(this.checkedAnomalyIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		this.checkedAnomalyIds = newSet;
	}

	isAnomalyChecked(id: number): boolean {
		return this.checkedAnomalyIds.has(id);
	}

	toggleAllAnomalies() {
		this.allAnomaliesVisible = !this.allAnomaliesVisible;
	}

	showAllAnomalies() {
		this.allAnomaliesVisible = true;
	}

	hideAllAnomalies() {
		this.allAnomaliesVisible = false;
	}

	toggleOcr() {
		this.ocrVisible = !this.ocrVisible;
	}

	get fraudScore(): number {
		if (this.anomalies.length === 0 && this.ocrLines.length === 0) return 98.5;

		let deduction = 0;

		for (const anomaly of this.anomalies) {
			if ((anomaly as any).severity === 'DANGER') deduction += 10;
			else if ((anomaly as any).severity === 'WARNING') deduction += 5;
			else deduction += 1;
		}

		for (const line of this.ocrLines) {
			const severity = (line as any).severity;
			if (severity === 'DANGER') deduction += 3;
			else if (severity === 'WARNING') deduction += 1;
		}

		const jitter = Math.random() * 0.5;
		const baseScore = Math.max(0, 100 - deduction - jitter);

		return Number(baseScore.toFixed(1));
	}

	get authenticityStatus(): 'SAFE' | 'CAUTION' | 'CRITICAL' {
		const score = this.fraudScore;
		if (score >= 85) return 'SAFE';
		if (score >= 50) return 'CAUTION';
		return 'CRITICAL';
	}

	private assignRandomSeverity(anomalies: Anomaly[]) {
		return anomalies.map((a) => {
			let severity = 'SAFE';
			const rand = Math.random();
			if (rand > 0.6) {
				severity = 'DANGER';
			} else if (rand > 0.3) {
				severity = 'WARNING';
			}
			return {
				...a,
				severity
			};
		});
	}

	toggleOcrWord(index: number) {
		const newSet = new Set(this.selectedOcrWordIds);
		if (newSet.has(index)) {
			newSet.delete(index);
		} else {
			newSet.add(index);
		}
		this.selectedOcrWordIds = newSet;
	}

	selectAllOcrWords() {
		const allIds = new Set(this.ocrLines.map((_, idx) => idx));
		this.selectedOcrWordIds = allIds;
	}

	deselectAllOcrWords() {
		this.selectedOcrWordIds = new Set();
	}

	isOcrWordSelected(index: number): boolean {
		return this.selectedOcrWordIds.has(index);
	}

	selectOcrWordsByType(type: SeverityType) {
		const newSet = new Set(this.selectedOcrWordIds);
		this.ocrLines.forEach((line, idx) => {
			const severity = (line as any).severity;
			const isDanger = severity === 'DANGER' || (line as any).category === 'critical';
			const isSafe = severity === 'SAFE';
			const isWarning = !isDanger && !isSafe;

			if (
				(type === 'DANGER' && isDanger) ||
				(type === 'WARNING' && isWarning) ||
				(type === 'SAFE' && isSafe)
			) {
				newSet.add(idx);
			}
		});
		this.selectedOcrWordIds = newSet;
	}

	deselectOcrWordsByType(type: SeverityType) {
		const newSet = new Set(this.selectedOcrWordIds);
		this.ocrLines.forEach((line, idx) => {
			const severity = (line as any).severity;
			const isDanger = severity === 'DANGER' || (line as any).category === 'critical';
			const isSafe = severity === 'SAFE';
			const isWarning = !isDanger && !isSafe;

			if (
				(type === 'DANGER' && isDanger) ||
				(type === 'WARNING' && isWarning) ||
				(type === 'SAFE' && isSafe)
			) {
				newSet.delete(idx);
			}
		});
		this.selectedOcrWordIds = newSet;
	}

	toggleOcrWordsByType(type: SeverityType) {
		// Check if all items of this type are selected
		const typeIndices: number[] = [];
		this.ocrLines.forEach((line, idx) => {
			const severity = (line as any).severity;
			const isDanger = severity === 'DANGER' || (line as any).category === 'critical';
			const isSafe = severity === 'SAFE';
			const isWarning = !isDanger && !isSafe;

			if (
				(type === 'DANGER' && isDanger) ||
				(type === 'WARNING' && isWarning) ||
				(type === 'SAFE' && isSafe)
			) {
				typeIndices.push(idx);
			}
		});

		const allSelected = typeIndices.every(idx => this.selectedOcrWordIds.has(idx));

		if (allSelected) {
			this.deselectOcrWordsByType(type);
		} else {
			this.selectOcrWordsByType(type);
		}
	}

	isTypeFullySelected(type: SeverityType): boolean {
		const typeIndices: number[] = [];
		this.ocrLines.forEach((line, idx) => {
			const severity = (line as any).severity;
			const isDanger = severity === 'DANGER' || (line as any).category === 'critical';
			const isSafe = severity === 'SAFE';
			const isWarning = !isDanger && !isSafe;

			if (
				(type === 'DANGER' && isDanger) ||
				(type === 'WARNING' && isWarning) ||
				(type === 'SAFE' && isSafe)
			) {
				typeIndices.push(idx);
			}
		});
		if (typeIndices.length === 0) return false;
		return typeIndices.every(idx => this.selectedOcrWordIds.has(idx));
	}

	isDuplicateDocument(name: string, size: number): boolean {
		return this.documents.some(doc => {

			const docName = doc.label || doc.id;
			return docName === name;
		});
	}

	markAsFraud() {
		this.fraudMarked = true;
	}

	markAsLegitimate() {
		this.fraudMarked = false;
	}

	setImage(src: string, alt: string = 'Uploaded document') {
		this.imageSrc = src;
		this.imageAlt = alt;
		this.activeDocumentId = 'upload';
		this.fraudMarked = false;
		this.ocrVisible = false;
		this.checkedAnomalyIds = new Set();
		this.anomalies = [];
		this.ocrLines = [];
		this.rawOcrWords = [];
		this.ocrText = '';
	}

	async uploadDocument(file: File) {
		this.isProcessingUpload = true;

		try {

			const formData = new FormData();
			formData.append('file', file);


			const response = await fetch('/api/ocr', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('OCR processing failed');
			}

			const ocrData = await response.json();


			const savedFilename = ocrData.savedFilename || file.name;
			const imageSrc = ocrData.imageSrc || `/assets/documents/${savedFilename}`;


			const newDoc = {
				id: savedFilename,
				label: savedFilename,
				imageSrc: imageSrc,
				imageAlt: `Document ${savedFilename}`,
				ocrText: ocrData.fullText || '',
				anomalies: ocrData.anomalies || [],
				ocrLines: [],
				ocrData: ocrData
			};


			if (!this.documents.some(d => d.id === savedFilename)) {
				this.documents = [...this.documents, newDoc];
			}


			this.activeDocumentId = savedFilename;
			this.imageSrc = imageSrc;
			this.imageAlt = `Document ${savedFilename}`;
			this.fraudMarked = false;
			this.ocrVisible = false;
			this.allAnomaliesVisible = false;
			this.checkedAnomalyIds = new Set();
			this.selectedOcrWordIds = new Set();


			this.ocrText = ocrData.fullText || '';
			this.anomalies = this.assignRandomSeverity(ocrData.anomalies || []);

			if (ocrData.words) {
				this.rawOcrWords = ocrData.words;
			}

		} catch (error) {
			console.error('Upload error:', error);
			this.ocrText = 'OCR processing failed';
		} finally {
			this.isProcessingUpload = false;
		}
	}

	private readFileAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	setDocument(id: string) {
		const preset = this.documents.find((doc) => doc.id === id);
		if (!preset) return;

		this.activeDocumentId = preset.id;
		this.imageSrc = preset.imageSrc;
		this.imageAlt = preset.imageAlt;
		this.anomalies = preset.anomalies || [];

		this.ocrText = preset.ocrText || '';


		this.fraudMarked = false;
		this.ocrVisible = false;
		this.allAnomaliesVisible = false;
		this.checkedAnomalyIds = new Set();
		this.ocrLines = [];
		this.selectedOcrWordIds = new Set();

		if ((preset as any).ocrData?.words) {
			this.rawOcrWords = (preset as any).ocrData.words;
			this.mapWordsToLines(this.rawOcrWords);
		}
	}

	setImageDimensions(width: number, height: number) {
		this.imageNaturalWidth = width;
		this.imageNaturalHeight = height;

		if (this.rawOcrWords.length > 0) {
			this.mapWordsToLines(this.rawOcrWords);
		}
	}

	nextDocument() {
		const currentIndex = this.documents.findIndex((doc) => doc.id === this.activeDocumentId);
		const nextIndex = (currentIndex + 1) % this.documents.length;
		this.setDocument(this.documents[nextIndex].id);
	}

	previousDocument() {
		const currentIndex = this.documents.findIndex((doc) => doc.id === this.activeDocumentId);
		const prevIndex = currentIndex <= 0 ? this.documents.length - 1 : currentIndex - 1;
		this.setDocument(this.documents[prevIndex].id);
	}

	reset() {
		if (this.documents.length > 0) {
			this.setDocument(this.documents[0].id);
		}
	}
}

export const documentStore = new DocumentStore();
