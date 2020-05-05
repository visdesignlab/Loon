import { StringToNumberObj, DerivationFunction } from '../devlib/DevLibTypes'

export class DerivedTrackValueFunctions
{
    public static GetFunctionList(): [string[], DerivationFunction][]
    {
        let functionList = [];
        functionList.push([['trackLength'], this.trackLength]);
        functionList.push([['averageMass'], this.averageMass]);
        functionList.push([['growthRate', 'intercept', 'initialMass', 'exponentialGrowthConstant', 'r_squared'], this.growthRateStats]);
        return functionList;
    }

    private static trackLength(pointList: StringToNumberObj[]): [number]
    {
        return [pointList.length];
    }

    private static averageMass(pointList: StringToNumberObj[]): [number]
    {
        let totalMass = 0;
        for (let point of pointList)
        {
            totalMass += point['mass'];
        }
        return [totalMass / pointList.length];
    }

    private static growthRateStats(pointList: StringToNumberObj[]): [number, number, number, number, number]
    {
        let sumX = 0;
        let sumY = 0;
        let sumYY = 0;
        let sumXY = 0;
        let sumXX = 0;
        let N = pointList.length;
        if (N === 1)
        {
            return [ NaN, NaN, NaN, NaN, NaN ]; // calculating the slope of one point is actually point...less
        }
        for (let point of pointList)
        {
            let x = point['time'];
            let y = point['mass'];
            sumX += x;
            sumY += y;
            sumYY += y*y;
            sumXY += x*y;
            sumXX += x*x;
        }

        let N_inv = 1 / N;
        let covariance = sumXY - N_inv * sumX * sumY;
        let variance = sumXX - N_inv * sumX * sumX;
        let slope = covariance / variance;
        let intercept = N_inv * (sumY - slope * sumX);
        let initialMass = pointList[0]['time'] * slope + intercept;
        let exponentialGrowthConstant = slope / initialMass;
        let r_top = (N_inv * sumXY - N_inv * sumX * N_inv * sumY);
        let r_bot = Math.sqrt( (N_inv * sumXX - N_inv * sumX * N_inv * sumX) * (N_inv * sumYY - N_inv * sumY * N_inv * sumY) );
        let r_squared = Math.pow((r_top / r_bot), 2);
        return [ slope, intercept, initialMass, exponentialGrowthConstant, r_squared ];
    }


    // private static functionName(pointList: StringToNumberObj[]): number
    // {
        
    // }

}