import * as d3 from 'd3';
import { IDBPDatabase, openDB } from 'idb';
import { load } from 'protobufjs';
import { App } from '../App';

export interface ImageLabels {
    rowList: Row[];
}

export interface Row {
    row: LabelRun[];
}

export interface LabelRun {
    start: number;
    length: number;
    label: number;
}

export class ImageStackDataRequest {
    public constructor(driveId: string) {
        this._driveId = driveId;

        const metaDataFilename = `/data/${this.driveId}/imageMetaData.json`;
        this._jsonPromise = d3.json(metaDataFilename);

        load('/static/protoDefs/RLE.proto', async (err, root) => {
            if (err) {
                throw err;
            }
            this._imageLabelsMessage = root.lookupType(
                'imageLabels.ImageLabels'
            );
        });

        openDB('loon-db').then(async dataStore => {
            this._dataStore = dataStore;
        });

        this._labelCache = new Map();
        this._blobCache = new Map();
    }

    public async init(): Promise<void> {
        const metaDataFilename = `/data/${this.driveId}/imageMetaData.json`;
        let data = await this.jsonPromise;
        this.initImageMetaData(data);
    }

    private initImageMetaData(data: any): void {
        this._tileWidth = data.tileWidth;
        this._tileHeight = data.tileHeight;
        this._numberOfColumns = data.numberOfColumns;
        this._tilesPerFile = data.tilesPerFile;
        if (data.scaleFactor) {
            this._scaleFactor = data.scaleFactor;
        } else {
            this._scaleFactor = 1;
        }
    }

    private _jsonPromise: Promise<any>;
    public get jsonPromise(): Promise<any> {
        return this._jsonPromise;
    }

    private _driveId: string;
    public get driveId(): string {
        return this._driveId;
    }

    private _tileWidth: number;
    public get tileWidth(): number {
        return this._tileWidth;
    }

    private _tileHeight: number;
    public get tileHeight(): number {
        return this._tileHeight;
    }

    private _numberOfColumns: number;
    public get numberOfColumns(): number {
        return this._numberOfColumns;
    }

    private _tilesPerFile: number;
    public get tilesPerFile(): number {
        return this._tilesPerFile;
    }

    private _scaleFactor: number;
    public get scaleFactor(): number {
        return this._scaleFactor;
    }

    private _blobCache: Map<string, { img: Blob; url: string }>;
    public get blobCache(): Map<string, { img: Blob; url: string }> {
        return this._blobCache;
    }
    public set blobCache(v: Map<string, { img: Blob; url: string }>) {
        this._blobCache = v;
    }

    private _labelCache: Map<string, ImageLabels>;
    public get labelCache(): Map<string, ImageLabels> {
        return this._labelCache;
    }

    private _dataStore: IDBPDatabase<unknown>;
    public get dataStore(): IDBPDatabase<unknown> {
        return this._dataStore;
    }

    private _imageLabelsMessage: any;
    public get imageLabelsMessage(): any {
        return this._imageLabelsMessage;
    }

    public async getImage(
        location: number,
        frameIndex: number,
        callback: (
            top: number,
            left: number,
            blob: Blob,
            imageUrl: string
        ) => void
    ): Promise<void> {
        let [top, left] = this.getTileTopLeft(frameIndex);
        let bundleIndex = Math.floor(frameIndex / this.tilesPerFile);
        let key = [location, bundleIndex].join('-');
        if (this.blobCache.has(key)) {
            this.runWithCachedImage(key, top, left, callback);
            return;
        }
        const imgUrl = `/data/${this.driveId}/img_${location}_${bundleIndex}.jpg`;
        this.blobCache.set(key, { img: null, url: null });
        if (this.dataStore) {
            // try and get from data store
            let store = this.dataStore
                .transaction('images', 'readonly')
                .objectStore('images');
            let blob = await store.get(imgUrl);
            if (blob) {
                let url = window.URL.createObjectURL(blob);

                this.blobCache.set(key, { img: blob, url: url });
                callback(top, left, blob, url);
                return;
            }
        }

        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () => {
            let blob = xhr.response;
            if (this.dataStore) {
                this.dataStore.put<any>('images', blob, imgUrl);
            }
            let url = window.URL.createObjectURL(blob);
            this.blobCache.set(key, { img: blob, url: url });

            callback(top, left, blob, url);
        };
        xhr.onerror = e => {
            console.warn('Error Fetching: ' + imgUrl);
            console.warn(e);
        };
        xhr.open('GET', imgUrl);
        xhr.send();
        return;
    }

    private runWithCachedImage(
        key: string,
        top: number,
        left: number,
        callback: (
            top: number,
            left: number,
            blob: Blob,
            imageUrl: string
        ) => void
    ): void {
        let cachedElement = this.blobCache.get(key);
        if (cachedElement.img && cachedElement.url) {
            callback(top, left, cachedElement.img, cachedElement.url);
        } else {
            setTimeout(() => {
                this.runWithCachedImage(key, top, left, callback);
            }, 50);
        }
    }

    public getImagePromise(
        location: number,
        frameIndex: number
    ): Promise<[number, number, Blob, string]> {
        return new Promise((resolve, reject) => {
            try {
                this.getImage(
                    location,
                    frameIndex,
                    (
                        top: number,
                        left: number,
                        blob: Blob,
                        imageUrl: string
                    ) => {
                        resolve([top, left, blob, imageUrl]);
                    }
                );
            } catch (error) {
                console.error(error);
                reject();
            }
        });
    }

    public getTileTopLeft(frameIndex: number): [number, number] {
        const left: number =
            (frameIndex % this.numberOfColumns) * this.tileWidth;
        let top: number =
            Math.floor(
                (frameIndex % this.tilesPerFile) / this.numberOfColumns
            ) * this.tileHeight;
        return [top, left];
    }

    public async getLabel(
        location: number,
        frameIndex: number,
        callback: (rowData: ImageLabels, firstIndex: number) => void
    ): Promise<void> {
        if (!this.imageLabelsMessage) {
            setTimeout(() => {
                this.getLabel(location, frameIndex, callback);
            }, 50);
            return;
        }

        let firstIndex: number =
            (frameIndex % this.tilesPerFile) * this.tileHeight;
        let bundleIndex = Math.floor(frameIndex / this.tilesPerFile);
        let key = [location, bundleIndex].join('-');

        if (this.labelCache.has(key)) {
            this.runWithCachedLabel(key, firstIndex, callback);
            return;
        }
        await this.runWithoutCachedLabel(
            location,
            key,
            firstIndex,
            bundleIndex,
            callback
        );
        return;
    }

    private async runWithoutCachedLabel(
        location: number,
        key: string,
        firstIndex: number,
        bundleIndex: number,
        callback: (rowData: ImageLabels, firstIndex: number) => void
    ): Promise<void> {
        console.log('NO CACHE');

        this.labelCache.set(key, null);

        const labelUrl = `/data/${this.driveId}/label_${location}_${bundleIndex}.pb`;

        let buffer;
        if (this.dataStore) {
            let store = this.dataStore
                .transaction('images', 'readonly')
                .objectStore('images');
            buffer = await store.get(labelUrl);
        }
        if (!buffer) {
            buffer = await d3.buffer(labelUrl);
            await this.dataStore.put<any>('images', buffer, labelUrl);
        }

        let message = this.imageLabelsMessage.decode(
            new Uint8Array(buffer)
        ) as any;

        this.labelCache.set(key, message);
        callback(message, firstIndex);

        return;
    }

    private runWithCachedLabel(
        key: string,
        firstIndex: number,
        callback: (rowData: ImageLabels, firstIndex: number) => void
    ): void {
        console.log('CACHE');

        let cachedElement = this.labelCache.get(key);
        if (cachedElement !== null) {
            callback(cachedElement, firstIndex);
        } else {
            // loading, try again later
            setTimeout(() => {
                this.runWithCachedLabel(key, firstIndex, callback);
            }, 50);
        }
    }

    public getLabelPromise(
        location: number,
        frameIndex: number
    ): Promise<[ImageLabels, number]> {
        return new Promise((resolve, reject) => {
            this.getLabel(
                location,
                frameIndex,
                (rowData: ImageLabels, firstIndex: number) => {
                    resolve([rowData, firstIndex]);
                }
            );
        });
    }

    public static getLabelValue(
        rowIdx: number,
        colIdx: number,
        rowArray: ImageLabels
    ): number {
        // if this is a bottleneck, this could be improved with quicksearch.
        let row: Row = rowArray.rowList[rowIdx];
        for (let labelRun of row.row) {
            if (
                labelRun.start <= colIdx &&
                colIdx < labelRun.start + labelRun.length
            ) {
                return labelRun.label;
            }
        }
        return 0;
    }
}
