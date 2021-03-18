export interface StringToStringObj {
    [key: string]: string;
}

export interface TrackDerivationFunction
{
    (pointList: StringToNumberObj[]): number[] | null;
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
	callback: Function
}

export type ToolbarElement = ToolbarSingleButton | ToolbarPopupButton | ToolbarOptionSelect | ToolbarToggleButton;

export interface ToolbarSingleButton {
	type: 'single',
	iconKey: string,
	callback: (state: any) => void,
	tooltip: string
}

export interface ToolbarToggleButton {
	type: 'toggleButton',
	iconKeys: string[],
	callback: (state: any) => void,
	tooltips: string[]
}

export interface ToolbarPopupButton {
	type: 'popupButton',
	iconKey: string,
	callback: (state: any) => void,
	tooltip: string
}

export interface ToolbarOptionSelect {
	type: 'optionSelect',
	iconKeys: string[],
	defaultIndex: number,
	callback: (state: any) => void,
	tooltips: string[]
}

export type SvgSelection = d3.Selection<SVGElement, any, Element, any>;
export type HtmlSelection = d3.Selection<HTMLElement, any, HTMLElement, any>;