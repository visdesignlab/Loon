import { NDim } from '../devlib/DevlibTypes'

import { PointCollection } from './PointCollection';
import { CurveList } from './CurveList';
import { CurveCollectionIterator } from './CurveCollectionIterator';

export class CurveCollection extends PointCollection
{
    constructor(curveList: CurveList)
    {
        super();
        this._length = curveList.curveList.length;
        
        this._curveList = curveList;
    }
    
    private _curveList : CurveList;
    public get curveList() : CurveList {
        return this._curveList;
    }
    public set curveList(v : CurveList) {
        this._curveList = v;
    }
    
    [Symbol.iterator](): Iterator<NDim>
	{
		return new CurveCollectionIterator(this.curveList);
	}

}