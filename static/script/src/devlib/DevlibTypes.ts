export interface StringToStringObj {
    [key: string]: string;
}

export interface DerivationFunction
{
    (pointList: StringToNumberObj[]): number;
}

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
	callback: Function
}

export type SvgSelection = d3.Selection<SVGElement, any, Element, any>;
export type HtmlSelection = d3.Selection<HTMLElement, any, HTMLElement, any>;