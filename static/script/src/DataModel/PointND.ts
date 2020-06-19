import { StringToNumberObj, NDim } from '../devlib/DevlibTypes'
import { CurveND } from './CurveND';

export class PointND implements NDim {

	constructor(pojo?: StringToNumberObj)
	{
		this._valueMap = new Map<string, number>();
		for (let key in pojo)
		{
			const m: number = +pojo[key];
			this._valueMap.set(key, m);
		}
		this._inBrush = true;
		this._parent = null;
	}

	private _valueMap : Map<string, number>;
	public get valueMap() : Map<string, number> {
		return this._valueMap;
	}

	private _inBrush : boolean;
	public get inBrush() : boolean {
		return this._inBrush;
	}
	public set inBrush(v: boolean) {
		this._inBrush = v;
	}
	
	private _parent : CurveND | null;
	public get parent() : CurveND | null {
		return this._parent;
	}
	public set parent(v : CurveND | null) {
		this._parent = v;
	}

	public addValue(key: string, value: number)
	{
		this.valueMap.set(key, value);
	}

	public get(key: string): number | undefined
	{
		return this.valueMap.get(key);
	}
}