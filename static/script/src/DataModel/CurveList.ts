import { DevlibAlgo } from '../devlib/DevlibAlgo';
import { CurveND } from './CurveND';
import { PointND } from './PointND';
import { PointCollection } from './PointCollection';
import { CurveListIterator } from './CurveListIterator';
import { CurveCollection } from './CurveCollection';
import { DatasetSpec, Facet, AppData, LocationMapList, dataFilter, valueFilter, FacetOption } from '../types';
import { CurveListFactory } from './CurveListFactory';
import d3 = require('d3');

export class CurveList extends PointCollection implements AppData<DatasetSpec>
{

	constructor(curveList: CurveND[], spec: DatasetSpec)
	{
		super();
		this._curveList = curveList;
		this._length = 0;
		let i = 0;
		this._curveLookup = new Map<string, CurveND>();
		for (let curve of this.curveList)
		{
			this.curveLookup.set(curve.id, curve);
			this._length += curve.length;
			for (let point of curve)
			{
				this[i] = point;
				++i;
			}
		}
		this._minMaxMap = new Map<string, [number, number]>();
		this._inverseLocationMap = new Map<number, string[]>();
		this._averageFilteredCurveCache = new Map<string, [number, number][]>();
		this._averageCurveCache = new Map<string, [number, number][]>();
		this._locationFrameSegmentLookup = new Map<number, Map<number, Map<number, [PointND, number]>>>();
		const locationSet = new Set<number>();
		for (let i = 0; i < this.length; i++)
		{
			let point = this[i] as PointND;
			let loc = point.get('Location ID');
			locationSet.add(loc);
			if (!this._locationFrameSegmentLookup.has(loc))
			{
				this._locationFrameSegmentLookup.set(loc, new Map());
			}
			const locMap = this._locationFrameSegmentLookup.get(loc);
			let frame = point.get('Frame ID');
			if (!locMap.has(frame))
			{
				locMap.set(frame, new Map());
			}
			const segMap = locMap.get(frame);
			let segmentLabel = point.get('segmentLabel');
			segMap.set(segmentLabel, [point, i + 1]);
		}
		this._locationList = Array.from(locationSet);
		this.locationList.sort(DevlibAlgo.sortAscend);
		this._curveCollection = new CurveCollection(this, spec);
		this._curveBrushList = new Map<string, [valueFilter, valueFilter]>();
		this.Specification = spec;
		this._conditionFilterState = new Map<string, Map<string, boolean>>();
		for (let yKey of this.defaultFacetAxisTicks.yAxisTicks)
		{
			let thisMap = new Map<string, boolean>();
			for (let xKey of this.defaultFacetAxisTicks.xAxisTicks)
			{
				thisMap.set(xKey, true);
			}
			this.conditionFilterState.set(yKey, thisMap);
		}
	}

	private _curveList : CurveND[];
	public get curveList() : CurveND[] {
		return this._curveList;
	}

	private _curveLookup : Map<string, CurveND>;
	public get curveLookup() : Map<string, CurveND> {
		return this._curveLookup;
	}

	private _curveCollection : CurveCollection;
	public get curveCollection() : CurveCollection {
		return this._curveCollection;
	}
	public set curveCollection(v : CurveCollection) {
		this._curveCollection = v;
	}	

	private _inputKey : string;
	public get inputKey() : string {
		return this._inputKey;
	}

	private _minMaxMap : Map<string, [number, number]>;
	public get minMaxMap() : Map<string, [number, number]> {
		if (this._minMaxMap.size === 0)
		{
			this.updateMinMaxMap()
		}
		return this._minMaxMap;
	}

	
	private _inverseLocationMap : Map<number, string[]>;
	public get inverseLocationMap() : Map<number, string[]> {
		if (this._inverseLocationMap.size === 0)
		{
			this.generateInverseLocationMap();
		}
		return this._inverseLocationMap;
	}

	private _averageFilteredCurveCache: Map<string, [number, number][]>;
	private _averageCurveCache: Map<string, [number, number][]>;
	public getAverageCurve(avgKey: string, filteredOnly: boolean = false,  smoothed: boolean = false): [number, number][]
	{
		let cacheKey = avgKey;
		if (smoothed)
		{
			cacheKey = cacheKey + '-smoothed-out-real-nice-now';
		}
		let cache: Map<string, [number, number][]>
		if (filteredOnly)
		{
			cache = this._averageFilteredCurveCache;
		}
		else
		{
			cache = this._averageCurveCache;
		}
		if (cache.has(cacheKey))
		{
			return cache.get(cacheKey)
		}
		
		let sumCountMap: Map<number, [number, number]> = new Map<number, [number, number]>();

		for (let point of this)
		{
			if (filteredOnly && !point.inBrush)
			{
				continue;
			}
			let frame = point.get('Frame ID');
			let mass = point.get(avgKey);
			let [sum, count] = sumCountMap.has(frame) ? sumCountMap.get(frame) : [0, 0];
			sumCountMap.set(frame, [sum + mass, count + 1] );
		}
		let frameList = Array.from(sumCountMap.keys()).sort((a,b) => a-b);
		let avgCurve: [number, number][] = frameList.map(frame => 
			{
				let [sum, count] = sumCountMap.get(frame);
				return [frame, sum / count];
			});
		if (smoothed)
		{
			avgCurve = CurveList.medianFilter(avgCurve);
		}
		cache.set(cacheKey, avgCurve);
		return avgCurve;
	}

	public static medianFilter(points: [number, number][], window: number = 3): [number, number][]
	{
		const smoothedPoints: [number, number][] = points.map((value, index) =>
		{
			const [x, y] = value;

			const start = Math.max(0, index - window);
			const end = Math.min(points.length, index + window + 1);
			const slice = points.slice(start, end);
			let newY = d3.median(slice, d => d[1]);
			return [x, newY];
		});
		return smoothedPoints;
	}

	private _defaultFacetAxisTicks: {
		xAxisTicks: string[],
		yAxisTicks: string[],
		axisLabels: [string, string]
	}
	public get defaultFacetAxisTicks(): {
		xAxisTicks: string[],
		yAxisTicks: string[],
		axisLabels: [string, string]
	}
	{
		if (this._defaultFacetAxisTicks)
		{
			return this._defaultFacetAxisTicks
		}
		let facetOptions: FacetOption[] = this.GetFacetOptions();
		let firstFacetOption = facetOptions[0];
		let secondFacetOption = facetOptions[1];

		const yKeys = Object.keys(this.Specification.locationMaps[firstFacetOption.name]);
		const xKeys = Object.keys(this.Specification.locationMaps[secondFacetOption.name]);
		let axisLabels: [string, string] = [firstFacetOption.name, secondFacetOption.name];


		let returnObject = {
			xAxisTicks: xKeys,
			yAxisTicks: yKeys,
			axisLabels: axisLabels
		}
		this._defaultFacetAxisTicks = returnObject;
		return returnObject;
	}

	private _defaultFacets:  Map<string, Map<string, CurveList>>

    public get defaultFacets(): Map<string, Map<string, CurveList>>
	{
		if (this._defaultFacets)
		{
			return this._defaultFacets
		}
		const drugIdx = 0;
		const concIdx = 1;
		let facetOptions: FacetOption[] = this.GetFacetOptions();
		let firstFacetOption = facetOptions[drugIdx];
		let firstFacets: Facet[] = firstFacetOption.GetFacets();
		let nestedFacetMap: Map<string, Map<string, CurveList>> = new Map();
		for (let {name: categoryName, data: data} of firstFacets)
		{
			let facetOption = data.GetFacetOptions()[concIdx];
			let subFacets: Facet[] = facetOption.GetFacets();
			let thisDict = new Map<string, CurveList>();
			for (let subFacet of subFacets)
			{
				thisDict.set(subFacet.name[0], subFacet.data);
			}
			nestedFacetMap.set(categoryName[0], thisDict);
		}

		this._defaultFacets = nestedFacetMap;
		return nestedFacetMap;
    }

	private clearDefaultFacetCache(): void
	{
		for (let map of this.defaultFacets.values())
		{
			for (let curveList of map.values())
			{
				curveList._averageFilteredCurveCache.clear();
			}
		}
	}


	// private _locationFrameSegmentLookup : Map<string, [PointND, number]>;
	private _locationFrameSegmentLookup : Map<number, Map<number, Map<number, [PointND, number]>>>;

	private _locationList : number[];
	public get locationList() : number[] {
		return this._locationList;
	}	

	public CreateFilteredCurveList(): CurveList
	{
		let filteredCurveArray = this.curveList.filter(curve => curve.inBrush);
		return new CurveList(filteredCurveArray, this.Specification);
	}

	public ApplyDefaultFilters(): void
	{
		const trackLengthKey = 'Track Length';

		const [_, maxLength] = this.curveCollection.getMinMax(trackLengthKey);
		const filter: valueFilter = {
			key: trackLengthKey,
			bound: [maxLength / 2, maxLength]
		}

		// default to every other secondary filter. e.g. every other concentration
		for (let i = 1; i < this.defaultFacetAxisTicks.xAxisTicks.length; i+=2)
		{
			const xKey = this.defaultFacetAxisTicks.xAxisTicks[i];
			for (let yKey of this.defaultFacetAxisTicks.yAxisTicks)
			{
				this.conditionFilterState.get(yKey).set(xKey, false)
			}
		}
		this.curveCollection.addBrushNoUpdate('default', filter);
	}

	public GetAllFilters(): dataFilter[]
	{
		let dataFilters: dataFilter[] = [];
		// curve filters
		for (let [key, filters] of this.curveBrushList.entries())
		{
			dataFilters.push({
				type: 'curve',
				filterKey: key,
				filter: filters
			});
		}

		// cell filters
		for (let [key, filterMap] of this.brushList.entries())
		{
			for (let [attributeKey, extent] of filterMap.entries())
			{
				dataFilters.push({
					type: 'cell',
					filterKey: key,
					filter: {
						key: attributeKey,
						bound: extent
					}
				});
			}
		}

		// track filters
		for (let [key, filterMap] of this.curveCollection.brushList.entries())
		{
			for (let [attributeKey, extent] of filterMap.entries())
			{
				dataFilters.push({
					type: 'track',
					filterKey: key,
					filter: {
						key: attributeKey,
						bound: extent
					}
				});
			}
		}

		return dataFilters;
	}

	public ConsumeFilters(otherCurveList: CurveList): void
	{

		// curve filters
		for (let [key, filters] of otherCurveList.curveBrushList.entries())
		{
			this.curveBrushList.set(key + Date.now(), filters);
		}

		// cell filters
		for (let [key, filterMap] of otherCurveList.brushList.entries())
		{
			let timedKey = key + Date.now();
			for (let [attributeKey, extent] of filterMap.entries())
			{
				this.addBrushNoUpdate(timedKey, {
					key: attributeKey,
					bound: extent
				});
			}
		}

		// track filters
		for (let [key, filterMap] of otherCurveList.curveCollection.brushList.entries())
		{
			let timedKey = key + Date.now();
			for (let [attributeKey, extent] of filterMap.entries())
			{
				this.curveCollection.addBrushNoUpdate(timedKey, {
					key: attributeKey,
					bound: extent
				});
			}
		}
	}

	public ApplyNewFilter(): void
	{
		this.OnBrushChange();
		const inFilterLocations: Set<number> = this.generateInFilterLocations();
		for (let curve of this.curveList)
		{
			const firstPoint = curve.pointList[0];
			const location = firstPoint.get('Location ID');
			if (!inFilterLocations.has(location))
			{
				curve.inBrush = false;
			}
		}
	}

	private generateInFilterLocations(): Set<number>
	{
		const inFilterSet = new Set<number>();
		const [label1, label2] = this.defaultFacetAxisTicks.axisLabels
		for (let key1 of this.conditionFilterState.keys())
		{
			let numberRangeList1 = this.Specification.locationMaps[label1][key1];
			let numberSet1 = CurveList.numberRangeListToSet(numberRangeList1);
			let rowMap = this.conditionFilterState.get(key1);
			for (let [key2, value] of rowMap.entries())
			{
				if (value)
				{
					let numberRangeList2 = this.Specification.locationMaps[label2][key2];
					let numberSet2 = CurveList.numberRangeListToSet(numberRangeList2);
					let intersection: number[] = [...numberSet1].filter(x => numberSet2.has(x));
					for (let val of intersection)
					{
						inFilterSet.add(val);
					}
				}
			}
		}

		return inFilterSet;
	}

	private static numberRangeListToSet(numberRangeList: [number, number][]): Set<number>
	{
		const numberSet = new Set<number>();
		for (let [low, high] of numberRangeList)
		{
			for (let i = low; i <= high; i++)
			{
				numberSet.add(i);
			}
		}
		return numberSet;
	}

	public GetCellsAtFrame(locationId: number, frameId: number): PointND[]
	{
		if (this._locationFrameSegmentLookup.has(locationId))
		{
			const frameMap = this._locationFrameSegmentLookup.get(locationId);
			if (frameMap.has(frameId))
			{
				const segMap = frameMap.get(frameId);
				const tuplelist = segMap.values();
				let pointList: PointND[] = [];
				for (let [point, _] of tuplelist)
				{
					pointList.push(point);
				}
				return pointList;
			}
		}
		return [];
	}

	public GetCellFromLabel(locationId: number, frameId: number, segmentLabel: number): [PointND, number] | [null, null]
	{
		if (this._locationFrameSegmentLookup.has(locationId))
		{
			const frameMap = this._locationFrameSegmentLookup.get(locationId);
			if (frameMap.has(frameId))
			{
				const segMap = frameMap.get(frameId);
				if (segMap.has(segmentLabel))
				{
					return segMap.get(segmentLabel);
				}
			}
		}
		return [null, null];
	}

	private _brushApplied : boolean;
	public get brushApplied() : boolean {
		return this._brushApplied;
	}
	public set brushApplied(v : boolean) {
		this._brushApplied = v;
	}
	
	private _curveBrushList : Map<string, [valueFilter, valueFilter]>;
	public get curveBrushList() : Map<string, [valueFilter, valueFilter]> {
		return this._curveBrushList;
	}

	private _conditionFilterState : Map<string, Map<string, boolean>>;
	public get conditionFilterState() : Map<string, Map<string, boolean>> {
		return this._conditionFilterState;
	}

	protected getFacetList(locationMap: LocationMapList): Facet[]
	{
		return CurveListFactory.CreateFacetedDatasets(this, locationMap);
	}

	public OnBrushChange(): void
	{
		this.clearDefaultFacetCache();
		this._averageFilteredCurveCache.clear();
		for (let curve of this.curveList)
		{
			curve.inBrush = true;
			for (let point of curve.pointList)
			{
				point.inBrush = true;
			}
		}
		// sets filter values at point level
		const pointBrushApplied: boolean = this.SetBrushValues();

		// set track to false if all the points in a track are also false
		for (let curve of this.curveList)
		{
			let allPointsHidden = true;
			for (let point of curve.pointList)
			{
				if (point.inBrush)
				{
					allPointsHidden = false;
					break;
				}
			}
			if (allPointsHidden)
			{
				curve.inBrush = false;
			}
		}

		// sets filter values at track level
		const curveCollectionBrushApplied: boolean = this.curveCollection.SetBrushValues();
		const curveBrushApplied: boolean = this.setCurveBrushValues();
		this._brushApplied = pointBrushApplied || curveBrushApplied || curveCollectionBrushApplied;
	}

	private setCurveBrushValues(): boolean
	{
		let brushApplied = false;
		for (let curve of this.curveList)
		{
			let allPointsOutOfBrush = true;
			for (let point of curve.pointList)
			{
				if (this.isPointInCurveBrushList(point))
				{
					allPointsOutOfBrush = false;
					break;
				}
			}
			if (allPointsOutOfBrush)
			{
				curve.inBrush = false;
				brushApplied = true
			}
		}
		return brushApplied;
	}

	private isPointInCurveBrushList(point: PointND): boolean
	{
		for (let valueFilterList of this.curveBrushList.values())
		{
			for (let valueFilter of valueFilterList)
			{
				if (!PointCollection.IsInBrush(point, valueFilter))
				{
					return false;
				}
			}
		}
		return true;
	}

	private updateMinMaxMap()
	{
		for (let curve of this.curveList)
		{
			for (let point of curve.pointList)
			{
				for (let [key, value] of point.valueMap)
				{
					let currentVal = this._minMaxMap.get(key);
					let pointVal = point.get(key);
					if (typeof currentVal === "undefined")
					{
						this._minMaxMap.set(key, [pointVal, pointVal]);
						continue;
					}
					let [c1, c2] = currentVal;
					let newVal: [number, number] = [Math.min(c1, pointVal), Math.max(c2, pointVal)];
					this._minMaxMap.set(key, newVal);
				}
			}
		}
	}

	private generateInverseLocationMap(): void
	{	
		for (let categoryName of Object.keys(this.Specification.locationMaps))
		{
			const conditionBreakdown = this.Specification.locationMaps[categoryName];
			for (let conditionName of Object.keys(conditionBreakdown))
			{
				const numberRangeList = conditionBreakdown[conditionName];
				for (let [low, high] of numberRangeList)
				{
					for (let i = low; i <= high; i++)
					{
						if (!this._inverseLocationMap.has(i))
						{
							this._inverseLocationMap.set(i, []);
						}
						this._inverseLocationMap.get(i).push(conditionName);
					}
				}
			}
		}
	}

	private initValue(key: string, value: number): void
	{
		for (let curve of this.curveList)
		{
			curve.addValue(key, value);
		}
	}

	private isKeySet(key: string): boolean
	{
		for (let curve of this.curveList)
		{
			let value: number | undefined = curve.get(key);
			if (typeof value === "undefined")
			{
				return false;
			}
		}
		return true;
	}

	public setInputKey(key: string): void
	{
		this._inputKey = key;
		for (let curve of this.curveList)
		{
			curve.sort(key);
		}
	}

	public removeCurveBrush(brushKey: string): void
	{
		this.curveBrushList.delete(brushKey);
		this.updateBrush();
	}

	public addCurveBrush(brushKey: string, filters: [valueFilter, valueFilter]): void
	{
		this.curveBrushList.set(brushKey, filters);
		this.updateBrush();
	}

	public sort(key: string, ascend: boolean = true): void
	{
		let sortFunction = DevlibAlgo.sortOnProperty<CurveND>((curve: CurveND) => 
		{
			return curve.get(key);
		}, ascend);
		this.curveList.sort(sortFunction);
	}

	public getPointsAtInput(inputValue: number): PointND[]
	{
		let pointList: PointND[] = [];
		for (let curve of this.curveList)
		{
			let point = curve.getPoint(inputValue);
			// console.log(point);
			if (point)
			{
				pointList.push(point);
			}
		}

		return pointList;
	}

	public calculateDepth(depthKey: string, valueKey: string): void
	{
		if (this.isKeySet(depthKey))
		{
			// depth is already set
			return;
		}
		this.initValue(depthKey, 0);

		const allBands = CurveList.getAllPossible2Bands(this.curveList) as [CurveND, CurveND][];
		for (let band of allBands)
		{
			for (let curve of this.curveList)
			{
				const depthContribution = this.getDepthContribution(curve, band, valueKey);
				const oldDepth = curve.get(depthKey);
				curve.addValue(depthKey, oldDepth + depthContribution);
			}
		}

		// todo - normalize

	}

	private getDepthContribution(curve: CurveND, [b1, b2]: [CurveND, CurveND], valueKey: string): number
	{
		let depth = 0;
		for (let i = 0; i < curve.pointList.length; i++)
		{
			let point: PointND = curve.pointList[i];
			const t = point.get(this.inputKey);
			let thisVal = point.get(valueKey);
			let b1Val = b1.getPointValue(t, valueKey);
			let b2Val = b2.getPointValue(t, valueKey);
			let minVal = Math.min(b1Val, b2Val);
			let maxVal = Math.max(b1Val, b2Val);
			if (minVal <= thisVal && thisVal <= maxVal)
			{
				const weight = curve.getPointWeight(i);
				depth += weight;
			}
		}
		return depth;
	}

	static getAllPossible2Bands(list: any[]): [any, any][]
	{
		const bandList: [any, any][] = [];
		for (let i = 0; i < list.length; i++)
		{
			for (let j = i + 1; j < list.length; j++)
			{
				let b: [any, any] = [list[i], list[j]];
				bandList.push(b);
			}
		}
		return bandList
	}

	[Symbol.iterator](): Iterator<PointND>
	{
		return new CurveListIterator(this.curveList);
	}

}