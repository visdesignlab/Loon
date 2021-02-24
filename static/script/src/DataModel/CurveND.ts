import { NDim } from '../devlib/DevlibTypes'
import { PointND } from './PointND';
import { DevlibAlgo } from '../devlib/DevlibAlgo';
import { PointCollection } from './PointCollection';
import { CurveIterator } from './CurveIterator';
import { AppData, DatasetSpec, Facet } from '../types';

export class CurveND extends PointCollection implements NDim {
	public CreateFilteredCurveList(): AppData<DatasetSpec> {
		throw new Error('Method not implemented.');
	}
	public ApplyDefaultFilters(): void {
		throw new Error('Method not implemented.');
	}
	
	constructor(id: string) {
		super();
		this._id = id;
		this._valueMap = new Map<string, number>();
		this._pointList = [];
		this._inBrush = true;
	}

	private _id : string;
	public get id() : string {
		return this._id;
	}

	private _inputKey : string;
	public get inputKey() : string {
		return this._inputKey;
	}

	private _valueMap : Map<string, number>;
	public get valueMap() : Map<string, number> {
		return this._valueMap;
	}

	private _pointList : PointND[];
	public get pointList() : PointND[] {
		return this._pointList;
	}

	private _inBrush : boolean;
	public get inBrush() : boolean {
		return this._inBrush;
	}

	public set inBrush(v: boolean) {
		this._inBrush = v;
		for (let point of this.pointList)
		{
			point.inBrush = v;
		}
	}

	protected getFacetList(): Facet[]
	{
		throw new Error('Not Implemented.');
	}

	public OnBrushChange(): void { }
	public ConsumeFilters(AppData: any): void {};

	public addValue(key: string, value: number)
	{
		this.valueMap.set(key, value);
	}

	public get(key: string): number | undefined
	{
		return this.valueMap.get(key);
	}

	// finds the value of the property with given key. Will interpolate.
	public getPointValue(inputValue: number, outputKey: string): number | undefined
	{
		let sortFunction = DevlibAlgo.compareProperty<PointND>(inputValue, (point: PointND) => 
		{
			return point.get(this.inputKey);
		});
		let pointIndex: number | [number, number];
		pointIndex = DevlibAlgo.BinarySearchIndex(this.pointList, sortFunction);

		if (typeof pointIndex === "number")
		{
			return this.pointList[pointIndex].get(outputKey);
		}
		const [idx1, idx2] = pointIndex;
		if (idx1 === undefined || idx2 === undefined)
		{
			// out of bounds
			return undefined;
		}
		const point1 = this.pointList[idx1];
		const point2 = this.pointList[idx2];

		const val1 = point1.get(outputKey);
		const val2 = point2.get(outputKey);

		const t1 = point1.get(this.inputKey);
		const t2 = point2.get(this.inputKey);

		const tDiff = t2 - t1;
		const portion = (inputValue - t1) / tDiff;
		const valDiff = val2 - val1;

		return val1 + valDiff * portion;
	}

	// finds point at given input time. Will construct a new point and interpolate all values if it is between points
	public getPoint(inputValue: number): PointND
	{
		let sortFunction = DevlibAlgo.compareProperty<PointND>(inputValue, (point: PointND) => 
		{
			return point.get(this.inputKey);
		});
		let pointIndex: number | [number, number];
		pointIndex = DevlibAlgo.BinarySearchIndex(this.pointList, sortFunction);
		if (typeof pointIndex === "number")
		{
			return this.pointList[pointIndex];
		}
		const [idx1, idx2] = pointIndex;
		if (idx1 === undefined || idx2 === undefined)
		{
			// out of bounds
			return undefined;
		}
		const point1 = this.pointList[idx1];
		const point2 = this.pointList[idx2];

		const t1 = point1.get(this.inputKey);
		const t2 = point2.get(this.inputKey);

		const tDiff = t2 - t1;
		const portion = (inputValue - t1) / tDiff;

		let interpolatedPoint = new PointND();
		interpolatedPoint.addValue(this.inputKey, inputValue);

		for (let [key, value] of point1.valueMap)
		{
			let val1 = point1.get(key);
			let val2 = point2.get(key);
			let valDiff = val2 - val1;
			interpolatedPoint.addValue(key, val1 + valDiff * portion);
		}
		interpolatedPoint.inBrush = point1.inBrush && point2.inBrush;
		return interpolatedPoint;
	}

	public getPointWeight(pointIndex: number): number
	{
		const idxLeft = Math.max(pointIndex - 1, 0);
		const idxRight = Math.min(pointIndex + 1, this.pointList.length - 1);
		const tLeft = this.pointList[idxLeft].get(this.inputKey);
		const tRight = this.pointList[idxRight].get(this.inputKey);
		return (tRight - tLeft ) / 2;
	}

	public addPoint(point: PointND): void
	{
		point.parent = this;
		this._pointList.push(point);
		this[this.length] = point;
		++this._length;
	}

	public sort(key: string): void
	{
		let sortFunction = DevlibAlgo.sortOnProperty<PointND>((point: PointND) => 
		{
			return point.get(key);
		});
		this.pointList.sort(sortFunction);
		this._inputKey = key;
	}

	[Symbol.iterator](): Iterator<PointND>
	{
		return new CurveIterator(this.pointList);
	}

}