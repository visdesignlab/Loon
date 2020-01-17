import { PointND } from './PointND';

export class CurveIterator implements Iterator<PointND> {
	
	constructor(pointList: PointND[])
	{
		this._index = 0;
		this._pointList = pointList;
	}

	private _index : number;
	public get index() : number {
		return this._index;
	}

	private _pointList : PointND[];
	public get pointList() : PointND[] {
		return this._pointList;
	}

	public next(): IteratorResult<PointND>
	{
		let point: PointND = this.pointList[this.index];
		let isDone: boolean =  this.index >= this.pointList.length;
		++this._index;
		let iterResult: IteratorResult<PointND> = {
			value: point,
			done: isDone
		}
		return iterResult;
	}

}