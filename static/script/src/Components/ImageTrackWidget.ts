import * as d3 from 'd3';
import {toOrdinal} from 'number-to-words';
import { HtmlSelection, SvgSelection, Margin, NDim, ButtonProps } from '../devlib/DevlibTypes';
import { ImageStackWidget } from './ImageStackWidget';
import { CurveND } from '../DataModel/CurveND';
import { PointND } from '../DataModel/PointND';
import { conditionExemplar, Rect } from '../types';
import { DevlibMath } from '../devlib/DevlibMath';
import { DevlibAlgo } from '../devlib/DevlibAlgo';
import { ImageLabels, ImageStackDataRequest, Row } from '../DataModel/ImageStackDataRequest';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { CurveList } from '../DataModel/CurveList';
import { HistogramWidget } from './HistogramWidget';
import { OptionSelect } from './OptionSelect';
import { GroupByWidget } from './GroupByWidget';

export class ImageTrackWidget
{
    constructor(container: HTMLElement, parent: ImageStackWidget, samplingStratOptions: {"strat": (number[] | number), "label": string}[])
    {
        this._container = container;
        this._parentWidget = parent;
        this._verticalPad = 16;
        this._horizontalPad = 8;
        this._trackToPlotPadding = 48;
        this._exemplarMinWidth = 80;
        this._minHeightForFavorites = 120 + 2 * this.verticalPad;
        this._frameLabelPositions = [];
        this._cellLabelPositions = [];
        this._exemplarYKey = 'Mass_norm';
        this._samplingStratOptions = samplingStratOptions;
		this._smoothCurves = true;
        this._draggingPin = false;
        // hardcoded from css
        this._cellTimelineMargin = {
            top: 36,
            right: 4,
            bottom: 4,
            left: 124
        }
        this._latestScroll = [0,0];
        this._scrollChangeTicking = false;
        this._sourceDestCell = [];
        this._histogramScaleYList = [];
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

    private _titleContainer : HtmlSelection;
    public get titleContainer() : HtmlSelection {
        return this._titleContainer;
    }
    
    private _samplingStrategySelect : OptionSelect;
    public get samplingStrategySelect() : OptionSelect {
        return this._samplingStrategySelect;
    }

    private _samplingStratOptions : {"strat": (number[] | number), "label": string}[];
    public get samplingStratOptions() : ({"strat": (number[] | number), "label": string}[]) {
        return this._samplingStratOptions;
    }

    private _currentSamplingStategy : {"strat": (number[] | number), "label": string};
    public get currentSamplingStategy() : {"strat": (number[] | number), "label": string} {
        return this._currentSamplingStategy;
    }

    private _manualSampleValues : number[];
    public get manualSampleValues() : number[] {
        return this._manualSampleValues;
    }

    public set manualSampleValues(v: number[]) {
        this._manualSampleValues = v;
    }

    private _svgContainer : SvgSelection;
    public get svgContainer() : SvgSelection {
        return this._svgContainer;
    }

    private _cellLabelGroup : SvgSelection;
    public get cellLabelGroup() : SvgSelection {
        return this._cellLabelGroup;
    }

    private _labelLinePad : number;
    public get labelLinePad() : number {
        return this._labelLinePad;
    }    

    private _scentedWidgetGroup : SvgSelection;
    public get scentedWidgetGroup() : SvgSelection {
        return this._scentedWidgetGroup;
    }    

    private _exemplarPinGroup : SvgSelection;
    public get exemplarPinGroup() : SvgSelection {
        return this._exemplarPinGroup;
    }
    
    private _addPinRectGroup : SvgSelection;
    public get addPinRectGroup() : SvgSelection {
        return this._addPinRectGroup;
    }

    private _manualExemplarPinGroup : SvgSelection;
    public get manualExemplarPinGroup() : SvgSelection {
        return this._manualExemplarPinGroup;
    }

    private _frameLabelGroup : SvgSelection;
    public get frameLabelGroup() : SvgSelection {
        return this._frameLabelGroup;
    }
    
    private _exemplarCurvesGroup : SvgSelection;
    public get exemplarCurvesGroup() : SvgSelection {
        return this._exemplarCurvesGroup;
    }

    private _shameRectangle : SvgSelection;
    public get shameRectangle() : SvgSelection {
        return this._shameRectangle;
    }    

	private _selectedImageCanvas : HtmlSelection;
	public get selectedImageCanvas() : HtmlSelection {
		return this._selectedImageCanvas;
	}

	private _canvasContext : CanvasRenderingContext2D;
	public get canvasContext() : CanvasRenderingContext2D {
		return this._canvasContext;
    }
    
	private _defaultCanvasState: ImageData;
	public get defaultCanvasState(): ImageData {
		return this._defaultCanvasState;
	}

    private _trackList : conditionExemplar<CurveND>[];
    public get trackList() : conditionExemplar<CurveND>[] {
        return this._trackList;
    }
        
    private _manuallyPinnedTracks : CurveND[];
    public get manuallyPinnedTracks() : CurveND[] {
        return this._manuallyPinnedTracks;
    }

    private _minHeightForFavorites : number;
    public get minHeightForFavorites() : number {
        return this._minHeightForFavorites;
    }    
    
    private _verticalPad : number;
    public get verticalPad() : number {
        return this._verticalPad;
    }

    private _horizontalPad : number;
    public get horizontalPad() : number {
        return this._horizontalPad;
    }

    private _trackToPlotPadding : number;
    public get trackToPlotPadding() : number {
        return this._trackToPlotPadding;
    }

    private _frameLabelPositions : [string, number][];
    public get frameLabelPositions() : [string, number][] {
        return this._frameLabelPositions;
    }

    private _cellLabelPositions : [string, number][];
    public get cellLabelPositions() : [string, number][] {
        return this._cellLabelPositions;
    }

    private _conditionLabelPositions : [string, [number, number]][];
    public get conditionLabelPositions() : [string, [number, number]][] {
        return this._conditionLabelPositions;
    }

    private _histogramScaleX : d3.ScaleLinear<number, number>;
    public get histogramScaleX() : d3.ScaleLinear<number, number> {
        return this._histogramScaleX;
    }

    private _histogramScaleYList : d3.ScaleLinear<number, number>[];
    public get histogramScaleYList() : d3.ScaleLinear<number, number>[] {
        return this._histogramScaleYList;
    }

    private _normalizedHistogramScaleY : d3.ScaleLinear<number, number>;
    public get normalizedHistogramScaleY() : d3.ScaleLinear<number, number> {
        return this._normalizedHistogramScaleY;
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
    
    private _exemplarScaleX : d3.ScaleLinear<number, number>;
    public get exemplarScaleX() : d3.ScaleLinear<number, number> {
        return this._exemplarScaleX;
    }

    private _exemplarScaleY : d3.ScaleLinear<number, number>;
    public get exemplarScaleY() : d3.ScaleLinear<number, number> {
        return this._exemplarScaleY;
    }

    private _exemplarMinWidth : number;
    public get exemplarMinWidth() : number {
        return this._exemplarMinWidth;
    }

    private _exemplarYKey : string;
    public get exemplarYKey() : string {
        return this._exemplarYKey;
    }

    private _smoothCurves : boolean;
	public get smoothCurves() : boolean {
		return this._smoothCurves;
	}

    private _draggingPin : boolean;
    public get draggingPin() : boolean {
        return this._draggingPin;
    }

    private _draggingPinElement : SVGPathElement;
    public get draggingPinElement() : SVGPathElement {
        return this._draggingPinElement;
    }

    private _needleSelection : d3.Selection<SVGLineElement, any, Element, any>;
    public get needleSelection() : d3.Selection<SVGLineElement, any, Element, any> {
        return this._needleSelection;
    }

    private _textSelection : d3.Selection<SVGTextElement, any, Element, any>;
    public get textSelection() : d3.Selection<SVGTextElement, any, Element, any> {
        return this._textSelection;
    }

    private _initialDragCoords : [number, number];
    public get initialDragCoords() : [number, number] {
        return this._initialDragCoords;
    }

    private _totalDragOffset : [number, number];
    public get totalDragOffset() : [number, number] {
        return this._totalDragOffset;
    }

    private _initialPinValue : number;
    public get initialPinValue() : number {
        return this._initialPinValue;
    }

    private _anchorPinValue : number;
    public get anchorPinValue() : number {
        return this._anchorPinValue;
    }

    private _pinMoved : boolean;
    public get pinMoved() : boolean {
        return this._pinMoved;
    }
    
    private _dragGroupIndex : number;
    public get dragGroupIndex() : number {
        return this._dragGroupIndex;
    }

    private _trackHeightList : number[];
    public get trackHeightList() : number[] {
        return this._trackHeightList;
    }
    
    private _trackVerticalOffsetList : number[];
    public get trackVerticalOffsetList() : number[] {
        return this._trackVerticalOffsetList;
    }   

    public init(): void
    {
        const containerSelect = d3.select(this.container);
        
        const titleBarDiv = containerSelect.append('div')
            .classed('trackModeTitleContainer', true)
            .classed('mediumText', true);

            
        this._titleContainer= titleBarDiv.append('span');

        const optionSelectContainer = titleBarDiv.append('span')
            .attr('id', 'exemplarSamplingStratSelection')

        this._samplingStrategySelect = new OptionSelect('exemplarSamplingStratSelection', 'Sampled at');
        let buttonPropList: ButtonProps[] = [];
        this._currentSamplingStategy = this.samplingStratOptions[0]; // default to first
        this._manualSampleValues = []; // todo remove
        for (let option of this.samplingStratOptions)
        {
            let optionName: string;
            if (option.label)
            {
                optionName = option.label;
            }
			else if (Array.isArray(option.strat))
			{
                let optionCopy: number[] | string[] = option.strat.map(x => x);
                if (option.strat.length < 8)
                {
                    optionCopy = optionCopy.map(x => 
                        {
                            if (x == 0)
                            {
                                return 'Min';
                            }
                            if (x == 0.5)
                            {
                                return 'Median';
                            }
                            if (x == 1)
                            {
                                return 'Max';
                            }
                            return toOrdinal(100 * x) + ' percentile'
                        });
                }
                optionName = optionCopy.join(', ');
			}
			else
			{
                optionName = `${option.strat} random track`;
                if (option.strat > 1)
                {
                    optionName += 's';
                }
			}
			let buttonProp: ButtonProps = {
				displayName: optionName,
				callback: () => 
                {
                    this._currentSamplingStategy = option;
                    document.dispatchEvent(new CustomEvent('samplingStrategyChange', {detail: option}));
                }
			}
			buttonPropList.push(buttonProp);
        }
        this.samplingStrategySelect.onDataChange(buttonPropList);

        this._svgContainer = containerSelect.append('svg');
            
        this._labelLinePad = 16;

        this._scentedWidgetGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top})`);
            
        this._exemplarPinGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top})`);  
            
        this._addPinRectGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top})`);

        this._manualExemplarPinGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top})`);  
            
        this._cellLabelGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top})`);

        const offsetToExemplarCurves = this.cellTimelineMargin.left;
        this._exemplarCurvesGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(${offsetToExemplarCurves}, ${this.cellTimelineMargin.top})`);

        this._shameRectangle = this.svgContainer.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 10000)
            .attr('height', this.cellTimelineMargin.top)
            .attr('fill', 'white')
            .attr('stroke-width', 0);

        this._frameLabelGroup = this.svgContainer.append('g')
            .attr('transform', d => `translate(${this.cellTimelineMargin.left}, 0)`);

        this._innerContainer = containerSelect.append('div')
            .classed('cellTimelineInnerContainer', true)
            .classed('overflow-scroll', true);

        this.innerContainer.node().addEventListener('scroll', (e: WheelEvent) => {
            this.onCellTimelineScroll(e);
        });

        this._selectedImageCanvas = this.innerContainer.append('canvas');
        const canvasElement: HTMLCanvasElement = this.selectedImageCanvas.node() as HTMLCanvasElement;
        canvasElement.addEventListener('mousemove', (e: MouseEvent) => this.onCanvasMouseMove(e) );
        canvasElement.addEventListener('click', (e: MouseEvent) => this.onCanvasClick(e));
        this.selectedImageCanvas.on('mouseleave', () => this.onCanvasMouseLeave() );

        this._canvasContext = canvasElement.getContext('2d');

        document.addEventListener('frameHoverChange', (e: CustomEvent) => 
        {
            const frameId = e.detail.frameId;
            const cellId = e.detail.cellId;
            const rowIndex = e.detail.rowIndex;
            if (frameId !== null && cellId !== null)
            {
                let frameIndex: number;
                if (this.parentWidget.inCondensedMode)
                {
                    let curve: CurveND = this.parentWidget.fullData.curveLookup.get(cellId);
                    let pointIndex = curve.pointList.findIndex(point => point.get('Frame ID') === frameId);
                    const L = curve.pointList.length - 1;
                    let percent = pointIndex / L;
                    frameIndex = percent * (this.parentWidget.condensedModeCount - 1);
                    let frameIndexRounded = Math.round(frameIndex);
                    let realPercent = frameIndexRounded / (this.parentWidget.condensedModeCount - 1)
                    const epsilon = 1 / L;
                    if (Math.abs(percent - realPercent) < epsilon)
                    {
                        frameIndex = frameIndexRounded;
                    }
                    else
                    {
                        frameIndex = -1;
                    }
                }
                else
                {
                    frameIndex = frameId - 1;
                }
                this.updateLabelsOnMouseMove(cellId, frameIndex, rowIndex);
            }
            else
            {
                this.updateLabelsOnMouseMove('', -1, -1);
            }
        });

        document.addEventListener('averageCurveKeyChange', (e: CustomEvent) => 
		{
			this._exemplarYKey = e.detail.yKey;
            this.drawExemplarGrowthCurves();
		});

        document.addEventListener('smoothCurveChange', (e: CustomEvent) => 
		{
			this._smoothCurves = e.detail;
            this.drawExemplarGrowthCurves();
		});

        document.addEventListener('manualPinToggle', (e: CustomEvent) => 
        {
            this.drawExemplarGrowthCurves();
        })

        const self = this;
        document.addEventListener('mousemove', function(e)
        {
            self.onDrag(e.movementX, e.movementY);
        });
        document.addEventListener('mouseup', function(e)
        {
            self.onDragEnd();
        });

        document.addEventListener('locFrameClicked', (e: CustomEvent) =>
        {
            const frameId = e.detail.frameId;
            this.updateCurrentFrameIndicator(frameId);
        });
    }

    public async draw(tracks: conditionExemplar<CurveND>[], manuallyPinnedTracks: CurveND[]): Promise<void>
    {
        this.canvasContext.clearRect(0, 0, this.canvasContext.canvas.width, this.canvasContext.canvas.height);
        if (!this.parentWidget.imageStackDataRequest)
        {
            return;
        }
        if (tracks === this.trackList)
        {
            return;
        }
        DevlibTSUtil.launchSpinner();
        this._trackList = tracks;
        this._manuallyPinnedTracks = manuallyPinnedTracks;
        this.updateTitle();
        await this.drawTrackList();
        this.drawLabels();
        this.drawAllPins(tracks);
        this.drawExemplarGrowthCurves();
    }

    private updateTitle(): void
    {
        if (this.parentWidget.inExemplarMode)
        {
            this.titleContainer.text('Exemplars of ' + this.parentWidget.exemplarAttribute + ' - ');
        }
        else
        {
            this.titleContainer.text('Frame Extraction Mode');
        }
    }
    
    public OnBrushChange(): void
    {
        this.drawOutlines();
    }

    private async drawTrackList(): Promise<void>
    {
        const justData = this.trackList.map(d => d.data);
        const combinedTracks = [...this.manuallyPinnedTracks, ...justData];
        this._sourceDestCell = [];
        let listOfBoundingBoxLists = await this.getBoundingBoxLists(combinedTracks);
        this._trackHeightList = [];
        let maxWidth: number = d3.max(listOfBoundingBoxLists, 
            (rectList: Rect[]) =>
            {
                return d3.max(rectList, r => ImageTrackWidget.rectWidth(r));
            });
        
        for (let rectList of listOfBoundingBoxLists)
        {
            let thisHeight = d3.max(rectList, r => ImageTrackWidget.rectHeight(r));
            this.trackHeightList.push(thisHeight); 
        }

        let minFrameId = d3.min(combinedTracks, 
            (track: CurveND) =>
            {
                return d3.min(track.pointList, point => point.get('Frame ID'));
            });

        let maxFrameId = d3.max(combinedTracks, 
            (track: CurveND) =>
            {
                return d3.max(track.pointList, point => point.get('Frame ID'));
            });

        let numFrames: number;
        if (this.parentWidget.inCondensedMode)
        {
            numFrames = this.parentWidget.condensedModeCount;
        }
        else
        {
            numFrames = maxFrameId - minFrameId + 1;
        }
        const maxGroupContentHeight = this.getMaxGroupHeight(this.trackHeightList);
        const numExemplars = this.parentWidget.numExemplars;

        const canvasWidth = numFrames * maxWidth + this.horizontalPad * (numFrames + 1);
        let totalHeight = this.verticalPad * (combinedTracks.length + 1);
        totalHeight += 200;
        const betweenGroupPad = 16;
        const heightOfManuallyPinned = d3.sum(this.trackHeightList.slice(0, this.manuallyPinnedTracks.length));
        if (this.parentWidget.inExemplarMode)
        {
            const numGroups = (this.trackList.length / numExemplars);
            totalHeight += maxGroupContentHeight * numGroups;
            totalHeight += betweenGroupPad * numGroups;
            totalHeight += heightOfManuallyPinned;
        }
        else
        {
            totalHeight += d3.sum(this.trackHeightList);

        }
        this.selectedImageCanvas
            .attr('width', canvasWidth)
            .attr('height', totalHeight);

        let verticalOffset: number = this.verticalPad;
        this._cellLabelPositions = [];

        let drawTrackPromises = [];
        this._trackVerticalOffsetList = [];
        const pinOffset = this.manuallyPinnedTracks.length;
        for (let i = 0; i < combinedTracks.length; i++)
        {
            const isStarred = i < pinOffset;
            const sampledIdx = i - pinOffset;
            let track = combinedTracks[i];
            let boundingBoxList = listOfBoundingBoxLists[i];
            let trackHeight = this.trackHeightList[i];
            if (this.parentWidget.inExemplarMode && i === this.manuallyPinnedTracks.length && this.manuallyPinnedTracks.length > 0)
            {
                verticalOffset = Math.max(verticalOffset, this.minHeightForFavorites);
            }
            this.trackVerticalOffsetList.push(verticalOffset);
            const categoryIndex = Math.floor(sampledIdx / numExemplars);
            let done = this.drawTrack(track, boundingBoxList, maxWidth, trackHeight, minFrameId, verticalOffset, categoryIndex, isStarred);
            drawTrackPromises.push(done);
            this.cellLabelPositions.push([track.id, verticalOffset + trackHeight / 2]);
            verticalOffset += trackHeight + this.verticalPad;
            if (this.parentWidget.inExemplarMode && !isStarred)
            {
                let groupStartIdx = (sampledIdx - (sampledIdx % numExemplars)) + pinOffset; // I have regrets combining these lists.
                let diffBetweenMax = maxGroupContentHeight - d3.sum(this.trackHeightList.slice(groupStartIdx, groupStartIdx + numExemplars));
                if (i % numExemplars < numExemplars)
                {
                    let extraPadding = diffBetweenMax / (numExemplars - 1);
                    verticalOffset += extraPadding;
                }
                else
                {
                    verticalOffset += betweenGroupPad;
                }
            }
        }
        
        if (this.parentWidget.inExemplarMode)
        {
            this._conditionLabelPositions = [];
            const conditionNames = this.getConditionNames();
            for (let i = 0; i < this.trackList.length; i += numExemplars)
            {
                const idx = i + pinOffset;
                const groupIndex = i / numExemplars;
                let name = conditionNames[groupIndex];
                const top = this.trackVerticalOffsetList[idx];
                const indexBot = idx + numExemplars - 1;
                const bot = this.trackVerticalOffsetList[indexBot] + this.trackHeightList[indexBot];
                this.conditionLabelPositions.push([name, [top, bot]]);
            }
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
        // I don't know why gulp isn't recognizing allSettled. The version should
        // be correct. But I'm tired of seeing the error.
        await (Promise as any).allSettled(drawTrackPromises);
        this._defaultCanvasState = this.canvasContext.getImageData(0, 0, canvasWidth, totalHeight);
        await this.drawOutlines(false);
        DevlibTSUtil.stopSpinner();
    }

    public invertImageData(): void
    {
        let w = this.defaultCanvasState.width;
        let h = this.defaultCanvasState.height;
        let data = this.defaultCanvasState.data;

        for (let [sourceRect, destOffset, _cell] of this.sourceDestCell)
        {
            let width = ImageTrackWidget.rectWidth(sourceRect);
            let height = ImageTrackWidget.rectHeight(sourceRect);
            for (let sx = 0; sx < width; sx++)
            {
                let x = sx + destOffset[0];
                for (let sy = 0; sy < height; sy++)
                {
                    let y = sy + destOffset[1];
                    let i = 4 * (y * w + x);

			        data[i] = 255 - data[i];
			        data[i+1] = 255 - data[i+1];
			        data[i+2] = 255 - data[i+2];
                }
            }
        }
    }

    private getMaxGroupHeight(maxHeightList: number[]): number
    {
        if (!this.parentWidget.inExemplarMode)
        {
            // only useful for exemplar mode
            return 0;
        }
        let maxGroupHeight = 0;
        for (let i = this.manuallyPinnedTracks.length; i < maxHeightList.length; i += this.parentWidget.numExemplars)
        {
            let groupContentHeight = d3.sum(maxHeightList.slice(i, i + this.parentWidget.numExemplars));
            maxGroupHeight = Math.max(maxGroupHeight, groupContentHeight);
        }
        return maxGroupHeight;
    }

    private getConditionNames(): string[]
    {
        return this.parentWidget.facetList.map(facet => facet.name.join('___'));
    }

    private async getBoundingBoxLists(trackList: CurveND[]): Promise<Rect[][]>
    {
        const listOfLengths: number[] = [];
        const boundingBoxPromises: Promise<Rect>[] = [];
        for (let track of trackList)
        {
            if (this.parentWidget.inCondensedMode)
            {
                const end = Math.min(track.length, this.parentWidget.condensedModeCount);
                for (let i = 0; i < end; i++)
                {
                    let point: PointND = this.getPointInCondensedMode(track, i);
                    const boundingBoxPromise = this.getCellBoundingBox(point);
                    boundingBoxPromises.push(boundingBoxPromise);
                }
                listOfLengths.push(end)
            }
            else
            {
                for (let point of track.pointList)
                {
                    const boundingBoxPromise = this.getCellBoundingBox(point);
                    boundingBoxPromises.push(boundingBoxPromise);
                }
                listOfLengths.push(track.pointList.length);
            }
        }
        const boundingBoxList = await Promise.all(boundingBoxPromises);
        let listOfLists: Rect[][] = [];
        let start = 0;
        for (let length of listOfLengths)
        {
            listOfLists.push(boundingBoxList.slice(start, start + length));
            start += length;
        }
        return listOfLists;
    }

    public getPointInCondensedMode(track: CurveND, index: number): PointND
    {
        if (track.pointList.length === 1)
        {
            return track.pointList[0];
        }
        const maxCount = Math.min(this.parentWidget.condensedModeCount, track.pointList.length);
        let percent = index / (maxCount - 1);
        let trackIndex = Math.min(Math.floor(percent * track.pointList.length), track.pointList.length-1);
        return track.pointList[trackIndex];
    }

    private async drawTrack(
        trackData: CurveND,
        boundingBoxList: Rect[],
        maxWidth: number, maxHeight: number,
        minFrame: number,
        verticalOffset: number,
        categoryIndex: number,
        isStarred: boolean): Promise<void>
    {
        // draw track background
        this.drawTrackBackgroundAndTimeRange(trackData, maxWidth, maxHeight, minFrame, verticalOffset, categoryIndex, isStarred);

        let asyncFunctionList = [];
        let blobRequests: Promise<[number, number, Blob, string]>[] = [];
        let offsetArray: [number, number][] = [];
        for (let i = 0; i < boundingBoxList.length; i++)
        {
            // this is a bit painful. The biggest addition to the complexity
            // is accounting for edge cases in the tile of the tiled image.
            // if it gets to an edge only only copies what it can, then centers in
            // a rect of the same size as others in the cell.
            let point: PointND;
            if (this.parentWidget.inCondensedMode)
            {
                point = this.getPointInCondensedMode(trackData, i);
            }
            else
            {
                point = trackData.pointList[i];
            }
            const frameId = point.get('Frame ID');

            const frameIndex = frameId - 1;

            let blobRequest = this.parentWidget.imageStackDataRequest.getImagePromise(trackData.get('Location ID'), frameIndex);

            blobRequests.push(blobRequest);
        }

        let results = await Promise.all(blobRequests);
        let sourceDestCell = [];
                let workerData: [Blob, number, number, number, number][] = [];
                let webWorker = new Worker('/static/script/dist/ImageWorker.js');
                for (let j = 0; j < results.length; j++)
                {
                    let [tileTop, tileLeft, blob, _url] = results[j];
                    let bbox = boundingBoxList[j];
                    const [sX, sY] = bbox[0];
                    let width = ImageTrackWidget.rectWidth(bbox);
                    let height = ImageTrackWidget.rectHeight(bbox);
                    const extraX = Math.round((maxWidth - width) / 2);
                    const extraY = Math.round((maxHeight - height) / 2);

                    let point: PointND;
                    if (this.parentWidget.inCondensedMode)
                    {
                        point = this.getPointInCondensedMode(trackData, j);
                    }
                    else
                    {
                        point = trackData.pointList[j];
                    }
                    const frameId = point.get('Frame ID');
        
                    let offsetIndex: number;
                    if (this.parentWidget.inCondensedMode)
                    {
                        if (results.length === this.parentWidget.condensedModeCount)
                        {
                            offsetIndex = j;
                        }
                        else
                        {
                            let fraction: number;
                            if (results.length === 1)
                            {
                                fraction = 0.5;
                            }
                            else
                            {
                                fraction = j / (results.length - 1);
                            }
                            offsetIndex = fraction * (this.parentWidget.condensedModeCount - 1);
                            // index here is a float - gotcha!
                        }
                    }
                    else
                    {
                        offsetIndex = frameId - minFrame;
                    }

                    const tileBot = tileTop + this.parentWidget.imageStackDataRequest?.tileHeight;
                    const tileRight = tileLeft + this.parentWidget.imageStackDataRequest?.tileWidth;
        
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
                    workerData.push([blob, copyLeft, copyTop, copyWidth, copyHeight]);

                }
                webWorker.postMessage(workerData);

            return new Promise((resolve, reject) =>
            {
                webWorker.onmessage = (event) =>
                {
                    let bitMapList: {status: string, value:ImageBitmap}[] = event.data;
                    for (let i = 0; i < bitMapList.length; i++)
                    {
                        const imgBitmap = bitMapList[i];
                        let point: PointND;
                        if (this.parentWidget.inCondensedMode)
                        {
                            point = this.getPointInCondensedMode(trackData, i);
                        }
                        else
                        {
                            point = trackData.pointList[i];
                        }
                        const frameId = point.get('Frame ID');
                        const currentFrame: boolean = frameId === this.parentWidget.getCurrentFrameId();
                        let offsetIndex: number = frameId - minFrame;
                        if (this.parentWidget.inCondensedMode)
                        {
                            // offsetIndex = i;
                            if (bitMapList.length === this.parentWidget.condensedModeCount)
                            {
                                offsetIndex = i;
                            }
                            else
                            {
                                let fraction: number;
                                if (bitMapList.length === 1)
                                {
                                    fraction = 0.5;
                                }
                                else
                                {
                                    fraction = i / (bitMapList.length - 1);
                                }
                                offsetIndex = fraction * (this.parentWidget.condensedModeCount - 1);
                                // index here is a float - gotcha!
                            }
                        }
                        else
                        {
                            offsetIndex = frameId - minFrame;
                        }
                        const frameX = this.horizontalPad + offsetIndex * (maxWidth + this.horizontalPad);
                        const frameY = verticalOffset;
                        const [offsetX, offsetY] = offsetArray[i];

                        this.canvasContext.beginPath();
                        this.canvasContext.rect(frameX, frameY, maxWidth, maxHeight);
                        if (currentFrame && !this.parentWidget.inExemplarMode)
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
                        if (imgBitmap.status === 'fulfilled')
                        {
                            if ((this.parentWidget.invertImageToggle.node() as HTMLInputElement).checked)
                            {
                                this.canvasContext.filter = 'invert(1)';
                            }
                            this.canvasContext.drawImage(imgBitmap.value, offsetX, offsetY);
                            this.canvasContext.filter = '';
                        }
                    }
                    resolve();
                    webWorker.terminate();
                }
            });
    }

    private drawTrackBackgroundAndTimeRange(
        trackData: CurveND,
        maxWidth: number, maxHeight: number,
        minFrame: number,
        verticalOffset: number,
        categoryIndex: number,
        isStarred: boolean): void
    {
        // draw track background
        let offsetIndex: number;
        if (this.parentWidget.inCondensedMode)
        {
            offsetIndex = 0;
        }
        else
        {
            offsetIndex = trackData.pointList[0].get('Frame ID') - minFrame;
        }
        const minDestX = this.horizontalPad + offsetIndex * (maxWidth + this.horizontalPad);
        if (this.parentWidget.inCondensedMode)
        {
            offsetIndex = this.parentWidget.condensedModeCount;
        }
        else
        {
            const lastIndex = trackData.pointList.length - 1;
            offsetIndex = trackData.pointList[lastIndex].get('Frame ID') - minFrame + 1;
        }
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
        let backgroundColor: string;
        if (isStarred)
        {
            backgroundColor = 'rgb(180,180,180)';
        }
        else
        {
            backgroundColor = 'rgb(240,240,240)';
        }
        this.canvasContext.strokeStyle = backgroundColor;
        this.canvasContext.fillStyle = backgroundColor;
        this.canvasContext.stroke();
        this.canvasContext.fill();
        this.canvasContext.closePath();

        const timeRangeHeight = 6;
        const timeRangeVerticalOffset = verticalOffset - marginY - timeRangeHeight;
        this.drawTimeRange(trackData, [minDestX, maxDestX], timeRangeHeight, timeRangeVerticalOffset, categoryIndex);
    }

    private drawTimeRange(
        trackData: CurveND,
        extentX: [number, number],
        height: number,
        verticalOffset: number,
        categoryIndex: number): void
    {
        if (!this.parentWidget.inCondensedMode)
        {
            return;
        }
        let maxTimeRange = this.parentWidget.fullData.getMinMax('Frame ID');
        let scaleX = d3.scaleLinear()
            .domain(maxTimeRange)
            .range(extentX)

        let timeRange: [number, number] = d3.extent(trackData.pointList, point => point.get('Frame ID'));
        let timeRangePx = timeRange.map(t => scaleX(t));

        // Total possible time
        const smallHeight = 0.5 * height;
        const heightDiff = height - smallHeight;
        this.canvasContext.beginPath();
        this.canvasContext.rect(
            extentX[0],
            verticalOffset + (heightDiff / 2),
            extentX[1] - extentX[0] + 1,
            smallHeight);
        this.canvasContext.fillStyle = 'grey';
        this.canvasContext.fill();
        this.canvasContext.closePath();
        
        // This time
        this.canvasContext.beginPath();
        this.canvasContext.rect(
            timeRangePx[0],
            verticalOffset,
            timeRangePx[1] - timeRangePx[0] + 1,
            height);

        const locationId = trackData.get('Location ID');
        const labelList = this.parentWidget.fullData.inverseLocationMap.get(locationId);
        const color = GroupByWidget.getColor(labelList, this.parentWidget.colorLookup);
        this.canvasContext.strokeStyle = color;
        this.canvasContext.fillStyle = color;
        this.canvasContext.stroke();
        this.canvasContext.fill();
        this.canvasContext.closePath();
    }


    private static rectWidth(rect: Rect): number
    {
        return rect[1][0] - rect[0][0] + 1;
    }
    
    private static rectHeight(rect: Rect): number
    {
        return rect[1][1] - rect[0][1] + 1;
    }

    private async getCellBoundingBox(point: PointND): Promise<Rect>
    {
        const locId = point.parent.get('Location ID');
        const frameId = point.get('Frame ID');
        const frameIndex = frameId - 1; // MatLab..        
        const segmentId = point.get('segmentLabel');
        const numPixelsInTile = this.parentWidget.numPixelsInTile;
        // const firstIndex = frameIndex * numPixelsInTile;
        let extent: Rect = [[Infinity, Infinity], [-Infinity, -Infinity]]
        let [rowArray, firstIndex] = await this.parentWidget.imageStackDataRequest.getLabelPromise(locId, frameIndex);
        for (let rowIdx = firstIndex; rowIdx < firstIndex + this.parentWidget.imageStackDataRequest.tileHeight; rowIdx++)
        {
			let row: Row = rowArray.rowList[rowIdx];
			for (let labelRun of row.row)
			{
                let [top, left] = this.parentWidget.imageStackDataRequest.getTileTopLeft(frameIndex);
                let bigImgXMin = left + labelRun.start;
                let bigImgXMax = left + labelRun.start + labelRun.length;
                let bigImgY = top + (rowIdx % this.parentWidget.imageStackDataRequest.tileHeight);

                if (labelRun.label === segmentId)
                {
                    let [[minX, minY], [maxX, maxY]] = extent;
                    minX = Math.min(minX, bigImgXMin);
                    minY = Math.min(minY, bigImgY);
                    maxX = Math.max(maxX, bigImgXMax);
                    maxY = Math.max(maxY, bigImgY);
                    extent = [[minX, minY], [maxX, maxY]];
                }
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
                this.drawLabels(true);
                this._scrollChangeTicking = false;
            });
            this._scrollChangeTicking = true;
        }
    }

    private onCanvasClick(e: MouseEvent): void
    {
        if (!this.parentWidget.imageStackDataRequest)
        {
            return;
        }
        let xPos = e.offsetX;
        let yPos = e.offsetY;
        const [cellId, cellIdIndex] = ImageTrackWidget.getClosestLabel(this.cellLabelPositions, yPos);
        let curve: CurveND = this.parentWidget.fullData.curveLookup.get(cellId);

        let frameId: number
        const [frameLabel, frameLabelIndex]  = ImageTrackWidget.getClosestLabel(this.frameLabelPositions, xPos);
        let frameIndex = +frameLabel - 1;
        if (this.parentWidget.inCondensedMode)
        {
            if (curve.pointList.length < this.parentWidget.condensedModeCount)
            {
                const percent = xPos / Number(this.selectedImageCanvas.attr('width'));
                frameIndex = Math.floor(percent * curve.pointList.length);
                frameIndex = Math.min(frameIndex, curve.pointList.length - 1);
            }
            let point = this.getPointInCondensedMode(curve, frameIndex);
            frameId = point.get('Frame ID');
        }
        else
        {
            frameId = frameIndex + 1;
        }

        const trackLocation = curve.get('Location ID');
        let event = new CustomEvent('locFrameClicked', { detail:
        {
            locationId: trackLocation,
            frameId: frameId
        }});
		document.dispatchEvent(event);
    }

    private onCanvasMouseMove(e: MouseEvent): void
    {
        if (!this.parentWidget.imageStackDataRequest)
        {
            return;
        }
        let xPos = e.offsetX;
        let yPos = e.offsetY;
        const [cellId, cellIdIndex] = ImageTrackWidget.getClosestLabel(this.cellLabelPositions, yPos);
        let curve: CurveND = this.parentWidget.fullData.curveLookup.get(cellId);

        let frameId: number
        const [frameLabel, frameLabelIndex]  = ImageTrackWidget.getClosestLabel(this.frameLabelPositions, xPos);
        let frameIndex = +frameLabel - 1;

        if (this.parentWidget.inCondensedMode)
        {
            if (curve.pointList.length < this.parentWidget.condensedModeCount)
            {
                const percent = xPos / Number(this.selectedImageCanvas.attr('width'));
                frameIndex = Math.floor(percent * curve.pointList.length);
                frameIndex = Math.min(frameIndex, curve.pointList.length - 1);
            }
            let point = this.getPointInCondensedMode(curve, frameIndex);
            frameId = point.get('Frame ID');
        }
        else
        {
            frameId = frameIndex + 1;
        }

        this.parentWidget.selectedImgIndex;
        const displayedFrameId = this.parentWidget.getCurrentFrameId();
        const trackLocation = curve.get('Location ID');
        const currentLocation = this.parentWidget.getCurrentLocationId();
        
        if (trackLocation == currentLocation)
        {
            let displayedPoint = curve.pointList.find(point => point.get('Frame ID') === displayedFrameId);
            if (displayedPoint)
            {

                this.parentWidget.imageStackDataRequest.getLabel(curve.get('Location ID'), displayedPoint.get('Frame ID') - 1,
                (rowArray: ImageLabels, firstIndex: number) =>
                {
                    this.parentWidget.showSegmentHover(rowArray, displayedPoint.get('segmentLabel'), firstIndex, true);
                });
            }
            else
            {
                this.parentWidget.hideSegmentHover(true);
            }
        }
        else
        {
            this.parentWidget.hideSegmentHover(true);
        }

        this.updateLabelsOnMouseMove(cellId, frameIndex, cellIdIndex);
        let event = new CustomEvent('frameHoverChange', { detail:
        {
            locationId: trackLocation,
            frameId: frameId,
            cellId: cellId,
            rowIndex: cellIdIndex,
        }});
		document.dispatchEvent(event);
    }

    private onCanvasMouseLeave(): void
    {
        this.parentWidget.hideSegmentHover(true);
        this.updateLabelsOnMouseMove('', -1, -1);
        const locId = this.parentWidget.getCurrentLocationId();
        let event = new CustomEvent('frameHoverChange', { detail:
            {
                locationId: locId,
                frameId: null,
                cellId: null
            }});
            document.dispatchEvent(event);
    }

    private static getClosestLabel(labelPositions: [string, number][], pos: number): [string, number]
    {
        let compareFunction = DevlibAlgo.compareProperty<[string, number]>(pos, labelPos =>  labelPos[1]);
        let indices = DevlibAlgo.BinarySearchIndex(labelPositions, compareFunction);
        if (typeof indices === 'undefined')
        {
            console.log(pos);
            return ['-1', -1]; // todo
        }
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
        return [labelPositions[labelIndex][0], labelIndex];
    }

    private async drawOutlines(drawDefaultCanvas = true): Promise<void>
    {
        if (!this.defaultCanvasState)
        {
            return;
        }
        if (drawDefaultCanvas)
        {
            this.canvasContext.putImageData(this.defaultCanvasState, 0, 0);
        }
        if (!(this.parentWidget.showOutlineToggle.node() as HTMLInputElement).checked)
        {
            // don't do it!
            return;
        }
        for (let [sourceRect, [dX, dY], point] of this.sourceDestCell)
        {
            let width = ImageTrackWidget.rectWidth(sourceRect);
            let height = ImageTrackWidget.rectHeight(sourceRect);
            let [[sLeft, sTop], [sRight, sBot]] = sourceRect;
            let outlineTileData = this.canvasContext.getImageData(dX, dY, width, height);
            let labelToMatch = point.get('segmentLabel');
            let frameIndex = point.get('Frame ID') - 1;
            let rIdx = 0;
            let [labelArray, firstIndex] = await this.parentWidget.imageStackDataRequest.getLabelPromise(point.parent.get('Location ID'), frameIndex);
            for (let y = sTop; y <= sBot; y++)
            {
                for (let x = sLeft; x <= sRight; x++)
                {
                    let [rowIdx, colIdx] = this.parentWidget.getLabelIndexFromBigImgPixelXY(frameIndex, x, y);
                    
                    let label = ImageStackDataRequest.getLabelValue(rowIdx, colIdx, labelArray);

                    if (label == labelToMatch)
                    {
                        if (this.parentWidget.isBorder(label, rowIdx, colIdx, labelArray))
                        {
                            // should use data, not full data to get the right color.
                            const [cell, _index] = this.parentWidget.data.GetCellFromLabel(point.parent.get('Location ID'), point.get('Frame ID'), labelToMatch);
                            let {color: color, show: show} = this.parentWidget.getCellColor(cell);
                            if (show)
                            {
                                let [r, g, b] = color;
                                outlineTileData.data[rIdx] = r;
                                outlineTileData.data[rIdx + 1] = g;
                                outlineTileData.data[rIdx + 2] = b;
                                outlineTileData.data[rIdx + 3] = 255;
                            }
                        }
                    }
                    rIdx += 4;
                }
            }
            this.canvasContext.putImageData(outlineTileData, dX, dY);
        }
    }

    private drawLabels(onScroll = false): void
    {
        // cell labels
        if (!this.parentWidget.inExemplarMode)
        {
            DevlibTSUtil.hide(this.scentedWidgetGroup.node());
            DevlibTSUtil.hide(this.exemplarPinGroup.node());
            DevlibTSUtil.hide(this.manualExemplarPinGroup.node());
            DevlibTSUtil.hide(this.addPinRectGroup.node());
        }
        else
        {
            DevlibTSUtil.show(this.scentedWidgetGroup.node());
            DevlibTSUtil.show(this.exemplarPinGroup.node());
            DevlibTSUtil.show(this.manualExemplarPinGroup.node());
            DevlibTSUtil.show(this.addPinRectGroup.node());
            let xAnchor = this.drawConditionLabels();
            if (onScroll)
            {
                this.shiftScentedWidgets();
            }
            else
            {
                this.drawScentedWidgets(xAnchor);
                this.drawAddPinRects(xAnchor);
            }
        }
        this.drawCellLabels(); // todo make this function conditional to always show pinned with star and only show others depending on if it's in exemplar mode.


        // frame labels
        let pad = 6;
        const yAnchor = this.cellTimelineMargin.top - pad;
        let labelsInView = this.frameLabelPositions.filter((labelPos: [string, number]) =>
        {
            const pos: number = labelPos[1] - this.latestScroll[0];
            return 0 <= pos && pos <= this.innerContainerW;
        });
        if (this.parentWidget.inCondensedMode)
        {
            labelsInView = labelsInView.map((labelPos: [string, number]) => 
            {
                let index = +labelPos[0] - 1;
                let percent = index / (this.parentWidget.condensedModeCount - 1);
                return [percent.toFixed(2), labelPos[1]];
            })
        }
        const currentFrame  = this.parentWidget.getCurrentFrameId();
        this.frameLabelGroup.selectAll('text')
            .data(labelsInView)
            .join('text')
            .text(d => d[0])
            .attr('x', d => d[1] - this.latestScroll[0])
            .attr('y', yAnchor)
            .classed('currentFrame', d => +d[0] === currentFrame && !this.parentWidget.inExemplarMode)
            .classed('cellAxisLabel', true)
            .classed('right', true);
    }

    private drawCellLabels(): void
    {
        const pad = 10;
        const starButtonSize = 32;
        const starExtraOffset = 2;
        const xAnchor = this.cellTimelineMargin.left - pad;
        let labelsWithIndex: [number, [string, number]][] = this.cellLabelPositions.map((x, i) => [i, x]);
        let labelsInView = labelsWithIndex.filter((labelPos: [number, [string, number]], index: number) =>
        {
            if (index >= this.manuallyPinnedTracks.length && this.parentWidget.inExemplarMode)
            {
                return false;
            }
            const pos: number = labelPos[1][1] - this.latestScroll[1];
            return 0 <= pos && pos <= this.innerContainerH;
        });
        this.cellLabelGroup.selectAll('text.trackLabel')
            .data(labelsInView)
            .join('text')
            .classed('trackLabel', true)
            .text(d => d[1][0])
            .attr('x', d => 
            {
                if (d[0] < this.manuallyPinnedTracks.length)
                {
                    return xAnchor - starButtonSize;
                }
                return xAnchor
            })
            .attr('y', d => d[1][1] - this.latestScroll[1])
            .attr('transform', '')
            .attr('fill', d => 
            {
                if (d[0] < this.manuallyPinnedTracks.length)
                {
                    const track = this.manuallyPinnedTracks[d[0]];
                    const locId = track.get('Location ID');
                    const labelList = this.parentWidget.fullData.inverseLocationMap.get(locId);

                    return GroupByWidget.getColor(labelList, this.parentWidget.colorLookup);
                }
                return 'black';
            })
            .classed('cellAxisLabel', true)
            .classed('left', true)
            .classed('rotated', false);
        
        let manuallyPinnedInView = labelsWithIndex.filter((labelPos: [number, [string, number]], index: number) =>
        {
            if (index < this.manuallyPinnedTracks.length)
            {
                const pos: number = labelPos[1][1] - this.latestScroll[1];
                return 0 <= pos && pos <= this.innerContainerH;
            }
            return false;
        });

        this.cellLabelGroup.selectAll('foreignObject')
            .data(manuallyPinnedInView)
        .join('foreignObject')
            .attr('transform', d => 
            {
                const xOffset = xAnchor - starButtonSize;
                const yOffset = d[1][1] - this.latestScroll[1] - (starButtonSize / 2) - starExtraOffset;
                return `translate(${xOffset}, ${yOffset})`
            })
			.attr('width', starButtonSize)
			.attr('height', starButtonSize)
            .selectAll('div')
            .data(d => [d])
        .join('xhtml:div')
            .selectAll('button')
            .data(d => [d])
        .join('button')
            .attr('style', d =>
            {
                if (d[0] < this.manuallyPinnedTracks.length)
                {
                    const track = this.manuallyPinnedTracks[d[0]];
                    const locId = track.get('Location ID');
                    const labelList = this.parentWidget.fullData.inverseLocationMap.get(locId);

                    return `color: ${GroupByWidget.getColor(labelList, this.parentWidget.colorLookup)};`;
                }
            })
            .attr('title', 'Click to remove this favorite.')
            .html('<i class="fas fa-star"></i>')
            .classed('basicIconButton', true)
            .on('click', d => 
            {
        		const track = this.parentWidget.fullData.curveLookup.get(d[1][0]);
                this.parentWidget.togglePin(track);
            });

        if (!this.parentWidget.inExemplarMode)
        {
            this.cellLabelGroup.selectAll('line').remove();
            this.cellLabelGroup.selectAll('text.conditionLabel').remove();
        }
    }

    private drawConditionLabels(): number
    {
        const xAnchor = this.cellTimelineMargin.left - this.labelLinePad;
        const xAnchorLine = xAnchor - 4;
        this.cellLabelGroup.selectAll('text.conditionLabel')
            .data(this.conditionLabelPositions)
            .join('text')
            .classed('conditionLabel', true)
            .text(d => d[0].replace('___', ' '))
            .attr('x', xAnchor)
            .attr('y', d => (d[1][0] + d[1][1]) / 2 - this.latestScroll[1])
            .attr('transform', d => `rotate(-90, ${xAnchor}, ${(d[1][0] + d[1][1]) / 2 - this.latestScroll[1]})`)
            .attr('fill', (d,i) => GroupByWidget.getColor(d[0].split('___'), this.parentWidget.colorLookup))
            .classed('cellAxisLabel', true)
            .classed('rotated', true);

        this.cellLabelGroup.selectAll('line')
            .data(this.conditionLabelPositions)
            .join('line')
            .attr('x1', xAnchorLine)
            .attr('x2', xAnchorLine)
            .attr('y1', d => Math.max(0, d[1][0] - this.latestScroll[1]))
            .attr('y2', d => Math.max(0, d[1][1] - this.latestScroll[1]))
            .attr('stroke', (d,i) => GroupByWidget.getColor(d[0].split('___'), this.parentWidget.colorLookup))
            .attr('stroke-width', '2px');

        return xAnchorLine;
    }

    private shiftScentedWidgets(): void
    {
        this.scentedWidgetGroup
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top - this.latestScroll[1]})`);    

        this.exemplarPinGroup
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top - this.latestScroll[1]})`);    
        
        this.manualExemplarPinGroup
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top - this.latestScroll[1]})`);    
            
        this.addPinRectGroup
            .attr('transform', d => `translate(0, ${this.cellTimelineMargin.top - this.latestScroll[1]})`); 

        this.updateExemplarCurvesOffset();
    }

    private drawAddPinRects(axisAnchor: number): void
    {
        const self = this;
        this.addPinRectGroup.selectAll('rect')
            .data(this.conditionLabelPositions)
            .join('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('transform', d => `translate(0, ${d[1][0]})`)
            .attr('width', this.cellTimelineMargin.left - this.labelLinePad)
            .attr('height', d => d[1][1] - d[1][0])
            .attr('stroke-width', '0px')
            .attr('fill', 'tomato')
            .attr('opacity', 0.0)
            .attr('style', 'cursor: crosshair;')
            .on('click', function(d) 
            {
                const [_xPos, yPos] = d3.mouse(this as any);
                const value = self.normalizedHistogramScaleY.invert(yPos);
                self.manualSampleValues.push(value);
                document.dispatchEvent(new CustomEvent('samplingStrategyChange', {detail: self.currentSamplingStategy}));
            })
    }

    private drawScentedWidgets(axisAnchor: number): void
    {
        let binArray: d3.Bin<NDim, number>[][] = [];
        const numBins = 48;
        this._histogramScaleYList = [];
        for (let i = 0; i < this.parentWidget.facetList.length; i++)
        {

            let data: CurveList = this.parentWidget.facetList[i].data;

            let bins = HistogramWidget.calculateBins(
                data.curveCollection.Array.filter(d => !isNaN(d.get(this.parentWidget.exemplarAttribute))),
                this.parentWidget.exemplarAttribute,
                data.curveCollection,
                numBins,
                true);
            binArray.push(bins);
        }

        let minBinBoundary = d3.min(binArray, bins => bins[0].x0);
        let maxBinBoundary = d3.max(binArray, bins => bins[bins.length - 1].x1);
        for (let i = 0; i < binArray.length; i++)
        {
            let positionExtent = this.conditionLabelPositions[i][1];
            let scaleY = d3.scaleLinear()
                .domain([minBinBoundary, maxBinBoundary])
                .range(positionExtent);

            this.histogramScaleYList.push(scaleY);
        }
        const firstExtent = this.conditionLabelPositions[0][1];
        this._normalizedHistogramScaleY = d3.scaleLinear()
            .domain([minBinBoundary, maxBinBoundary])
            .range([0, firstExtent[1] - firstExtent[0]]);

        const padding = 4;
		let biggestBinPercentage = d3.max(binArray, bin => d3.max(bin, d => d.length) / d3.sum(bin, d => d.length));
        const maxWidth = 52;
        this._histogramScaleX = d3.scaleLinear()
            .domain([0, biggestBinPercentage])
            .range([axisAnchor - padding, axisAnchor - maxWidth]);

        this.scentedWidgetGroup.selectAll('path')
            .data(this.conditionLabelPositions)
            .join('path')
            .attr('d', (d, i) =>
            {
                let bins = binArray[i];
                return this.getHistogramSkylinePath(bins, this.histogramScaleX, this.histogramScaleYList[i]);
            })
            .classed('kdePath', true);
    }

    private getHistogramSkylinePath(bins: d3.Bin<NDim, number>[], scaleX: d3.ScaleLinear<number, number>, scaleY: d3.ScaleLinear<number, number>): string
    {
        let pathPoints: [number, number][] = [];
		const totalCount = d3.sum(bins, bin => bin.length);
		for (let bin of bins)
		{
			let y1: number = scaleY(bin.x0);
            let x = scaleX(bin.length / totalCount);
			pathPoints.push([x, y1]);
			if (bin.length === 0)
			{
				let splitPoint: [number, number] = [null, null];
				pathPoints.push(splitPoint);
			}
			let y2: number = scaleY(bin.x1);
			pathPoints.push([x, y2]);
		}
        let minYval = bins[0].x0;
        let maxYval = bins[bins.length - 1].x1;
		
		pathPoints.unshift([scaleX.range()[0], scaleY(minYval)]);
		pathPoints.push([scaleX.range()[0], scaleY(maxYval)]);

		let lineFunc = d3.line()
			.x(d => d[0])
			.y(d => d[1])
			.defined(d => d[0] !== null);

		return lineFunc(pathPoints);
    }

    private clearPins(): void
    {
        this.exemplarPinGroup.html(null);
        this.manualExemplarPinGroup.html(null);
    }

    private drawAllPins(curveList: conditionExemplar<CurveND>[]): void
    {
        this.clearPins();
        for (let i = 0; i < curveList.length; i++)
        {
            const categoryIndex = Math.floor(i / this.parentWidget.numExemplars);
            this.drawPin(curveList[i], i + this.manuallyPinnedTracks.length, categoryIndex);
        }
    }

    private drawPin(trackData: conditionExemplar<CurveND>, rowIndex: number, categoryIndex: number): void
    {
        let exemplarValue = trackData.data.get(this.parentWidget.exemplarAttribute);
        let yPos = this.histogramScaleYList[categoryIndex](exemplarValue);
        let [xPosPin, xPosHead] = this.histogramScaleX.range();
        const manual: boolean = trackData.type === 'manual';
        let groupSelection: SvgSelection;
        if (manual)
        {
            groupSelection = this.manualExemplarPinGroup; 
            const needleElement = this.manualExemplarPinGroup.append('line')
                .attr('x1', xPosHead)
                .attr('x2', xPosPin)
                .attr('y1', yPos)
                .attr('y2', yPos)
                .classed('pinLine', true)
                .classed(trackData.data.id, true);

            const myPushPinDesign = "M17.2,0.3c-2,0.4-2.7,1-3,1.5c-0.7,1.1,0,2.6-0.8,3c-0.1,0-0.1,0-0.2,0c-1,0-1.4,0-4,0c-2.9,0-4,0-5,0c-0.7,0-0.8-1-1-1.5C2.9,2.6,3,2.3,2.7,2C1.8,1.4,0.3,1.8,0.3,1.8s0-0.8,0,6.5c0,7.2,0,6.5,0,6.5s1.5,0.4,2.4-0.2C3,14.3,2.9,14,3.3,13.3c0.2-0.6,0.3-1.5,1-1.5c1,0,2.1,0,5,0c2.6,0,3,0,4,0s0.1,1.8,1,3c0.7,0.9,2.1,1.3,3,1.5c0-2.7,0-5.3,0-8S17.2,3,17.2,0.3z";
            const iconWidth = 17;
            const iconHeight = 16;
            const self = this;
            const transX = xPosHead - iconWidth;
            const transY = yPos - iconHeight / 2;
            this.manualExemplarPinGroup.append('path')
                .classed('pinHead', true)
                .attr('transform', `translate(${transX}, ${transY})`)
                .attr('d', myPushPinDesign)
                .on('mousedown', function(d)
                {
                    self.onDragStart(this, transX, transY, needleElement, textSelect, exemplarValue, trackData.anchorVal, categoryIndex);
                })
                .classed(trackData.data.id, true);
            
            const textPad = 4;
            const textSelect = this.exemplarPinGroup.append('text') // put in semantically incorrect group to avoid mouseover problems and because I'm tired.
                .attr('x', textPad)
                .attr('y', yPos)
                .attr('alignment-baseline', 'middle')
                .classed('pinLabel', true)
                .classed('tinyText', true)
                .classed('noSelect', true)
                .text(this.formatPinLabel(exemplarValue))
                .classed(trackData.data.id, true);
        }
        else
        {
            groupSelection = this.exemplarPinGroup;
            this.exemplarPinGroup.append('line')
                .attr('x1', xPosHead)
                .attr('x2', xPosPin)
                .attr('y1', yPos)
                .attr('y2', yPos)
                .classed('pinLine', true)
                .classed(trackData.data.id, true);

            const radius = 3
            this.exemplarPinGroup.append('circle')
                .attr('cx', xPosHead - radius)
                .attr('cy', yPos)
                .attr('r', radius)
                .classed('pinHead', true)
                .classed(trackData.data.id, true);
        }

        const trackCenter = this.trackVerticalOffsetList[rowIndex] + (this.trackHeightList[rowIndex] / 2.0);

        groupSelection.append('line')
            .attr('x1', xPosPin)
            .attr('x2', xPosPin + 30)
            .attr('y1', yPos)
            .attr('y2', trackCenter)
            .classed('pinConnectLine', true)
            .classed(trackData.data.id, true);

    }

    private formatPinLabel(value: number): string
    {
        let absVal = Math.abs(value);
        if (absVal > 99.5) 
        {
            return Math.round(value).toString();
        }
        if (absVal > 9.5)
        {
            return value.toFixed(1);
        }
        return value.toFixed(2);
    }

    private onDragStart(
        pinElement: SVGPathElement,
        transX: number, transY: number,
        needleSelect: d3.Selection<SVGLineElement, any, Element, any>,
        textSelect: d3.Selection<SVGTextElement, any, Element, any>,
        initialValue: number, anchorValue: number,
        groupIndex: number): void
    {
        const coords = d3.mouse(pinElement);
        this._draggingPin = true;
        this._draggingPinElement = pinElement;
        this._initialDragCoords = [transX, transY];
        this._needleSelection = needleSelect;
        this._textSelection = textSelect;
        this._totalDragOffset = [0, 0];
        this._initialPinValue = initialValue;
        this._anchorPinValue = anchorValue;
        this._dragGroupIndex = groupIndex;
        this._pinMoved = false;

        const unpinOffset = 12;
        d3.select(pinElement)
            .attr('transform', `translate(${transX - unpinOffset}, ${transY})`)
            .classed('grabbed', true);

        needleSelect.attr('transform', `translate(${-unpinOffset}, 0)`);
        textSelect.text('X');

        this.addPinRectGroup.selectAll('rect').classed('grabbed', true);
        this.needleSelection.classed('grabbed', true);
        // document.body.style.cursor = 'grabbing';
    }

    private onDragEnd(): void
    {
        if (!this.draggingPin)
        {
            return;
        }
        this._draggingPin = false;

        d3.select(this.draggingPinElement).classed('grabbed', false);
        this.addPinRectGroup.selectAll('rect').classed('grabbed', false);
        this.needleSelection.classed('grabbed', false);
        
        const index = this.manualSampleValues.indexOf(this.anchorPinValue);

        if (index !== -1)
        {
            if (!this.pinMoved)
            {
                this.manualSampleValues.splice(index, 1);
            }
            else
            {
                this.manualSampleValues[index] = this.getCurrentDraggedValue();
            }
            document.dispatchEvent(new CustomEvent('samplingStrategyChange', {detail: this.currentSamplingStategy}));
        }
    }
    
    private onDrag(moveX: number, moveY: number): void
    {
        if (!this.draggingPin)
        {
            return;
        }

        this.totalDragOffset[1] += moveY;
        const removePixelRoom = 2;            
        this._pinMoved = Math.abs(this.totalDragOffset[1]) > removePixelRoom;
        const valueOffsetPixels = this.normalizedHistogramScaleY(this.anchorPinValue);
        const extent: [number, number] = this.normalizedHistogramScaleY.range().map(y => y - valueOffsetPixels) as [number, number];
        let yOffset = DevlibMath.clamp(this.totalDragOffset[1], extent);
        
        const unpinOffset = this.pinMoved ? 4 : 12;
        d3.select(this.draggingPinElement)
            .attr('transform', `translate(${this.initialDragCoords[0] + this.totalDragOffset[0] - unpinOffset}, ${this.initialDragCoords[1] + yOffset})`);
        
        this.needleSelection
            .attr('transform', `translate(${-unpinOffset}, ${yOffset})`);
        
        this.textSelection
            .attr('transform', `translate(0, ${yOffset})`)
            .text(this.pinMoved ? this.formatPinLabel(this.getCurrentDraggedValue()) : 'X');
    }

    private getCurrentDraggedValue(): number
    {
        const pixelDifference = this.totalDragOffset[1];
        const valueDifference = this.normalizedHistogramScaleY.invert(pixelDifference) - this.normalizedHistogramScaleY.invert(0);
        let currentValue = this.initialPinValue + valueDifference;
        currentValue = DevlibMath.clamp(currentValue, this.normalizedHistogramScaleY.domain() as [number, number]);
        return currentValue;
    }


    private drawExemplarGrowthCurves(): void
    {
        // todo make this work for exemplar mode when there is not enough space
        if (!this.parentWidget.inExemplarMode || !this.parentWidget.inCondensedMode)
        {
            DevlibTSUtil.hide(this.exemplarCurvesGroup.node());
            return;
        }
        DevlibTSUtil.show(this.exemplarCurvesGroup.node());

        this.updateExemplarCurvesOffset();

        let groupListSelection = this.exemplarCurvesGroup.selectAll('.exemplar.plotGrouper')
            .data(this.conditionLabelPositions)
            .join('g')
            .classed('exemplar', true)
            .classed('plotGrouper', true)
            .attr('transform', d => `translate(0, ${d[1][0]})`);

        const rightPadding = 4;

        let width = this.innerContainer.node().getBoundingClientRect().width
                        - Number(this.selectedImageCanvas.attr('width'))
                        - this.trackToPlotPadding
                        - rightPadding;

        width = Math.max(width, this.exemplarMinWidth); // min-width: 80
        width = Math.min(width, 240); // max-width: 240

        const frameExtent = this.parentWidget.fullData.getMinMax('Frame ID');
        this._exemplarScaleX = d3.scaleLinear()
            .domain(frameExtent)
            .range([0, width]);
        
        const yKey = this.exemplarYKey;
        const allData = [...this.manuallyPinnedTracks, ...this.trackList.map(exemplar => exemplar.data)];
        let yMin = d3.min(allData, curve => d3.min(curve.pointList, point => point.get(yKey)));
        let yMax = d3.max(allData, curve => d3.max(curve.pointList, point => point.get(yKey)));

        for (let facet of this.parentWidget.facetList)
        {
            let averageGrowthCurve: [number, number][] = facet.data.getAverageCurve(yKey, false, this.smoothCurves);
            let [thisMin, thisMax] = d3.extent(averageGrowthCurve, d => d[1]);
            yMin = Math.min(yMin, thisMin);
            yMax = Math.max(yMax, thisMax);
        }

        const firstPosition = this.conditionLabelPositions[0][1];
        let height = firstPosition[1] - firstPosition[0] + 1;
        height = Math.min(height, 120); // max-height 120

        this._exemplarScaleY = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height, 0]);

        let {
            favoriteCurves: favoriteCurves,
            exemplarCurves: exemplarGrowthCurves,
            averageCurves: averageGrowthLines
         } = this.generateExemplarGrowthCurves();

        const currentFrame = this.parentWidget.getCurrentFrameId();
        groupListSelection.selectAll('.currentFrameLine')
            .data((d,i) => [i])
            .join('line')
            .attr('x1', this.exemplarScaleX(currentFrame))
            .attr('x2', this.exemplarScaleX(currentFrame))
            .attr('y1', this.exemplarScaleY.range()[0])
            .attr('y2', this.exemplarScaleY.range()[1])
            .attr('stroke', 'black')
            .classed('currentFrameLine', true);

        groupListSelection.selectAll('.averageCurve')
            .data((d,i) => [[averageGrowthLines[i], d[0]] ])
            .join('path')
            .attr('d', d => d[0])
            .attr('stroke', d => GroupByWidget.getColor(d[1].split('___'), this.parentWidget.colorLookup))
            .classed('averageCurve', true);

        groupListSelection.selectAll('.exemplarCurve')
            .data((d,i) => exemplarGrowthCurves[i].map(x =>
            {
                return {
                    pathString: x,
                    label: d[0],
                    groupIndex: i
                }
            }))
            .join('path')
            .attr('d', d => d.pathString)
            .attr('stroke', d => GroupByWidget.getColor(d.label.split('___'), this.parentWidget.colorLookup))
            .attr('data-cellId', (d, i) => this.trackList[i + this.parentWidget.numExemplars * d.groupIndex].data.id)
            .classed('exemplarCurve', true);

        let scaleList: [d3.Axis<number | { valueOf(): number; }>, number][] =
        [
            [d3.axisBottom(this.exemplarScaleX).ticks(5), height],
            [d3.axisLeft(this.exemplarScaleY), 0]
        ];

        groupListSelection.selectAll('.exemplarPlotAxis')
            .data((d, i) => scaleList.map(x => [x, i]))
            .join('g')
            .classed('exemplarPlotAxis', true)
            .attr('transform', (d) => `translate(0, ${d[0][1]})`)
            .each(function(d) {
                let axisFunc: d3.Axis<number | {valueOf(): number;}>;
                axisFunc = d[0][0];
                axisFunc(d3.select(this) as any);
            });

        this.drawFavoriteGrowthCurves(favoriteCurves, scaleList);
    }

    private drawFavoriteGrowthCurves(favoriteCurves: string[], scaleList: [d3.Axis<number | { valueOf(): number; }>, number][]): void
    {
        if (this.manuallyPinnedTracks.length === 0)
        {
            this.exemplarCurvesGroup.selectAll('.favorite.plotGrouper').classed('noDisp', true);
            return;
        }
        const groupSelection = this.exemplarCurvesGroup.selectAll('.favorite.plotGrouper')
            .data([42])
            .join('g')
            .classed('favorite', true)
            .classed('plotGrouper', true)
            .classed('noDisp', false)
            .attr('transform', d => `translate(0, ${this.verticalPad})`);

        const currentFrame = this.parentWidget.getCurrentFrameId();
        groupSelection.selectAll('.currentFrameLine')
            .data((d,i) => [i])
            .join('line')
            .attr('x1', this.exemplarScaleX(currentFrame))
            .attr('x2', this.exemplarScaleX(currentFrame))
            .attr('y1', this.exemplarScaleY.range()[0])
            .attr('y2', this.exemplarScaleY.range()[1])
            .attr('stroke', 'black')
            .classed('currentFrameLine', true);
        
        groupSelection.selectAll('.exemplarCurve')
            .data(d => favoriteCurves)
            .join('path')
            .attr('d', d => d)
            .attr('stroke', (d, i) => 
            {
                const track = this.manuallyPinnedTracks[i];
                const locId = track.get('Location ID');
                const labelList = this.parentWidget.fullData.inverseLocationMap.get(locId);
                const color = GroupByWidget.getColor(labelList, this.parentWidget.colorLookup);
                return color;
            })
            .attr('data-cellId', (d, i) => this.manuallyPinnedTracks[i].id)
            .classed('exemplarCurve', true);

        groupSelection.selectAll('.exemplarPlotAxis')
            .data((d, i) => scaleList.map(x => [x, i]))
            .join('g')
            .classed('exemplarPlotAxis', true)
            .attr('transform', (d) => `translate(0, ${d[0][1]})`)
            .each(function(d) {
                let axisFunc: d3.Axis<number | {valueOf(): number;}>;
                axisFunc = d[0][0];
                axisFunc(d3.select(this) as any);
            });
    }

    public updateCurrentFrameIndicator(frameId: number): void
    {
        if (!this.exemplarScaleX)
        {
            return
        }
        let groupListSelection = this.exemplarCurvesGroup.selectAll('.plotGrouper')

        groupListSelection.selectAll('.currentFrameLine')
            .data([42])
            .join('line')
            .attr('x1', this.exemplarScaleX(frameId))
            .attr('x2', this.exemplarScaleX(frameId))
            .attr('y1', this.exemplarScaleY.range()[0])
            .attr('y2', this.exemplarScaleY.range()[1])
            .attr('stroke', 'black')
            .classed('currentFrameLine', true);

    }

    private updateExemplarCurvesOffset(): void
    {
        const contentOffset = Number(this.selectedImageCanvas.attr('width'));
        const offsetToExemplarCurves = this.cellTimelineMargin.left + contentOffset + this.trackToPlotPadding;
        this.exemplarCurvesGroup.attr('transform', d => `translate(${offsetToExemplarCurves}, ${this.cellTimelineMargin.top - this.latestScroll[1]})`);
    }

    private generateExemplarGrowthCurves(): {favoriteCurves: string[], exemplarCurves: string[][], averageCurves: string[]}
    {
        const xKey = 'Frame ID';
        const yKey = this.exemplarYKey;
        let line = d3.line<[number, number]>()
            .x(d => this.exemplarScaleX(d[0]))
            .y(d => this.exemplarScaleY(d[1]));

        // todo - maybe normalize this to a [number, number][] so filtering is easier.
        
        let favoriteCurves: string[] = [];
        for (let track of this.manuallyPinnedTracks)
        {
            let pointList = this.extract2DArray(track.pointList, xKey, yKey);
            if (this.smoothCurves)
            {
                pointList = CurveList.medianFilter(pointList);
            }
            let pathString = line(pointList);
            favoriteCurves.push(pathString);
        }

        let exemplarCurves: string[][] = [];
        for (let i = 0; i < this.trackList.length; i += this.parentWidget.numExemplars)
        {
            let pathList: string[] = [];
            for (let path of this.trackList.slice(i, i + this.parentWidget.numExemplars))
            {
                let pointList = this.extract2DArray(path.data.pointList, xKey, yKey);
                if (this.smoothCurves)
                {
                    pointList = CurveList.medianFilter(pointList);
                }
                let pathString = line(pointList);
                pathList.push(pathString);
            }
            exemplarCurves.push(pathList);
        }

        // average growth calculation

		let [minFrame, maxFrame] = this.parentWidget.fullData.getMinMax('Frame ID');
        let lineAvg = d3.line<[number, number]>()
            .x(d => this.exemplarScaleX(d[0]))
            .y(d => this.exemplarScaleY(d[1]));

        let averageGrowthLines: string[] = [];
        for (let facet of this.parentWidget.facetList)
        {
            let averageGrowthCurve = facet.data.getAverageCurve(yKey, false, this.smoothCurves);
            let averageGrowthCurveString = lineAvg(averageGrowthCurve);
            averageGrowthLines.push(averageGrowthCurveString);
        }

        return {
            favoriteCurves: favoriteCurves,
            exemplarCurves: exemplarCurves,
            averageCurves: averageGrowthLines
        }
    }

    private extract2DArray(pointList: PointND[], xKey: string, yKey: string): [number, number][]
    {
        return pointList.map(point => [point.get(xKey), point.get(yKey)]);
    }

    private updateLabelsOnMouseMove(cellId: string, frameIndex: number, rowIndex: number): void
    {

        let svgSelection = this.cellLabelGroup.selectAll('text') as SvgSelection;
        if (!this.parentWidget.inExemplarMode)
        {
            let foundMatch = this.hoverNodeWithText(svgSelection.nodes(), cellId);
            svgSelection = this.frameLabelGroup.selectAll('text') as SvgSelection;
            if (!foundMatch)
            {
                this.hoverNodeWithText(svgSelection.nodes(), '');
                return
            }
        }
        else
        {
            this.exemplarCurvesGroup.selectAll('.exemplarCurve').classed('selected', false)
            this.exemplarPinGroup.selectAll('*').classed('selected', false);
            this.manualExemplarPinGroup.selectAll('*').classed('selected', false);
            if (typeof(rowIndex) !== 'undefined')
            {
                if (rowIndex < this.manuallyPinnedTracks.length)
                {
                    let foundMatch = this.hoverNodeWithText(svgSelection.nodes(), cellId);
                    svgSelection = this.frameLabelGroup.selectAll('text') as SvgSelection;
                    if (!foundMatch)
                    {
                        this.hoverNodeWithText(svgSelection.nodes(), '');
                        // return
                    }
                }
                if (cellId)
                {
                    const data = [...this.manuallyPinnedTracks, ...this.trackList.map(exemplar => exemplar.data)];
                    this.exemplarCurvesGroup.selectAll('.exemplarCurve')
                        .data(data)
                        .classed('selected', function(d, i)
                        {
                            i == rowIndex
                            const thisCellId = d3.select(this).attr('data-cellId');
                            return thisCellId === cellId;
                        });
        
                    this.exemplarPinGroup.selectAll('*')
                        .classed('selected', function(d, i) 
                        {
                            return d3.select(this).classed(cellId);
                        });
        
                    this.manualExemplarPinGroup.selectAll('*')
                        .classed('selected', function(d, i) 
                        {
                            return d3.select(this).classed(cellId);
                        });
                }
    
    
                let searchText: string;
                if (rowIndex < 0)
                {
                    searchText = ''
                }
                else
                {
                    let categoryIndex = Math.floor(rowIndex / this.parentWidget.numExemplars);
                    searchText = this.conditionLabelPositions[categoryIndex][0];
                }
    
                this.hoverNodeWithText(svgSelection.nodes(), searchText);
            }            
        }

        svgSelection = this.frameLabelGroup.selectAll('text') as SvgSelection;
        let frameText: string;
        if (this.parentWidget.inCondensedMode)
        {
            let percent = frameIndex / (this.parentWidget.condensedModeCount - 1);
            frameText = percent.toFixed(2);
        }
        else
        {
            frameText = (frameIndex + 1).toString();
        }
        this.hoverNodeWithText(svgSelection.nodes(), frameText);
    }

    private hoverNodeWithText(svgElementList: SVGElement[], text: string): boolean
    {
        let fountMatch = false;
        for (let node  of svgElementList)
        {
            let nodeEl = (node as SVGElement);
            if (nodeEl.textContent === text)
            {
                nodeEl.classList.add('hovered');
                fountMatch = true;
            }
            else
            {
                nodeEl.classList.remove('hovered');
            }
        }
        return fountMatch;
    }

    public OnResize(width: number, height: number): void
    {
        height -= 30; // hacky, but see .cellTimelineInnerContainer.top for explanation
        this.svgContainer
            .attr('height', height)
            .attr('width', width);

        this.shameRectangle.attr('width', width);

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