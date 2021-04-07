import { CurveList } from './CurveList';
import { CurveND } from './CurveND';
import { PointND } from './PointND';
import { CurveDerivationFunction } from '../devlib/DevLibTypes'
import { DatasetSpec, Facet, LocationMapList, PbCurveList } from '../types';

export class CurveListFactory {

	public static CreateFacetedDatasets(fullData: CurveList, locationMap: LocationMapList): Facet[]
	{
		let locToCat: Map<number, string> = new Map();
		
		for (let key of Object.keys(locationMap))
		{
			let valueList = locationMap[key];
			if (valueList.length === 0)
			{
				throw new Error('LocationMap valueList should have at least one entry')
			}
			if (typeof valueList[0] === 'string')
			{
				// todo work for locationmaptemaplate type
			}
			else
			{
				for (let [low, high] of valueList)
				{
					for (let i = +low; i <= +high; i++)
					{
						locToCat.set(i, key);
					}
				}
			}
		}

		let pointMap: Map<string, CurveND[]> = new Map();

		for (let curve of fullData.curveList)
		{
			let location = curve.get('Location ID');
			let category = locToCat.get(location);
			if (!pointMap.has(category))
			{
				pointMap.set(category, []);
			}
			pointMap.get(category).push(curve);
		}

		let facetList = [];
		for (let [cat, listOfCurves] of pointMap)
		{
			let curveList = new CurveList(listOfCurves, fullData.Specification);
			let facet: Facet = {
				name: [cat],
				data: curveList
			}
			facetList.push(facet);
		}
		return facetList;
	}

	public static CreateCurveListFromPbObject(
		pbObject: PbCurveList,
		derivedTrackDataFunctions: CurveDerivationFunction[],
		derivedPointDataFunctions: CurveDerivationFunction[],
		dataSpec: DatasetSpec,
		idkey: string = "id",
		tKeyOptions: string[] = ["Time (h)"]): CurveList
	{
		const curveList: CurveND[] = [];
		let tKey: string = null;
		for (let keyOption of tKeyOptions)
		{
			if (pbObject.pointAttrNames.includes(keyOption))
			{
				tKey = keyOption;
				break;
			}
		}
		if (tKey == null)
		{
			throw new Error("Dataset does not contain any tKey column. Allowed Keys: " + tKeyOptions.toString())
		}

		for (let pbCurve of pbObject.curveList)
		{
			const curve = new CurveND(pbCurve.id.toString());
			for (let i = 0; i < pbObject.curveAttrNames.length; i++)
			{
				const key = pbObject.curveAttrNames[i];
				const value = pbCurve.valueList[i];
				curve.addValue(key, value)
			}
			for (let pbPoint of pbCurve.pointList)
			{
				const point = new PointND();
				for (let i = 0; i < pbObject.pointAttrNames.length; i++)
				{
					const key = pbObject.pointAttrNames[i];
					const value = pbPoint.valueList[i];
					point.addValue(key, value)
				}
				
				curve.addPoint(point);
			}
			CurveListFactory.calculateDerivedPointValues(curve, derivedPointDataFunctions)
			CurveListFactory.calculateDerivedPointValues(curve, derivedTrackDataFunctions)
			curveList.push(curve);
		}
		const curveListObj = new CurveList(curveList, dataSpec);
		curveListObj.setInputKey(tKey);
		return curveListObj;
	}

	private static calculateDerivedPointValues(curve: CurveND, derivedPointDataFunctions: CurveDerivationFunction[]): void
	{
		for (let func of derivedPointDataFunctions)
		{
			func(curve);
		}
	}
}