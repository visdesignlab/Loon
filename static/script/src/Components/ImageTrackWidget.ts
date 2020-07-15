import * as d3 from 'd3';
import { HtmlSelection, SvgSelection, Margin } from '../devlib/DevlibTypes';
import { ImageStackWidget } from './ImageStackWidget';
import { CurveND } from '../DataModel/CurveND';
import { PointND } from '../DataModel/PointND';
import { extent, linkVertical, VoronoiEdge } from 'd3';
import { Rect } from '../types';
import { DevlibMath } from '../devlib/DevlibMath';
import { DevlibAlgo } from '../devlib/DevlibAlgo';

export class ImageTrackWidget
{
    constructor(container: HTMLElement, parent: ImageStackWidget)
    {
        this._container = container;
        this._parentWidget = parent;
        this._verticalPad = 16;
        this._horizontalPad = 8;
        this._frameLabelPositions = [];
        this._cellLabelPositions = [];

        // hardcoded from css
        this._cellTimelineMargin = {
            top: 36,
            right: 4,
            bottom: 4,
            left: 72
        }
        this._latestScroll = [0,0];
        this._scrollChangeTicking = false;
        this._sourceDestCell = [];
    }

    private _container : HTMLElement;
    public get container() : HTMLElement {
        return this._container;
    }

    private _parentWidget : ImageStackWidget;
    public get parentWidget() : ImageStackWidget {
        return this._parentWidget;
    }    
    
    private _innerContainer : HtmlSelection;
    public get innerContainer() : HtmlSelection {
        return this._innerContainer;
    }

    private _innerContainerW : number;
    public get innerContainerW() : number {
        return this._innerContainerW;
    }
    
    private _innerContainerH : number;
    public get innerContainerH() : number {
        return this._innerContainerH;
    }

    private _svgContainer : SvgSelection;
    public get svgContainer() : SvgSelection {
        return this._svgContainer;
    }

    private _cellLabelGroup : SvgSelection;
    public get cellLabelGroup() : SvgSelection {
        return this._cellLabelGroup;
    }

    private _frameLabelGroup : SvgSelection;
    public get frameLabelGroup() : SvgSelection {
        return this._frameLabelGroup;
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

    private _frameLabelPositions : [string, number][];
    public get frameLabelPositions() : [string, number][] {
        return this._frameLabelPositions;
    }

    private _cellLabelPositions : [string, number][];
    public get cellLabelPositions() : [string, number][] {
        return this._cellLabelPositions;
    }

    private _cellTimelineMargin : Margin;
    public get cellTimelineMargin() : Margin {
        return this._cellTimelineMargin;
    }

    private _scrollChangeTicking : boolean;
    public get scrollChangeTicking() : boolean {
        return this._scrollChangeTicking;
    }    

    private _latestScroll : [number, number];
    public get latestScroll() : [number, number] {
        return this._latestScroll;
    }

    private _latestMouseCanvasOffset : [number, number];
    public get latestMouseCanvasOffset() : [number, number] {
        return this._latestMouseCanvasOffset;
    }    

    private _sourceDestCell : [Rect, [number, number], PointND][];
    public get sourceDestCell() : [Rect, [number, number], PointND][] {
        return this._sourceDestCell;
    }
    

    public init(): void
    {
        const containerSelect = d3.select(this.container);
        this._svgContainer = containerSelect.append('svg');
        this._cellLabelGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top})`);
            
        this._frameLabelGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(${this.cellTimelineMargin.left}, 0)`);

        this._innerContainer = containerSelect.append('div')
            .classed('cellTimelineInnerContainer', true)
            .classed('overflow-scroll', true);

        this.innerContainer.node().addEventListener('scroll', (e: WheelEvent) => {
            this.onCellTimelineScroll(e);
            // todo - update hover state
        });

        this._selectedImageCanvas = this.innerContainer.append('canvas');
        this.selectedImageCanvas.node().addEventListener('mousemove', (e: MouseEvent) => 
        {
            this.onCanvasMouseMove(e);
        });

        this.selectedImageCanvas.on('mouseleave', () => {
            this.parentWidget.hideSegmentHover(true);
            this.parentWidget.dimCanvas();
        });

        this._canvasContext = (this.selectedImageCanvas.node() as HTMLCanvasElement).getContext('2d');
    }

    public draw(tracks: CurveND[]): void
    {
        this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
        if (!this.parentWidget.labelArray)
        {
            return;
        }
        if (tracks === this.trackList)
        {
            return;
        }
        this._trackList = tracks;
        this.drawTrackList();
        this.drawLabels();
    }

    public OnBrushChange(): void
    {
        this.drawOutlines();
    }

    private drawTrackList(): void
    {
        this._cellLabelPositions = [];
        this._sourceDestCell = [];
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

        const numFrames = maxFrameId - minFrameId + 1;
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
            this._cellLabelPositions.push([track.id, verticalOffset + trackHeight / 2]);
            verticalOffset += trackHeight + this.verticalPad;
        }
        this._frameLabelPositions = [];
        for (let i = 0; i < numFrames; i++)
        {
            let frameId: string = (i + minFrameId).toString();
            let offset = this.horizontalPad
            offset += i * (maxWidth + this.horizontalPad);
            offset += maxWidth / 2;
            this._frameLabelPositions.push([frameId, offset]);
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
        let offsetArray: [number, number][] = [];
        for (let i = 0; i < boundingBoxList.length; i++)
        {
            // this is a bit painful. The biggest addition to the complexity
            // is accounting for edge cases in the tile of the tiled image.
            // if it gets to an edge only only copies what it can, then centers in
            // a rect of the same size as others in the cell.
            let bbox = boundingBoxList[i];
            let [sX, sY] = bbox[0];
            let width = ImageTrackWidget.rectWidth(bbox);
            let height = ImageTrackWidget.rectHeight(bbox);
            let extraX = Math.round((maxWidth - width) / 2);
            let extraY = Math.round((maxHeight - height) / 2);
            const point = trackData.pointList[i];
            const frameId = point.get('Frame ID');

            const offsetIndex = frameId - minFrame;
            const frameIndex = frameId - 1;

            const [tileTop, tileLeft] = this.parentWidget.getTileTopLeft(frameIndex);
            const tileBot = tileTop + this.parentWidget.imageStackMetaData.tileHeight;
            const tileRight = tileLeft + this.parentWidget.imageStackMetaData.tileWidth;

            const copyTop = DevlibMath.clamp(sY - extraY, [tileTop, tileBot]);
            const copyLeft = DevlibMath.clamp(sX - extraX, [tileLeft, tileRight]);
            
            const copyWidth = Math.min(maxWidth, tileRight - copyLeft);
            const copyHeight = Math.min(maxHeight, tileBot - copyTop);
            
            const offsetX = Math.round(this.horizontalPad + offsetIndex * (maxWidth + this.horizontalPad) + (maxWidth - copyWidth) / 2);
            const offsetY = Math.round(verticalOffset + (maxHeight - copyHeight) / 2);
            const destOffset: [number, number] = [offsetX, offsetY];
            offsetArray.push(destOffset);
            let sourceRect: Rect = [[copyLeft, copyTop], [copyLeft + copyWidth, copyTop + copyHeight]];
            this.sourceDestCell.push([sourceRect, destOffset, point]);
            asyncFunctionList.push(createImageBitmap(this.parentWidget.imageStackBlob, copyLeft, copyTop, copyWidth, copyHeight));
        }

        // draw track background
        let offsetIndex = trackData.pointList[0].get('Frame ID') - minFrame;
        const minDestX = this.horizontalPad + offsetIndex * (maxWidth + this.horizontalPad);
        const lastIndex = trackData.pointList.length - 1;
        offsetIndex = trackData.pointList[lastIndex].get('Frame ID') - minFrame + 1;
        const maxDestX = offsetIndex * (maxWidth + this.horizontalPad);
        const minDestY = verticalOffset;

        this.canvasContext.beginPath();
        const marginX = 4;
        const marginY = 4;
        this.canvasContext.rect(
            minDestX - marginX,
            minDestY - marginY,
            maxDestX - minDestX + 1 + 2 * marginX,
            maxHeight + 2 * marginY);
        this.canvasContext.strokeStyle = 'black';
        this.canvasContext.fillStyle = 'rgb(240,240,240)';
        this.canvasContext.stroke();
        this.canvasContext.fill();
        this.canvasContext.closePath();

        Promise.all(asyncFunctionList).then(
            (bitMapList: ImageBitmap[]) =>
            {
                for (let i = 0; i < bitMapList.length; i++)
                {
                    const imgBitmap = bitMapList[i];
                    const frameId = trackData.pointList[i].get('Frame ID');
                    const currentFrame: boolean = frameId === this.parentWidget.getCurrentFrameId();
                    const offsetIndex = frameId - minFrame;
                    const frameX = this.horizontalPad + offsetIndex * (maxWidth + this.horizontalPad);
                    const frameY = verticalOffset;
                    const [offsetX, offsetY] = offsetArray[i];

                    this.canvasContext.beginPath();
                    this.canvasContext.rect(frameX, frameY, maxWidth, maxHeight);
                    if (currentFrame)
                    {
                        this.canvasContext.strokeStyle = 'MediumSeaGreen';
                        this.canvasContext.lineWidth = 8; 

                    }
                    else
                    {
                        this.canvasContext.strokeStyle = 'grey';
                        this.canvasContext.lineWidth = 1; 
                    }

                    this.canvasContext.fillStyle = 'black';
                    this.canvasContext.stroke();
                    this.canvasContext.fill();
                    this.canvasContext.closePath();

                    this.canvasContext.drawImage(imgBitmap, offsetX, offsetY);
                }
                this.drawOutlines();
            }
        );
    }

    private static rectWidth(rect: Rect): number
    {
        return rect[1][0] - rect[0][0] + 1;
    }
    
    private static rectHeight(rect: Rect): number
    {
        return rect[1][1] - rect[0][1] + 1;
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

    private onCellTimelineScroll(event: Event): void
    {
        let el = this.innerContainer.node();
        this._latestScroll = [el.scrollLeft, el.scrollTop];
        if (!this.scrollChangeTicking)
        {
            window.requestAnimationFrame(() =>
            {
                this.drawLabels()
                this._scrollChangeTicking = false;
            });
            this._scrollChangeTicking = true;
        }
    }

    private onCanvasMouseMove(e: MouseEvent | WheelEvent): void
    {
        if (!this.parentWidget.labelArray)
        {
            return;
        }
        let xPos = e.offsetX;
        let yPos = e.offsetY;
        const frameId: number = +ImageTrackWidget.getClosestLabel(this.frameLabelPositions, xPos);
        const cellId: string = ImageTrackWidget.getClosestLabel(this.cellLabelPositions, yPos);

        console.log(frameId);
        console.log(cellId);
        let curve: CurveND = this.parentWidget.data.curveLookup.get(cellId);
        this.parentWidget.selectedImgIndex;
        const displayedFrameId = this.parentWidget.getCurrentFrameId();
        let point = curve.pointList.find(point => point.get('Frame ID') === displayedFrameId);
        // let point = this.parentWidget.data.curveList.find
        this.parentWidget.showSegmentHover(point.get('segmentLabel'), true);
        this.parentWidget.brightenCanvas();
    }

    private static getClosestLabel(labelPositions: [string, number][], pos: number): string
    {
        let compareFunction = DevlibAlgo.compareProperty<[string, number]>(pos, labelPos =>  labelPos[1]);
        let indices = DevlibAlgo.BinarySearchIndex(labelPositions, compareFunction);
        let labelIndex: number;
        if (typeof indices === 'number')
        {
            labelIndex = indices;
        }
        else {
            let [indexLow, indexHigh] = indices;
            if (typeof indexLow === 'undefined')
            {
                labelIndex = indexHigh;
            }
            else if (typeof indexHigh === 'undefined')
            {
                labelIndex = indexLow;
            }
            else {
                const [ _labelLow, labelPosLow] = labelPositions[indexLow];
                const [ _labelHeigh, labelPosHigh] = labelPositions[indexHigh];
                const distToLow = pos - labelPosLow;
                const distToHigh = labelPosHigh - pos;
                if (distToLow < distToHigh)
                {
                    labelIndex = indexLow;
                }
                else
                {
                    labelIndex = indexHigh;
                }
            }
        }
        return labelPositions[labelIndex][0];
    }

    private drawOutlines(): void
    {
        for (let [sourceRect, [dX, dY], point] of this.sourceDestCell)
        {
            let width = ImageTrackWidget.rectWidth(sourceRect);
            let height = ImageTrackWidget.rectHeight(sourceRect);
            let [[sLeft, sTop], [sRight, sBot]] = sourceRect;
            let outlineTileData = this.canvasContext.getImageData(dX, dY, width, height);
            let labelToMatch = point.get('segmentLabel');
            let rIdx = 0;
            for (let y = sTop; y <= sBot; y++)
            {
                for (let x = sLeft; x <= sRight; x++)
                {
                    let labelIndex = this.parentWidget.getLabelIndexFromBigImgPixelXY(x, y);
                    if (this.parentWidget.labelArray[labelIndex] == labelToMatch)
                    {
                        if (this.parentWidget.isBorder(labelIndex))
                        {
                            let [r, g, b] = this.parentWidget.getCellColor(point);
                            outlineTileData.data[rIdx] = r;
                            outlineTileData.data[rIdx + 1] = g;
                            outlineTileData.data[rIdx + 2] = b;
                            outlineTileData.data[rIdx + 3] = 255;
                        }
                    }
                    rIdx += 4;
                }
            }
            this.canvasContext.putImageData(outlineTileData, dX, dY);
        }
    }

    private drawLabels(): void
    {
        // cell labels
        let pad = 10;
        const xAnchor = this.cellTimelineMargin.left - pad;
        let labelsInView = this.cellLabelPositions.filter((labelPos: [string, number]) =>
        {
            const pos: number = labelPos[1] - this.latestScroll[1];
            return 0 <= pos && pos <= this.innerContainerH;
        });
        this.cellLabelGroup.selectAll('text')
            .data(labelsInView)
            .join('text')
            .text(d => d[0])
            .attr('x', xAnchor)
            .attr('y', d => d[1] - this.latestScroll[1])
            .classed('cellAxisLabel', true)
            .classed('left', true);

        // frame labels
        pad = 6;
        const yAnchor = this.cellTimelineMargin.top - pad;
        labelsInView = this.frameLabelPositions.filter((labelPos: [string, number]) =>
        {
            const pos: number = labelPos[1] - this.latestScroll[0];
            return 0 <= pos && pos <= this.innerContainerW;
        });
        const currentFrame  = this.parentWidget.getCurrentFrameId();
        this.frameLabelGroup.selectAll('text')
            .data(labelsInView)
            .join('text')
            .text(d => d[0])
            .attr('x', d => d[1] - this.latestScroll[0])
            .attr('y', yAnchor)
            .classed('currentFrame', d => +d[0] === currentFrame)
            .classed('cellAxisLabel', true)
            .classed('right', true);
    }

    public OnResize(width: number, height: number): void
    {
        this.svgContainer
            .attr('height', height)
            .attr('width', width);

        const innerW = width - this.cellTimelineMargin.left - this.cellTimelineMargin.right;
        this._innerContainerW = innerW;
        const innerH = height - this.cellTimelineMargin.top - this.cellTimelineMargin.bottom;
        this._innerContainerH = innerH;
        this.innerContainer
            .attr('style',
            `max-width: ${innerW}px;
            max-height: ${innerH}px;
            width: ${innerW}px;
            height: ${innerH}px;`)
    }
}