import { NDim } from '../devlib/DevlibTypes'

import { CurveCollectionIterator } from './CurveCollectionIterator';
import { PointCollection } from './PointCollection';
import { CurveList } from './CurveList';
import { FacetOption, Facet } from '../types';
import { CurveListFactory } from './CurveListFactory';

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
    
    public OnBrushChange(): void { }

    public GetFacetOptions(): FacetOption[]
	{
		// todo - read from data
		let facetOption1: FacetOption = 
		{
			name: 'test',
			GetFacets: () => {return this.getFacets()}
		}
		return [facetOption1];
	}

	protected getFacets(): Facet[]
	{
		let hardcodedDict: Map<number, string> = new Map();
		
		for (let i = 0; i < 10; i++)
		{
			hardcodedDict.set(i, "A");
		}		
		
		for (let i = 10; i < 20; i++)
		{
			hardcodedDict.set(i, "B");
		}		
		
		for (let i = 20; i < 30; i++)
		{
			hardcodedDict.set(i, "C");
		}		
		
		for (let i = 30; i < 40; i++)
		{
			hardcodedDict.set(i, "D");
		}

        let facetList = CurveListFactory.CreateFacetedDatasets(this.curveList, hardcodedDict);
        for (let facet of facetList)
        {
            facet.data = facet.data.curveCollection;
        }
        return facetList;
	}

    public [Symbol.iterator](): Iterator<NDim>
	{
		return new CurveCollectionIterator(this.curveList);
	}

}