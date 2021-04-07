import { CurveDerivationFunction } from '../devlib/DevLibTypes'
import { CurveND } from './CurveND';

export class DerivedPointValueFunctions
{
    public static GetFunctionList(): CurveDerivationFunction[]
    {
        let functionList = [];
        functionList.push( (curve: CurveND) => this.normAttr('Mass_norm', 'Mass (pg)', curve, false) );
        functionList.push( (curve: CurveND) => this.normAttr('Time_norm', 'Time (h)', curve) );
        return functionList;
    }

    private static normAttr(newKey: string, referenceKey: string, curve: CurveND, zeroNorm = true): void
    {
        if (curve.pointList.length === 0)
        {
            return;
        }
        const firstVal: number = curve.pointList[0].get(referenceKey);
        for (let point of curve.pointList)
        {
            let oldVal = point.get(referenceKey);
            let newVal: number;
            if (zeroNorm)
            {
                newVal = oldVal - firstVal
            }
            else
            {   
                newVal = oldVal / firstVal;
            }
            point.addValue(newKey, newVal);
        }
        return;
    }

    // private static functionName(curve: CurveND): number[]
    // {
        
    // }

}