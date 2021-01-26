import { StringToNumberObj, TrackDerivationFunction } from '../devlib/DevLibTypes'

export class DerivedTrackValueFunctions
{
    public static GetFunctionList(): [string[], TrackDerivationFunction][]
    {
        let functionList = [];
        functionList.push([['Track Length'], this.trackLength]);
        functionList.push([['Avg Mass'], this.averageMass]);
        functionList.push([['Avg shape factor'], this.averageShapeFactor]);
        functionList.push([['Growth Rate', 'Intercept', 'Initial Mass', 'Exponential Growth Constant', 'r_squared'], this.growthRateStats]);
        return functionList;
    }

    private static trackLength(pointList: StringToNumberObj[]): [number]
    {
        let firstTime = pointList[0]['Time (h)'];
        let lastTime = pointList[pointList.length - 1]['Time (h)'];
        return [lastTime - firstTime];
    }

    private static averageMass(pointList: StringToNumberObj[]): [number]
    {
        let totalMass = 0;
        for (let point of pointList)
        {
            totalMass += point['Mass (pg)'];
        }
        return [totalMass / pointList.length];
    }

    private static averageShapeFactor(pointList: StringToNumberObj[]): [number]
    {
        let totalShapeFactor = 0;
        for (let point of pointList)
        {
            totalShapeFactor += point['shape factor'];
        }
        return [totalShapeFactor / pointList.length];
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
            let x = point['Time (h)'];
            let y = point['Mass (pg)'];
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
        let initialMass = pointList[0]['Time (h)'] * slope + intercept;
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