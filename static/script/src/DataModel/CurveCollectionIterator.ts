import { NDim } from '../devlib/DevlibTypes';

// import { PointND } from './PointND';
import { CurveList } from './CurveList';
// import { CurveIterator } from './CurveIterator';

export class CurveCollectionIterator implements Iterator<NDim> {
	
	constructor(curveList: CurveList)
	{
        this._index = 0;
		this._curveList = curveList;
	}

	private _index : number;
	public get index() : number {
		return this._index;
	}

	private _curveList : CurveList;
	public get curveList() : CurveList {
		return this._curveList;
	}

	// private _currentCurveIterator : CurveIterator;
	// public get currentCurveIterator() : CurveIterator {
	// 	return this._currentCurveIterator;
	// }

	public next(): IteratorResult<NDim>
	{
		let curve = this.curveList.curveList[this.index];
		let isDone: boolean =  this.index >= this.curveList.curveList.length;
		++this._index;
		let iterResult: IteratorResult<NDim> = {
			value: curve,
			done: isDone
		}
		return iterResult;
	}


}