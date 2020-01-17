import { PointND } from './PointND';
import { CurveND } from './CurveND';
import { CurveIterator } from './CurveIterator';

export class CurveListIterator implements Iterator<PointND> {
	
	constructor(curveList: CurveND[])
	{
		this._curveList = curveList;
		this.updateCurveIterator(0);
	}

	private _index : number;
	public get index() : number {
		return this._index;
	}

	private _curveList : CurveND[];
	public get curveList() : CurveND[] {
		return this._curveList;
	}

	private _currentCurveIterator : CurveIterator;
	public get currentCurveIterator() : CurveIterator {
		return this._currentCurveIterator;
	}

	public next(): IteratorResult<PointND>
	{
		let nextResult = this.currentCurveIterator.next();
		if (!nextResult.done)
		{
			return nextResult;
		}
		let newIndex = this.index + 1;
		if (newIndex >= this.curveList.length)
		{
			return {
				done: true,
				value: undefined
			};
		}
		this.updateCurveIterator(newIndex);
		return this.next();
	}

	private updateCurveIterator(newIndex: number): void
	{
		this._index = newIndex;
		let nextCurve = this.curveList[newIndex];
		if (nextCurve)
		{
			this._currentCurveIterator = new CurveIterator(nextCurve.pointList);
		}
	}


}