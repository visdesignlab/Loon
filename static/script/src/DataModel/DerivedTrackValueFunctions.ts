import { StringToNumberObj, DerivationFunction } from '../devlib/DevLibTypes'

export class DerivedTrackValueFunctions
{
    public static GetFunctionList(): [string[], DerivationFunction][]
    {
        let functionList = [];
        functionList.push([['Track Length'], this.trackLength]);
        functionList.push([['Avg Mass'], this.averageMass]);
        functionList.push([['Growth Rate', 'Intercept', 'Initial Mass', 'Exponential Growth Constant', 'r_squared'], this.growthRateStats]);
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
            totalMass += point['Mass'];
        }
        return [totalMass / pointList.length];
    }

    private static growthRateStats(pointList: StringToNumberObj[]): [number, number, number, number, number]
    {
        // Referenced math
        // https://en.wikipedia.org/wiki/Ordinary_least_squares#Simple_linear_regression_model
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
            let x = point['Time'];
            let y = point['Mass'];
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
        let initialMass = pointList[0]['Time'] * slope + intercept;
        let exponentialGrowthConstant = slope / initialMass;

        // r_squared equation from here
        // https://en.wikipedia.org/wiki/Simple_linear_regression#Fitting_the_regression_line
        let r_top = (N_inv * sumXY - N_inv * sumX * N_inv * sumY);
        let r_bot = Math.sqrt( (N_inv * sumXX - N_inv * sumX * N_inv * sumX) * (N_inv * sumYY - N_inv * sumY * N_inv * sumY) );
        let r_squared = Math.pow((r_top / r_bot), 2);
        return [ slope, intercept, initialMass, exponentialGrowthConstant, r_squared ];
    }


    // private static functionName(pointList: StringToNumberObj[]): number
    // {
        
    // }

}