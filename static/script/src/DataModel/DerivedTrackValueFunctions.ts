import { StringToNumberObj, DerivationFunction } from '../devlib/DevLibTypes'

export class DerivedTrackValueFunctions
{
    public static GetFunctionList(): [string, DerivationFunction][]
    {
        let functionList = [];
        functionList.push(['trackLength', this.trackLength])
        return functionList;
    }

    private static trackLength(pointList: StringToNumberObj[]): number
    {
        return pointList.length;
    }

}