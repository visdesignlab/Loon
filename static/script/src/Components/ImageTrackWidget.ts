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

    public init(): void
    {
        const containerSelect = d3.select(this.container);
        this._selectedImageCanvas = containerSelect.append('canvas');
        this._canvasContext = (this.selectedImageCanvas.node() as HTMLCanvasElement).getContext('2d');
    }

    public draw(): void
    {
        if (!this.parentWidget.labelArray)
        {
            return;
        }
        console.log('draw image track widget');
        let [hardCodedTestCell, _] = this.parentWidget.data.GetCellFromLabel(91, 5, 23);
        this.drawTrack(hardCodedTestCell.parent, this.selectedImageCanvas);
    }

    private drawTrack(trackData: CurveND, canvasSelection: HtmlSelection ): void
    {
        // loop over cells and extract based on parent image data and label data
        const canvasContext = (canvasSelection.node() as HTMLCanvasElement).getContext('2d');
        let boundingBoxList: Rect[] = [];
        for (let point of trackData.pointList)
        {
            const boundingBox = this.getCellBoundingBox(point);
            boundingBoxList.push(boundingBox);
        }
        const maxWidth = d3.max(boundingBoxList, r => ImageTrackWidget.rectWidth(r));
        const maxHeight = d3.max(boundingBoxList, r => ImageTrackWidget.rectHeight(r));
        const canvasWidth = trackData.pointList.length * maxWidth;
        this.selectedImageCanvas
            .attr('width', canvasWidth)
            .attr('height', maxHeight);


        let asyncFunctionList = [];
        for (let i = 0; i < boundingBoxList.length; i++)
        {
            let bbox = boundingBoxList[i];
            let [sX, sY] = bbox[0];
            let width = ImageTrackWidget.rectWidth(bbox);
            let height = ImageTrackWidget.rectHeight(bbox);
            asyncFunctionList.push(createImageBitmap(this.parentWidget.imageStackBlob, sX, sY, width, height));
            // createImageBitmap(this.parentWidget.imageStackBlob, sX, sY, width, height).then(
            //     (imgBitmap: ImageBitmap) =>
            //     {
            //         const off
            //         canvasContext.drawImage(imgBitmap, asdf, 0);
            //     }
            // );
        }

        Promise.all(asyncFunctionList).then(
            (bitMapList: ImageBitmap[]) =>
            {
                for (let i = 0; i < bitMapList.length; i++)
                {
                    let imgBitmap = bitMapList[i];
                    const offset = i * maxWidth;
                    canvasContext.drawImage(imgBitmap, offset, 0);
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