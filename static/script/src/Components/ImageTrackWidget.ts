import * as d3 from 'd3';
import { HtmlSelection } from '../devlib/DevlibTypes';
import { ImageStackWidget } from './ImageStackWidget';
import { CurveND } from '../DataModel/CurveND';
import { PointND } from '../DataModel/PointND';
import { extent } from 'd3';
import { Rect } from '../types';

export class ImageTrackWidget
{
    constructor(container: HTMLElement, parent: ImageStackWidget)
    {
        this._container = container;
        this._parentWidget = parent;
        this._verticalPad = 16;
        this._horizontalPad = 8;
    }

    private _container : HTMLElement;
    public get container() : HTMLElement {
        return this._container;
    }

    private _parentWidget : ImageStackWidget;
    public get parentWidget() : ImageStackWidget {
        return this._parentWidget;
    }    

	private _selectedImageCanvas : HtmlSelection;
	public get selectedImageCanvas() : HtmlSelection {
		return this._selectedImageCanvas;
	}

	private _canvasContext : CanvasRenderingContext2D;
	public get canvasContext() : CanvasRenderingContext2D {
		return this._canvasContext;
    }
    
    private _trackList : CurveND[];
    public get trackList() : CurveND[] {
        return this._trackList;
    }

    
    private _verticalPad : number;
    public get verticalPad() : number {
        return this._verticalPad;
    }

    private _horizontalPad : number;
    public get horizontalPad() : number {
        return this._horizontalPad;
    }
    
    public init(): void
    {
        const containerSelect = d3.select(this.container);
        this._selectedImageCanvas = containerSelect.append('canvas');
        this._canvasContext = (this.selectedImageCanvas.node() as HTMLCanvasElement).getContext('2d');
    }

    public draw(tracks: CurveND[]): void
    {
        if (!this.parentWidget.labelArray)
        {
            // todo - clear canvas
            return;
        }
        if (tracks === this.trackList)
        {
            return;
        }
        this._trackList = tracks;
        this.drawTrackList();
    }

    private drawTrackList(): void
    {
        let listOfBoundingBoxLists = this.getBoundingBoxLists(this.trackList);
        let maxHeightList: number[] = [];
        let maxWidth: number = d3.max(listOfBoundingBoxLists, 
            (rectList: Rect[]) =>
            {
                return d3.max(rectList, r => ImageTrackWidget.rectWidth(r));
            });
        
        for (let rectList of listOfBoundingBoxLists)
        {
            let thisHeight = d3.max(rectList, r => ImageTrackWidget.rectHeight(r));
            maxHeightList.push(thisHeight); 
        }

        let minFrameId = d3.min(this.trackList, 
            (track: CurveND) =>
            {
                return d3.min(track.pointList, point => point.get('Frame ID'));
            });

        let maxFrameId = d3.max(this.trackList, 
            (track: CurveND) =>
            {
                return d3.max(track.pointList, point => point.get('Frame ID'));
            });

        const numFrames = maxFrameId - minFrameId;
        const canvasWidth = numFrames * maxWidth + this.horizontalPad * (numFrames + 1);
        const totalHeight = d3.sum(maxHeightList) + this.verticalPad * (this.trackList.length + 1);
        this.selectedImageCanvas
            .attr('width', canvasWidth)
            .attr('height', totalHeight);

        let verticalOffset: number = this.verticalPad;
        for (let i = 0; i < this.trackList.length; i++)
        {
            let track = this.trackList[i];
            let boundingBoxList = listOfBoundingBoxLists[i];
            let trackHeight = maxHeightList[i];
            this.drawTrack(track, boundingBoxList, maxWidth, trackHeight, minFrameId, verticalOffset);
            verticalOffset += trackHeight + this.verticalPad;
        }
    }

    private getBoundingBoxLists(trackList: CurveND[]): Rect[][]
    {
        let listOfLists: Rect[][] = [];
        for (let track of trackList)
        {
            let thisList: Rect[] = [];
            for (let point of track.pointList)
            {
                const boundingBox = this.getCellBoundingBox(point);
                thisList.push(boundingBox);
            }
            listOfLists.push(thisList);
        }
        return listOfLists;
    }

    private drawTrack(
        trackData: CurveND,
        boundingBoxList: Rect[],
        maxWidth: number, maxHeight: number,
        minFrame: number,
        verticalOffset: number): void
    {
        let asyncFunctionList = [];
        for (let i = 0; i < boundingBoxList.length; i++)
        {
            let bbox = boundingBoxList[i];
            let [sX, sY] = bbox[0];
            let width = ImageTrackWidget.rectWidth(bbox);
            let height = ImageTrackWidget.rectHeight(bbox);
            asyncFunctionList.push(createImageBitmap(this.parentWidget.imageStackBlob, sX, sY, width, height));
        }

        Promise.all(asyncFunctionList).then(
            (bitMapList: ImageBitmap[]) =>
            {
                for (let i = 0; i < bitMapList.length; i++)
                {
                    const imgBitmap = bitMapList[i];
                    const thisWidth = ImageTrackWidget.rectWidth(boundingBoxList[i]);
                    const thisHeight = ImageTrackWidget.rectHeight(boundingBoxList[i]);
                    const frameId = trackData.pointList[i].get('Frame ID');
                    const offsetIndex = frameId - minFrame;
                    const offsetX = this.horizontalPad + offsetIndex * (maxWidth + this.horizontalPad) + (maxWidth - thisWidth) / 2;
                    const offsetY = verticalOffset + (maxHeight - thisHeight) / 2;
                    this.canvasContext.drawImage(imgBitmap, offsetX, offsetY);
                }
            }
        )

    }

    private static rectWidth(rect: Rect): number
    {
        return rect[1][0] - rect[0][0];
    }
    
    private static rectHeight(rect: Rect): number
    {
        return rect[1][1] - rect[0][1];
    }

    private getCellBoundingBox(point: PointND): Rect
    {
        const locId = point.get('Location ID');
        const frameId = point.get('Frame ID');
        const frameIndex = frameId - 1; // MatLab..        
        const segmentId = point.get('segmentLabel');
        const numPixelsInTile = this.parentWidget.numPixelsInTile;
        const firstIndex = frameIndex * numPixelsInTile;
        let extent: Rect = [[Infinity, Infinity], [-Infinity, -Infinity]]
        for (let i = firstIndex; i < firstIndex + numPixelsInTile; i++)
        {
            let [tileX, tileY] = this.parentWidget.getTilePixelXYFromLabelIndex(firstIndex, i);
            let [tileTop, tileLeft] = this.parentWidget.getTileTopLeft(frameIndex);
            let bigImgX = tileLeft + tileX;
            let bigImgY = tileTop + tileY;

            let imgLabel = this.parentWidget.labelArray[i];
            if (imgLabel === segmentId)
            {
                let [[minX, minY], [maxX, maxY]] = extent;
                minX = Math.min(minX, bigImgX);
                minY = Math.min(minY, bigImgY);
                maxX = Math.max(maxX, bigImgX);
                maxY = Math.max(maxY, bigImgY);
                extent = [[minX, minY], [maxX, maxY]];
            }
        }
        return extent;
    }
}