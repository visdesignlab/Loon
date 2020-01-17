import { StringToNumberObj } from '../devlib/DevlibTypes'

export class PointND {

	constructor(pojo?: StringToNumberObj)
	{
		this._valueMap = new Map<string, number>();
		for (let key in pojo)
		{
			const m: number = +pojo[key];
			this._valueMap.set(key, m);
		}
		this._inBrush = true;
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

	public addValue(key: string, value: number)
	{
		this.valueMap.set(key, value);
	}

	public get(key: string): number | undefined
	{
		return this.valueMap.get(key);
	}
}