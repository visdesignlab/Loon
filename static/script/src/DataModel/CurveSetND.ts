import { CurveND } from './CurveND';

// todo - mabye don't need this

export class CurveListND {
	
	constructor(argument) {
		// code...
	}

	private _CurveList : CurveND[];
	public get CurveList() : CurveND[] {
		return this._CurveList;
	}
	public set CurveList(v : CurveND[]) {
		this._CurveList = v;
	}



}