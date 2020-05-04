import * as d3 from 'd3';
import { DevlibMath } from '../devlib/DevlibMath';
import { CurveList } from './CurveList';
import { CurveND } from './CurveND';
import { PointND } from './PointND';
import { StringToStringObj, StringToNumberObj, DerivationFunction } from '../devlib/DevLibTypes'

interface StringToNumberOrList {
    [key: string]: number | StringToNumberObj[];
}

export class CurveListFactory {
	
	// constructor(argument) {
	// 	// code...
	// }

	public static CreateCurveListFromCSV(csvString: string, derivedDataFunctions: [string, DerivationFunction][], sourceKey: string, postfixKey: string = '', idkey: string = "id", tKeyOptions: string[] = ["time", "t"]): CurveList
	{
		let rawValueArray: d3.DSVRowArray<string> = d3.csvParse(csvString);
		return CurveListFactory.CreateCurveListFromCSVObject(rawValueArray, derivedDataFunctions, sourceKey, postfixKey, idkey, tKeyOptions);
	}

	public static CreateCurveListFromCSVObject(csvObject: d3.DSVRowArray<string>, derivedDataFunctions: [string, DerivationFunction][], sourceKey: string, postfixKey: string = '', idkey: string = "id", tKeyOptions: string[] = ["time", "t"]): CurveList
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
				for (let [attrName, func] of derivedDataFunctions)
				{
					values[attrName] = func(points)
				}
				return values;
			})
			.entries(csvObject);

		for (let plainCurve of pojoList)
		{
			const curve = new CurveND(plainCurve.key);
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
		const curveListObj = new CurveList(curveList);
		curveListObj.setInputKey(tKey);
		curveListObj.sourceKey = sourceKey;
		curveListObj.postfixKey = postfixKey;
		return curveListObj;
	}

}