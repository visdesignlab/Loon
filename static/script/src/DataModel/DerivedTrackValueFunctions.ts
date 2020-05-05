import { StringToNumberObj, DerivationFunction } from '../devlib/DevLibTypes'

export class DerivedTrackValueFunctions
{
    public static GetFunctionList(): [string, DerivationFunction][]
    {
        let functionList = [];
        functionList.push(['trackLength', this.trackLength]);
        functionList.push(['averageMass', this.averageMass]);
        functionList.push(['growthRate', this.growthRate]);
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

    private static growthRate(pointList: StringToNumberObj[]): number
    {
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
        let N = pointList.length;
        if (N === 1)
        {
            return NaN; // calculating the slope of one point is actually point...less
        }
        for (let point of pointList)
        {
            let x = point['time'];
            let y = point['mass'];
            sumX += x;
            sumY += y;
            sumXY += x*y;
            sumXX += x*x;
        }
        let covariance = sumXY - (1 / N) * sumX * sumY;
        let variance = sumXX - (1 / N) * sumX * sumX;
        let slope = covariance / variance;
        return slope;
    }


    // private static functionName(pointList: StringToNumberObj[]): number
    // {
        
    // }

}