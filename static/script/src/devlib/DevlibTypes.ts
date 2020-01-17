export interface StringToStringObj {
    [key: string]: string;
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