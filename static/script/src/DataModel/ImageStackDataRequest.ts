import * as d3 from 'd3';
import { load } from "protobufjs";
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';



export interface ImageLabels
{
    rowList: Row[]
}

export interface Row
{
    row: LabelRun[]
}

export interface LabelRun {
    start: number,
    length: number,
    label: number
}


export class ImageStackDataRequest
{
    public constructor(driveId: string)
    {
        this._driveId = driveId;
        this._metaDataLoaded = false;
        d3.json(`/data/${driveId}/imageMetaData.json`).then((data: any) =>
        {
            this._tileWidth = data.tileWidth;
            this._tileHeight = data.tileHeight;
            this._numberOfColumns = data.numberOfColumns;
            this._tilesPerFile = data.tilesPerFile;
            this._metaDataLoaded = true;
            if (data.scaleFactor)
            {
                this._scaleFactor = data.scaleFactor;
            }
            else
            {
                this._scaleFactor = 1;
            }
        });
        this._blobArray= [];
        this._labelArray= [];
        this._maxBlobCount = 100;
        this._nextBlobIndex = 0;
        this._nextLabelIndex = 0;
        this._maxLabelCount = 100;
    }
    
    
    private _metaDataLoaded : boolean;
    public get metaDataLoaded() : boolean {
        return this._metaDataLoaded;
    }

    private _driveId : string;
    public get driveId() : string {
        return this._driveId;
    }    

    private _tileWidth : number;
    public get tileWidth() : number {
        return this._tileWidth;
    }

    private _tileHeight : number;
    public get tileHeight() : number {
        return this._tileHeight;
    }
    
    private _numberOfColumns : number;
    public get numberOfColumns() : number {
        return this._numberOfColumns;
    }

    private _tilesPerFile : number;
    public get tilesPerFile() : number {
        return this._tilesPerFile;
    }

    private _maxBlobCount : number;
    public get maxBlobCount() : number {
        return this._maxBlobCount;
    }

    private _maxLabelCount : number;
    public get maxLabelCount() : number {
        return this._maxLabelCount;
    }
 
    private _scaleFactor : number;
    public get scaleFactor() : number {
        return this._scaleFactor;
    }    

    // blob, key, url
    private _blobArray : [Blob, string, string][];
    public get blobArray() : [Blob, string, string][] {
        return this._blobArray;
    }

    private _nextBlobIndex : number;
    public get nextBlobIndex() : number {
        return this._nextBlobIndex;
    }

    // rows, key
    private _labelArray : [ImageLabels, string][];
    public get labelArray() : [ImageLabels, string][] {
        return this._labelArray;
    }

    private _nextLabelIndex : number;
    public get nextLabelIndex() : number {
        return this._nextLabelIndex;
    }


; 
    public getImage(location: number, frameIndex: number, callback: (top: number, left: number, blob: Blob, imageUrl: string) => void): void
    {
        if (!this.metaDataLoaded)
        {
            setTimeout(() =>
            {
                this.getImage(location, frameIndex, callback)
            }, 50); // todo fallback
            return;
        }
        let [top, left] = this.getTileTopLeft(frameIndex);
        let bundleIndex = Math.floor(frameIndex / this.tilesPerFile);
        let key = [location, bundleIndex].join('-');
        
        let cachedElement = this.blobArray.find(d => d[1] === key);
        if (cachedElement)
        {
            this.runWithCachedImage(key, top, left, callback);
            return;
        }
        const imgUrl = `/data/${this.driveId}/img_${location}_${bundleIndex}.jpg`;
        const thisIndex = this.nextBlobIndex;
        this.blobArray[thisIndex] = [null, key, null];
        this._nextBlobIndex = (this.nextBlobIndex + 1) % this.maxBlobCount;

        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () =>
        {
            let blob = xhr.response;
            let url = window.URL.createObjectURL(blob);
            this.blobArray[thisIndex] = [blob, key, url];
            callback(top, left, blob, url);
        }
        xhr.open('GET', imgUrl);
        xhr.send();
        return;
    }

    private runWithCachedImage(key: string, top: number, left: number, callback: (top: number, left: number, blob: Blob, imageUrl: string) => void): void
    {
        let cachedElement = this.blobArray.find(d => d[1] === key);
        if (cachedElement[0])
        {
            callback(top, left, cachedElement[0], cachedElement[2]);
        }
        else
        {
            // loading, try again later
            setTimeout(() => {
                this.runWithCachedImage(key, top, left, callback);
            }, 50);
        }
    }

    public getImagePromise(location: number, frameIndex: number): Promise<[number, number, Blob, string]>
    {
        return new Promise((resolve, reject) =>
        {
            this.getImage(location, frameIndex, (top: number, left: number, blob: Blob, imageUrl: string) =>
            {
                resolve([top, left, blob, imageUrl]);
            })
        });
    }


    public getTileTopLeft(frameIndex: number): [number, number]
	{
		const left: number = (frameIndex % this.numberOfColumns) * this.tileWidth;
        let top: number = Math.floor((frameIndex % this.tilesPerFile) / this.numberOfColumns) * this.tileHeight;
		return [top, left];
    }
    
    public getLabel(location: number, frameIndex: number, callback: (rowData: ImageLabels, firstIndex: number) => void): void
    {
        if (!this.metaDataLoaded)
        {
            setTimeout(() =>
            {
                this.getLabel(location, frameIndex, callback)
            }, 50); // todo fallback
            return;
        }
        // let [top, left] = this.getTileTopLeft(frameIndex);
        let firstIndex: number = (frameIndex % this.tilesPerFile) * this.tileHeight;
        let bundleIndex = Math.floor(frameIndex / this.tilesPerFile);
        let key = [location, bundleIndex].join('-');
        
        let cachedElement = this.labelArray.find(d => d[1] === key);
        if (cachedElement)
        {
            // todo - similar runWithCached logic
            this.runWithCachedLabel(key, firstIndex, callback);
            return;
        }
        
        const thisIndex = this.nextLabelIndex;
        this._nextLabelIndex = (this.nextLabelIndex + 1) % this.maxBlobCount;
        this.labelArray[thisIndex] = [null, key];

        const labelUrl = `/data/${this.driveId}/label_${location}_${bundleIndex}.pb`;
        load("/static/protoDefs/RLE.proto", async (err, root) => {
            if (err)
            {
                throw err;
            }
            // Obtain a message type
            let ImageLabelsMessage = root.lookupType("imageLabels.ImageLabels");
            let buffer = await d3.buffer(labelUrl);
            // Decode an Uint8Array (browser) or Buffer (node) to a message
            let message = ImageLabelsMessage.decode(new Uint8Array(buffer)) as any;

            this.labelArray[thisIndex] = [message, key];
            console.log(message);
            callback(message, firstIndex);
        });

        return;
    }

    private runWithCachedLabel(key: string, firstIndex: number, callback: (rowData: ImageLabels, firstIndex: number) => void): void
    {
        let cachedElement = this.labelArray.find(d => d[1] === key);
        if (cachedElement[0])
        {
            callback(cachedElement[0], firstIndex);
        }
        else
        {
            // loading, try again later
            setTimeout(() => {
                this.runWithCachedLabel(key, firstIndex, callback);
            }, 50);
        }
    }

    public getLabelPromise(location: number, frameIndex: number): Promise<[ImageLabels, number]>
    {
        return new Promise((resolve, reject) =>
        {
            this.getLabel(location, frameIndex, (rowData: ImageLabels, firstIndex: number) =>
            {
                resolve([rowData, firstIndex]);
            })
        });
    }

    public static getLabelValue(rowIdx: number, colIdx: number, rowArray: ImageLabels): number
    {
        // if this is a bottleneck, this could be improved with quicksearch.
        let row: Row = rowArray.rowList[rowIdx];
        for (let labelRun of row.row)
        {
            if (labelRun.start <= colIdx && colIdx < labelRun.start + labelRun.length)
            {
                return labelRun.label;
            }
        }
        return 0;
    }
}