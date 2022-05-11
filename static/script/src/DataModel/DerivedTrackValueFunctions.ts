import {
    StringToNumberObj,
    CurveDerivationFunction
} from '../devlib/DevLibTypes';
import { CurveND } from './CurveND';

export class DerivedTrackValueFunctions {
    public static GetFunctionList(): CurveDerivationFunction[] {
        let functionList: CurveDerivationFunction[] = [];
        functionList.push(this.trackLength);
        for (let toAverage of [
            'Mass (pg)',
            // 'shape factor',
            'Mass_norm',
            'fluor',
            'p1',
            'p2',
            'fpredict',
            'Mean Intensity',
            'Area'
        ]) {
            functionList.push((curve: CurveND) =>
                this.averageAttribute(toAverage + ' (avg)', toAverage, curve)
            );
        }
        functionList.push(this.growthRateStats);
        return functionList;
    }

    private static trackLength(curve: CurveND): void {
        let firstTime = curve.pointList[0].get('Time (h)');
        let lastTime =
            curve.pointList[curve.pointList.length - 1].get('Time (h)');
        let trackLength = lastTime - firstTime;
        curve.addValue('Track Length', trackLength);
        return;
    }

    private static averageAttribute(
        newKey: string,
        referenceKey: string,
        curve: CurveND
    ): void {
        const firstPoint = curve.pointList[0];
        if (!firstPoint.valueMap.has(referenceKey)) {
            curve.addValue(newKey, null);
            return;
        }
        let total = 0;
        for (let point of curve.pointList) {
            total += point.get(referenceKey);
        }
        const newValue = total / curve.pointList.length;
        curve.addValue(newKey, newValue);
        return;
    }

    private static growthRateStats(curve: CurveND): void {
        const attrList = [
            'Growth Rate',
            'Intercept',
            'Initial Mass',
            'Exponential Growth Constant',
            'r_squared'
        ];
        // Referenced math
        // https://en.wikipedia.org/wiki/Ordinary_least_squares#Simple_linear_regression_model
        let sumX = 0;
        let sumY = 0;
        let sumYY = 0;
        let sumXY = 0;
        let sumXX = 0;
        let N = curve.pointList.length;
        if (N === 1) {
            // calculating the slope of one point is actually point...less
            for (let attr of attrList) {
                curve.addValue(attr, NaN);
            }
            return;
        }
        for (let point of curve.pointList) {
            let x = point.get('Time (h)');
            let y = point.get('Mass (pg)');
            sumX += x;
            sumY += y;
            sumYY += y * y;
            sumXY += x * y;
            sumXX += x * x;
        }

        let N_inv = 1 / N;
        let covariance = sumXY - N_inv * sumX * sumY;
        let variance = sumXX - N_inv * sumX * sumX;
        let slope = covariance / variance;
        let intercept = N_inv * (sumY - slope * sumX);
        let initialMass =
            curve.pointList[0].get('Time (h)') * slope + intercept;
        let exponentialGrowthConstant = slope / initialMass;

        // r_squared equation from here
        // https://en.wikipedia.org/wiki/Simple_linear_regression#Fitting_the_regression_line
        let r_top = N_inv * sumXY - N_inv * sumX * N_inv * sumY;
        let r_bot = Math.sqrt(
            (N_inv * sumXX - N_inv * sumX * N_inv * sumX) *
                (N_inv * sumYY - N_inv * sumY * N_inv * sumY)
        );
        let r_squared = Math.pow(r_top / r_bot, 2);
        const values = [
            slope,
            intercept,
            initialMass,
            exponentialGrowthConstant,
            r_squared
        ];
        for (let i = 0; i < attrList.length; i++) {
            let attr = attrList[i];
            let value = values[i];
            curve.addValue(attr, value);
        }
        return;
    }

    // private static functionName(pointList: CurveND): void
    // {

    // }
}
