export type AnomalyType = 'original' | 'forged';

export interface Anomaly {
	id: number;
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	type: AnomalyType;
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
}

export interface DocumentPreset {
	id: string;
	label: string;
	imageSrc: string;
	imageAlt: string;
	anomalies: Anomaly[];
	ocrText: string;
	ocrLines: OcrLine[];
}

export const defaultDocumentId = '';
export const documents = [];
