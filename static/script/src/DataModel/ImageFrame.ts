export class ImageFrame
{
    constructor(frameId: number)
    {
        this._frameId = frameId;
        this._inBrush = true;
    }

    private _inBrush : boolean;
    public get inBrush() : boolean {
        return this._inBrush;
    }
    public set inBrush(v: boolean) {
        this._inBrush = v;
    }

    private _frameId : number;
    public get frameId() : number {
        return this._frameId;
    }

    
    
}