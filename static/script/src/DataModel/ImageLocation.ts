import { ImageFrame } from './ImageFrame'
import { DevlibAlgo } from '../devlib/DevlibAlgo';

export class ImageLocation
{
    constructor(locationId: number)
    {
        this._locationId = locationId;
        this._inBrush = true;
        this._frameList = [];
        this._frameLookup = new Map<number, ImageFrame>();
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
        return this.inBrushCount / this.totalCount;
    }

    private _locationId : number;
    public get locationId() : number {
        return this._locationId;
    }
    
    private _frameList : ImageFrame[];
    public get frameList() : ImageFrame[] {
        return this._frameList;
    }
    
    private _frameLookup : Map<number, ImageFrame>;
    public get frameLookup() : Map<number, ImageFrame> {
        return this._frameLookup;
    }
    
    public addFrame(frameId: number): void
    {
        if (this.frameLookup.has(frameId))
        {
            return
        }
        let newFrame = new ImageFrame(frameId);
        this.frameList.push(newFrame);
        this.frameLookup.set(frameId, newFrame);
    }

    public sortFrames(): void
    {
        this.frameList.sort(DevlibAlgo.sortOnProperty((frame: ImageFrame) => frame.frameId));
    }
}