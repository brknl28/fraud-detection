export type AnomalyType = 'original' | 'forged';

export interface Anomaly {
	id: number;
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	type: AnomalyType;
	severity?: 'DANGER' | 'WARNING' | 'SAFE';
}

export interface DocumentState {
	imageSrc: string;
	imageAlt: string;
	imageNaturalWidth: number;
	imageNaturalHeight: number;
	anomalies: Anomaly[];
	ocrLines: OcrLine[];
	fraudMarked: boolean;
	ocrVisible: boolean;
	allAnomaliesVisible: boolean;
	checkedAnomalyIds: Set<number>;
}

export interface OcrLine {
	text: string;
	x: number;
	y: number;
	width?: number;
	height?: number;
	fontSize?: number;
	confidence?: number;
	severity?: 'DANGER' | 'WARNING' | 'SAFE';
}

export interface DocumentPreset {
	id: string;
	label: string;
	imageSrc: string;
	imageAlt: string;
	anomalies: Anomaly[];
	ocrText: string;
	ocrLines: OcrLine[];
	ocrData?: {
		fullText?: string;
		words?: Array<{
			text: string;
			confidence?: number;
			bbox: {
				x0: number;
				y0: number;
				x1: number;
				y1: number;
			};
		}>;
	};
}

export const defaultDocumentId = '';
export const documents = [];
