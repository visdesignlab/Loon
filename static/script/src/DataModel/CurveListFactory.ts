import * as d3 from 'd3';
import { DevlibMath } from '../devlib/DevlibMath';
import { CurveList } from './CurveList';
import { CurveND } from './CurveND';
import { PointND } from './PointND';
import { StringToStringObj, StringToNumberObj, KeyedTrackDerivationFunction, KeyedPointDerivationFunction } from '../devlib/DevLibTypes'
import { DatasetSpec, Facet, LocationMapList, LocationMapTemplate } from '../types';

interface StringToNumberOrList {
    [key: string]: number | StringToNumberObj[];
}

export class CurveListFactory {

	public static CreateFacetedDatasets(fullData: CurveList, locationMap: LocationMapList | LocationMapTemplate): Facet[]
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
			let firstPoint = curve.pointList[0];
			let location = firstPoint.get('Location ID');
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
				name: cat,
				data: curveList
			}
			facetList.push(facet);
		}
		return facetList;
	}

	public static CreateCurveListFromCSVObject(csvObject: d3.DSVRowArray<string>, derivedTrackDataFunctions: KeyedTrackDerivationFunction[], derivedPointDataFunctions: KeyedPointDerivationFunction[], dataSpec: DatasetSpec, idkey: string = "id", tKeyOptions: string[] = ["Time (h)"]): CurveList
	{
		console.log(csvObject);
		const curveList: CurveND[] = [];
		let tKey: string = null;
		for (let keyOption of tKeyOptions)
		{
			if (csvObject.columns.includes(keyOption))
			{
				tKey = keyOption;
				break;
			}
		}
		if (tKey == null)
		{
			throw new Error("Dataset does not contain any tKey column. Allowed Keys: " + tKeyOptions.toString())
		}

		let pojoList = d3.nest<StringToStringObj, StringToNumberOrList>()
			.key(d => d[idkey])
			.rollup((rows: any[]) =>
			{ 
				const values: StringToNumberOrList = {};
				const points: StringToNumberObj[] = [];
				for (let row of rows)
				{
					const tValue: string = row[tKey];
					if (!DevlibMath.isNumber(tValue))
					{

						for (let key in row)
						{
							if (key === idkey || key === tKey)
							{
								continue;
							}
							const value = row[key];
							if (!DevlibMath.isNumber)
							{
								continue;
							}
							values[tValue] = +value;
							break;
						}
						continue;
					}
					const point: StringToNumberObj = {};

					for (let key in row)
					{
						if (key === idkey)
						{
							continue;
						}
						point[key] = +row[key];
					}
					points.push(point);
				}
				// const sortFunction = DevlibMath.sortOnProperty<StringToNumberObj>(obj => obj[tKey]);
				// points.sort(sortFunction);

				values.points = points;
				CurveListFactory.calculateDerivedTrackValues(values, derivedTrackDataFunctions);
				CurveListFactory.calculateDerivedPointValues(values, derivedPointDataFunctions);
				// todo add point derived functions - also should pull this out into a function
				// for (let [attrNameList, func] of derivedTrackDataFunctions)
				// {
				// 	let valueList = func(points);
				// 	for (let i = 0; i < attrNameList.length; i++)
				// 	{
				// 		let attrName = attrNameList[i];
				// 		let val = valueList[i];
				// 		values[attrName] = val;
				// 	}
				// }
				return values;
			})
			.entries(csvObject);

		for (let plainCurve of pojoList)
		{
			let numericKey = +plainCurve.key;
			// js formats the number as '123.0', Instead I want '123'
			const curve = new CurveND(numericKey.toString());
			for (let key in plainCurve.value)
			{
				let value = plainCurve.value[key];
				if (typeof value === "number")
				{
					curve.addValue(key, value);
					continue;
				}
				for (let pojoPoint of value)
				{
					const point = new PointND(pojoPoint);
					curve.addPoint(point);
				}
			}
			curveList.push(curve);
		}
		// console.log(curveList);
		const curveListObj = new CurveList(curveList, dataSpec);
		curveListObj.setInputKey(tKey);
		return curveListObj;
	}

	private static calculateDerivedTrackValues(values: StringToNumberOrList, derivedTrackDataFunctions: KeyedTrackDerivationFunction[]): void
	{
		let points: StringToNumberObj[] = values.points as StringToNumberObj[];
		for (let [attrNameList, func] of derivedTrackDataFunctions)
		{
			let valueList = func(points);
			for (let i = 0; i < attrNameList.length; i++)
			{
				let attrName = attrNameList[i];
				let val = valueList[i];
				values[attrName] = val;
			}
		}
	}

	private static calculateDerivedPointValues(values: StringToNumberOrList, derivedPointDataFunctions: KeyedPointDerivationFunction[]): void
	{
		let points: StringToNumberObj[] = values.points as StringToNumberObj[];
		for (let [attrNameList, func] of derivedPointDataFunctions)
		{
			let valueListOfLists = func(points);
			for (let i = 0; i < attrNameList.length; i++)
			{
				let attrName = attrNameList[i];
				let valueList = valueListOfLists[i];
				for (let j = 0; j < points.length; j++)
				{
					points[j][attrName] = valueList[j];
				}

			}
		}
	}
}