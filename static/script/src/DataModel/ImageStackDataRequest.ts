import * as d3 from 'd3';
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
        });
        this._blobArray= [];
        this._maxBlobCount = 10;
        this._nextIndex = 0;
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

    // blob, key, url
    private _blobArray : [Blob, string, string][];
    public get blobArray() : [Blob, string, string][] {
        return this._blobArray;
    }

    private _nextIndex : number;
    public get nextIndex() : number {
        return this._nextIndex;
    }

; 
    public getImage(location: number, frame: number, callback: (top: number, left: number, blob: Blob, imageUrl: string) => void): void
    {
        // todo handle if metadata is not loaded. Maybe fallback timeout.
        if (!this.metaDataLoaded)
        {
            setTimeout(() =>
            {
                this.getImage(location, frame, callback)
            }, 50); // todo fallback
            return;
        }
        let [top, left] = this.getTileTopLeft(frame);
        let bundleIndex = Math.floor(frame / this.tilesPerFile);
        let key = [location, bundleIndex].join('-');
        
        let cachedElement = this.blobArray.find(d => d[1] === key);
        if (cachedElement)
        {
            callback(top, left, cachedElement[0], cachedElement[2]);
            return;
        }
        
        const imgUrl = `/data/${this.driveId}/img_${location}_${bundleIndex}.jpg`;

        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () =>
        {
            let blob = xhr.response;
            let url = window.URL.createObjectURL(blob);
            this.blobArray[this.nextIndex] = [blob, key, url];
            this._nextIndex = (this.nextIndex + 1) % this.maxBlobCount;
            callback(top, left, blob, url);
        }
        xhr.open('GET', imgUrl);
        xhr.send();
        return;
    }


    public getTileTopLeft(frame: number): [number, number]
	{
		const left: number = (frame % this.numberOfColumns) * this.tileWidth;
        let top: number = Math.floor((frame % this.tilesPerFile) / this.numberOfColumns) * this.tileHeight;
		return [top, left];
	}

        /**
         * --- Meta Data --- 
         * tile width
         * tile height
         * number of columns
         * tilesPerFile
         */

         /**
          * --- getLocation / Frame ---
          * gets blob and info to extract
          */

          /**
           * --- getLocation / Frame label ---
           * gets full row list with info to extract
           */


           /** 
            * Keeps list of blobs / and labels
            * only hold a certain amount in memory.
            */

}