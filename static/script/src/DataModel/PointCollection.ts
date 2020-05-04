// import { PointND } from './PointND';
import { NDim } from '../devlib/DevlibTypes'
import { DataEvents } from './DataEvents';

export interface valueFilter {
	key: string,
	bound: [number, number]
}

export abstract class PointCollection implements Iterable<NDim>, ArrayLike<NDim> {
	
	constructor()
	{
		this._attributeList = [];
		this._length = 0;
		this._Array = [];
		this._minMaxCache = new Map<string, [number, number]>();
		this._brushList = new Map<string, Map<string, [number, number]>>();
	}

	abstract [Symbol.iterator](): Iterator<NDim>;

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
		if (!this.brushList.has(brushKey))
		{
			this.brushList.set(brushKey, new Map<string, [number, number]>());
		}
		let thisMap = this.brushList.get(brushKey);
		for (let filter of filters)
		{

			thisMap.set(filter.key, filter.bound)
		}
		this.updateBrush();
	}

	public removeBrush(brushKey: any): void
	{
		this.brushList.delete(brushKey);
		this.updateBrush();
	}

	private updateBrush(): void
	{
		for (let point of this)
		{
			point.inBrush = true;
			for (let valueFilterMap of this.brushList.values())
			{
				for (let [key, bound] of valueFilterMap)
				{
					let v: number = point.get(key);
					let [low, high] = bound;
					if (v < low || high < v)
					{
						point.inBrush = false;
					}
				}
			}
		}
		let event = new Event(DataEvents.brushChange);
		document.dispatchEvent(event);
	}

}


