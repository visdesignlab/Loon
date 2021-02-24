import { NDim } from '../devlib/DevlibTypes'
import { DataEvents } from './DataEvents';
import { AppData, FacetOption, Facet, DatasetSpec, LocationMapList, LocationMapTemplate, valueFilter } from '../types';


export abstract class PointCollection implements Iterable<NDim>, ArrayLike<NDim>, AppData<DatasetSpec> {
	
	constructor(pointList: NDim[] = [])
	{
		this._attributeList = [];
		this._length = pointList.length;
		this._Array = pointList;
		this._minMaxCache = new Map<string, [number, number]>();
		this._brushList = new Map<string, Map<string, [number, number]>>();
	}

	abstract [Symbol.iterator](): Iterator<NDim>;

	private _Specification : DatasetSpec;
	public get Specification() : DatasetSpec {
		return this._Specification;
	}
	public set Specification(v : DatasetSpec) {
		this._Specification = v;
	}

	private _sourceKey : string;
	public get sourceKey() : string {
		return this._sourceKey;
	}
	public set sourceKey(v: string) {
		this._sourceKey = v;
	}
	
	private _postfixKey : string;
	public get postfixKey() : string {
		return this._postfixKey;
	}
	public set postfixKey(v : string) {
		this._postfixKey = v;
	}

	protected _length : number;
	public get length() : number {
		return this._length;
	}

	[n: number]: NDim;

	private _attributeList : string[];
	public get attributeList() : string[] {
		if (this._attributeList.length === 0)
		{
			this.initAttributeList();
		}
		return this._attributeList;
	}


	private _Array : NDim[];
	public get Array() : NDim[] {
		if (this._Array.length === 0)
		{
			this._Array = Array.from(this);
		}
		return this._Array;
	}

	private _minMaxCache : Map<string, [number, number]>;
	private get minMaxCache() : Map<string, [number, number]> {
		return this._minMaxCache;
	}

	private _brushList : Map<string, Map<string, [number, number]>> ;
	public get brushList() : Map<string, Map<string, [number, number]>>  {
		return this._brushList;
	}

	public abstract OnBrushChange(): void;
	public abstract CreateFilteredCurveList(): AppData<DatasetSpec>;
	public abstract ApplyDefaultFilters(): void;

	public GetFacetOptions(): FacetOption[]
	{
		if (!this.Specification.locationMaps)
		{
			return [];
		}
		let facetOptionList = [];
		for (let key of Object.keys(this.Specification.locationMaps))
		{
			let locationMap = this.Specification.locationMaps[key];
			let facetOption: FacetOption = 
			{
				name: key,
				GetFacets: () => {return this.getFacetList(locationMap)}
			}
			facetOptionList.push(facetOption)
		}
		return facetOptionList;
	}

	protected abstract getFacetList(locationMap: LocationMapList | LocationMapTemplate): Facet[];

	private initAttributeList(): void
	{
		let pointList = [...this];
		if (pointList.length > 0)
		{
			let point = pointList[0];
			for (let key of point.valueMap.keys())
			{
				this._attributeList.push(key);
			}
		}
	}

	public getMinMax(key: string): [number, number]
	{
		if (this.minMaxCache.has(key))
		{
			return this.minMaxCache.get(key);
		}
		let minN: number = Infinity;
		let maxN: number = -Infinity;

		for (let point of this)
		{
			let val = point.valueMap.get(key);
			if (val < minN)
			{
				minN = val;
			}
			if (val > maxN)
			{
				maxN = val;
			}
		}
		this.minMaxCache.set(key, [minN, maxN]);
		return [minN, maxN]
	}

	public addBrush(brushKey: string, ...filters: valueFilter[]): void
	{
		this.addBrushNoUpdate(brushKey, ...filters);
		this.updateBrush();
	}

	public addBrushNoUpdate(brushKey: string, ...filters: valueFilter[]): void
	{
		if (!this.brushList.has(brushKey))
		{
			this.brushList.set(brushKey, new Map<string, [number, number]>());
		}
		let thisMap = this.brushList.get(brushKey);
		for (let filter of filters)
		{
			thisMap.set(filter.key, filter.bound)
		}
		return
	}

	public removeBrush(brushKey: any): void
	{
		this.brushList.delete(brushKey);
		this.updateBrush();
	}

	public SetBrushValues(): boolean
	{
		let brushApplied = false;
		for (let point of this)
		{
			for (let valueFilterMap of this.brushList.values())
			{
				for (let [key, bound] of valueFilterMap)
				{
					let valueFilter = {
						key: key,
						bound: bound
					}
					if (!PointCollection.IsInBrush(point, valueFilter))
					{
						point.inBrush = false;
						brushApplied = true;
					}
				}
			}
		}
		return brushApplied;
	}

	public static IsInBrush(point: NDim, valueFilter: valueFilter): boolean
	{
		let v: number = point.get(valueFilter.key);
		let [low, high] = valueFilter.bound;
		return low <= v && v <= high && !isNaN(v);
	}

	public updateBrush(): void
	{
		let event = new Event(DataEvents.brushChange);
		document.dispatchEvent(event);
	}

}


