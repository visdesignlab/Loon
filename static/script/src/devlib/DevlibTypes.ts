export interface StringToStringObj {
    [key: string]: string;
}

export interface TrackDerivationFunction
{
    (pointList: StringToNumberObj[]): number[];
}

export interface PointDerivationFunction
{
    (pointList: StringToNumberObj[]): number[][];
}


export type KeyedTrackDerivationFunction = [string[], TrackDerivationFunction];
export type KeyedPointDerivationFunction = [string[], PointDerivationFunction];



export interface NDim {
	valueMap: Map<string, number>,
	inBrush: boolean,
	addValue: (key: string, value: number) => void,
	get: (key: string) => number | undefined
}

export interface StringToNumberObj {
    [key: string]: number;
}

export interface Margin {
	top: number,
	right: number,
	bottom: number,
	left: number
}

export interface ButtonProps {
	displayName: string,
	callback: Function,
	iconUrl?: string,
	iconSize?: number,
	iconOnly?: boolean
}

export type SvgSelection = d3.Selection<SVGElement, any, Element, any>;
export type HtmlSelection = d3.Selection<HTMLElement, any, HTMLElement, any>;