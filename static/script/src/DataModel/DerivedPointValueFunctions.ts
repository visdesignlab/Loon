import { StringToNumberObj, PointDerivationFunction } from '../devlib/DevLibTypes'

export class DerivedPointValueFunctions
{
    public static GetFunctionList(): [string[], PointDerivationFunction][]
    {
        let functionList = [];
        functionList.push([['Mass_norm'], (pointList: StringToNumberObj[]) => this.normAttr('Mass', pointList)]);
        functionList.push([['Time_norm'], (pointList: StringToNumberObj[]) => this.normAttr('Time', pointList)]);
        return functionList;
    }

    private static normAttr(attrKey: string, pointList: StringToNumberObj[]): [number[]]
    {
        let newValues: number[] = [];
        if (pointList.length === 0)
        {
            return [newValues];
        }
        const firstVal: number = pointList[0][attrKey];
        for (let point of pointList)
        {
            let oldVal = point[attrKey];
            newValues.push(oldVal - firstVal);
        }
        return [newValues];
    }

    // private static functionName(pointList: StringToNumberObj[]): number[]
    // {
        
    // }

}