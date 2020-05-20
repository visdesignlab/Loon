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

export interface ComponentInitInfo {
	type: ComponentType,
	initArgs: Arguments
}

export enum ComponentType {
	Toolbar = "Toolbar",
	Plot2dPathsWidget = "Plot2dPathsWidget",
	MetricDistributionWidget = "MetricDistributionWidget",
	ImageSelectionWidget = "ImageSelectionWidget",
	ImageStackWidget = "ImageStackWidget",
	DetailedDistribution = "DetailedDistribution"
}

export interface Arguments {
	[argName: string]: any
}

export enum MetricDistributionSubComponentTypes {
	BasisSelect = "BasisSelect",
	ScatterplotSelect = "ScatterplotSelect",
	DistributionPlot = "DistributionPlot",
	Scatterplot = "Scatterplot"
}

export enum MetricDistributionCollectionLevel {
	Point = "Point",
	Curve = "Curve"
}
export interface AppData {
	GetFacetOptions: () => FacetOption[];
	OnBrushChange: () => void;
}

export interface FacetOption {
	name: string,
	GetFacets: () => Facet[]

}
export interface Facet {
	name: string,
	data: any
}

export interface DatasetSpec {
	uniqueId: string,
    displayName: string,
    googleDriveId: string,
	folderPath: string
}