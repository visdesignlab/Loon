import { NDim } from '../devlib/DevlibTypes'
import { CurveCollectionIterator } from './CurveCollectionIterator';
import { PointCollection } from './PointCollection';
import { CurveList } from './CurveList';
import { Facet, LocationMapList, LocationMapTemplate, DatasetSpec, AppData } from '../types';
import { CurveListFactory } from './CurveListFactory';

export class CurveCollection extends PointCollection
{
    public CreateFilteredCurveList(): AppData<DatasetSpec> {
        throw new Error('Method not implemented.');
    }
    public ApplyDefaultFilters(): void {
        throw new Error('Method not implemented.');
    }
    constructor(curveList: CurveList, spec: DatasetSpec)
    {
        super();
        this._length = curveList.curveList.length;
		this._curveList = curveList;
		this.Specification = spec;
    }
    
    private _curveList : CurveList;
    public get curveList() : CurveList {
        return this._curveList;
    }
    
    public OnBrushChange(): void { }
	public ConsumeFilters: (AppData: any) => void;

	protected getFacetList(locationMap: LocationMapList | LocationMapTemplate): Facet[]
	{
        let facetList = CurveListFactory.CreateFacetedDatasets(this.curveList, locationMap);
        for (let facet of facetList)
        {
            facet.data = facet.data.curveCollection;
        }
        return facetList;
	}

    [Symbol.iterator](): Iterator<NDim>
	{
		return new CurveCollectionIterator(this.curveList);
	}

}