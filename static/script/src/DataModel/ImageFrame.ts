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

    private _inBrushCount : number;
    public get inBrushCount() : number {
        return this._inBrushCount;
    }
    public set inBrushCount(v : number) {
        this._inBrushCount = v;
    }

    private _totalCount : number;
    public get totalCount() : number {
        return this._totalCount;
    }
    public set totalCount(v : number) {
        this._totalCount = v;
    }
    
    public get inBrushPercent() : number {
        if (this.totalCount === 0)
        {
            return 0;
        }
        return this.inBrushCount / this.totalCount;
    }

    private _frameId : number;
    public get frameId() : number {
        return this._frameId;
    }
        
}