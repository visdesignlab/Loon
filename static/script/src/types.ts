export interface Frame<T> {
	fraction?: number, // if no fraction is specified, it is assumed to be equal weight
	minSize?: number,
	maxSize?: number,
	direction: Direction,

	inside: Frame<T>[] | T
}

export enum Direction {
	row = "row",
	column = "col"
}

export enum ComponentType {
	Toolbar = "Toolbar",
	// Console = "Console",
	Plot2dPathsWidget = "Plot2dPathsWidget",
	// TableWidget = "TableWidget",
	// LevelOfDetailWidget = "LevelOfDetailWidget",
	MetricDistributionWidget = "MetricDistributionWidget"
}

export enum MetricDistributionSubComponentTypes {
	BasisSelect = "BasisSelect",
	ScatterplotSelect = "ScatterplotSelect",
	DistributionPlot = "DistributionPlot",
	Scatterplot = "Scatterplot"
}

// export interface Label
// {
// 	padSize: [number, number],
// 	anchorElement: Element,
// 	position: LabelPosition,
// 	text: string,
// 	oval: boolean, // if true maximum corner rounding applied, otherwise, only minmal rounding
// 	callBeforeNext?: Function
// }

// export enum LabelPosition {
// 	// Top = "Top", // top is harder to program, and I don't need it..
// 	Right = "Right",
// 	Bottom = "Bottom",
// 	Left = "Left"
// }