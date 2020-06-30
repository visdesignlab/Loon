import { PointCollection } from './PointCollection';
import { ImageLocation } from './ImageLocation';

export class ImageMetaData
{   
    private constructor()
    {
        this._locationList = [];
        this._locationLookup = new Map<number, ImageLocation>();
    }

    private _locationList : ImageLocation[];
    public get locationList() : ImageLocation[] {
        return this._locationList;
    }

    private _locationLookup : Map<number, ImageLocation>;
    public get locationLookup() : Map<number, ImageLocation> {
        return this._locationLookup;
    }

    
    private _locationIdKey : string;
    public get locationIdKey() : string {
        return this._locationIdKey;
    }

    private _frameIdKey : string;
    public get frameIdKey() : string {
        return this._frameIdKey;
    }
    
    public getBrushedLocations(): number[]
    {
        return this.locationList.filter(loc => loc.inBrush).map(loc => loc.locationId);
    }

    public getBrushedImageCount(): number
    {
        let count = 0;
        for (let loc of this.locationList)
        {
            count += loc.frameList.filter(frame => frame.inBrush).length;
        }
        return count;
    }


    public updateInBrushProp(pointList: PointCollection): void
    {
        this.resetAllToFalse();
        for (let point of pointList)
        {
            if (point.inBrush)
            {
                let locId: number = point.get(this.locationIdKey);
                let frameId: number = point.get(this.frameIdKey);
                let location = this.locationLookup.get(locId);
                location.inBrush = true;
                location.frameLookup.get(frameId).inBrush = true;
            }
        }
    }

    private resetAllToFalse(): void
    {
        for (let loc of this.locationList)
        {
            loc.inBrush = false;
            for (let frame of loc.frameList)
            {
                frame.inBrush = false;
            }
        }
    }
    
    static fromPointCollection(pointList: PointCollection, locationIdKey: string = 'Location ID', frameIdKey: string = 'Frame ID'): ImageMetaData
    {
        let imgMetaData = new ImageMetaData();
        imgMetaData._locationIdKey = locationIdKey;
        imgMetaData._frameIdKey = frameIdKey;
        for (let point of pointList)
        {
            let locId: number = point.get(locationIdKey);
            let frameId: number = point.get(frameIdKey);
            let imageLocation: ImageLocation;
            if (imgMetaData.locationLookup.has(locId))
            {
                imageLocation = imgMetaData.locationLookup.get(locId);
            }
            else
            {
                imageLocation = new ImageLocation(locId);
                imgMetaData.locationList.push(imageLocation);
                imgMetaData.locationLookup.set(locId, imageLocation);
            }
            imageLocation.addFrame(frameId);
        }
        for (let imageLocation of imgMetaData.locationList)
        {
            imageLocation.sortFrames();
        }
        imgMetaData.updateInBrushProp(pointList);
        return imgMetaData;
    }
}