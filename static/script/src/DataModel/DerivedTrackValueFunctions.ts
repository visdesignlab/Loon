import { StringToNumberObj, DerivationFunction } from '../devlib/DevLibTypes'

export class DerivedTrackValueFunctions
{
    public static GetFunctionList(): [string, DerivationFunction][]
    {
        let functionList = [];
        functionList.push(['trackLength', this.trackLength]);
        functionList.push(['averageMass', this.averageMass]);
        return functionList;
    }

    private static trackLength(pointList: StringToNumberObj[]): number
    {
        return pointList.length;
    }

    private static averageMass(pointList: StringToNumberObj[]): number
    {
        let totalMass = 0;
        for (let point of pointList)
        {
            totalMass += point['mass'];
        }
        return totalMass / pointList.length;
    }

}