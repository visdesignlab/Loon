import * as d3 from 'd3';
import {HtmlSelection, SvgSelection, ButtonProps} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import {ImageStackWidget} from './ImageStackWidget';
import {ImageMetaData} from '../DataModel/ImageMetaData';
import { CurveList } from '../DataModel/CurveList';
import { DatasetSpec, Facet } from '../types';
import { ImageFrame } from '../DataModel/ImageFrame';
import { DevlibMath } from '../devlib/DevlibMath';
import { RichTooltip } from './RichTooltip';
import { OptionSelect } from './OptionSelect';
import { ImageLocation } from '../DataModel/ImageLocation';
import { GroupByWidget } from './GroupByWidget';
import { zip } from 'd3';

export class ImageSelectionWidget extends BaseWidget<CurveList, DatasetSpec> {
    
    protected Clone(container: HTMLElement): BaseWidget<CurveList, DatasetSpec>
    {
        return new ImageSelectionWidget(container);
    }

    private _imageMetaData : ImageMetaData;
    public get imageMetaData() : ImageMetaData {
        return this._imageMetaData;
    }

    private _innerContainer : HtmlSelection;
    public get innerContainer() : HtmlSelection {
        return this._innerContainer;
    }
    
    private _imageTrackContainer : HtmlSelection;
    public get imageTrackContainer() : HtmlSelection {
        return this._imageTrackContainer;
    }    

    private _locationSelectionContainer : HtmlSelection;
    public get locationSelectionContainer() : HtmlSelection {
        return this._locationSelectionContainer;
    }

    private _groupByWidget : GroupByWidget;
    public get groupByWidget() : GroupByWidget {
        return this._groupByWidget;
    }

    private _locationListContainer : HtmlSelection;
    public get locationListContainer() : HtmlSelection {
        return this._locationListContainer;
    }

    private _imageStackContainer : HtmlSelection;
    public get imageStackContainer() : HtmlSelection {
        return this._imageStackContainer;
    }
    
    private _imageStackWidget : ImageStackWidget;
    public get imageStackWidget() : ImageStackWidget {
        return this._imageStackWidget;
    }
    
    private _selectedLocationId : number | null;
    public get selectedLocationId() : number | null {
        return this._selectedLocationId;
    }

    private _frameTooltip : RichTooltip;
    public get frameTooltip() : RichTooltip {
        return this._frameTooltip;
    }

    private _frameHeight : number;
    public get frameHeight() : number {
        return this._frameHeight;
    }    

    private _frameHeightSelected : number;
    public get frameHeightSelected() : number {
        return this._frameHeightSelected;
    }    

    private _frameMarginTopBot : number;
    public get frameMarginTopBot() : number {
        return this._frameMarginTopBot;
    }
    
    private _frameScaleX : d3.ScaleLinear<number, number>;
    public get frameScaleX() : d3.ScaleLinear<number, number> {
        return this._frameScaleX;
    }

    private _frameScaleHeight : d3.ScaleLinear<number, number>;
    public get frameScaleHeight() : d3.ScaleLinear<number, number> {
        return this._frameScaleHeight;
    }
    
    private _hoveredLocFrame : [number, number] | null;
    public get hoveredLocFrame() : [number, number] | null {
        return this._hoveredLocFrame;
    }
    
    private _selectedLocFrame : [number, number];
    public get selectedLocFrame() : [number, number] {
        return this._selectedLocFrame;
    }

    private _hoveredLocId : number | null;
    public get hoveredLocId() : number | null {
        return this._hoveredLocId;
    }

	public init(): void
	{
        this._frameHeight = 24; // hardcoded based on CSS
        this._frameHeightSelected = 40; // also based on CSS
        this._frameMarginTopBot = 8;
        this._frameTooltip = new RichTooltip(0, 0);
        this._selectedLocFrame = [1, 1];
        this._hoveredLocFrame = null;
        this._hoveredLocId = null;
        this._innerContainer = d3.select(this.container).append('div');
        this.innerContainer.classed('imageSelectionContainer', true);

        this._imageTrackContainer = d3.select(this.container).append('div');
        this.imageTrackContainer
            .classed('imageTrackContainer', true);

        this._locationSelectionContainer = this.innerContainer.append('div')
            .classed('locationSelectionContainer', true);

        document.onkeydown = (event) => {this.handleKeyDown(event)};

        this._groupByWidget = new GroupByWidget(this.locationSelectionContainer);

        this._locationListContainer = this.locationSelectionContainer.append('div')
            .classed('locationListContainer', true);

        this._imageStackContainer = this.innerContainer.append('div')
            .classed('imageStackContainer', true)
            .classed('overflow-scroll', true);
        this._imageStackWidget = new ImageStackWidget(this.imageStackContainer.node(), this.imageTrackContainer.node(), this.vizHeight);

        document.addEventListener('frameHoverChange', (e: CustomEvent) => 
        {
            const locId = e.detail.locationId;
            const frameId = e.detail.frameId;
            const cellId = e.detail.cellId;
            this.onHoverLocationFrame(locId, frameId, cellId, false);
        });

        document.addEventListener('locFrameClicked', (e: CustomEvent) =>
        {
            const locId = e.detail.locationId;
            const frameId = e.detail.frameId;
            this.onClickLocationFrame(locId, frameId);
        });

        document.addEventListener('groupByChanged', (e: CustomEvent) =>
        {
            this.draw();
        });

        this.OnResize();
	}

	public OnDataChange()
	{
        this._imageMetaData = ImageMetaData.fromPointCollection(this.data);
        this._selectedLocationId = this.imageMetaData.locationList[0].locationId;
        this.setImageStackWidget();
        this.OnBrushChange();
        this.groupByWidget.updateGroupByOptions(this.data, true);

    }
    
    public setImageStackWidget(): void
    {
        const newUrl = `/data/${this.data.Specification.googleDriveId}/img_${this.selectedLocationId}.png`
        const labelUrl = `/data/${this.data.Specification.googleDriveId}/img_${this.selectedLocationId}_labels.dat`
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () => {
            let imageMetaDataString: string = xhr.getResponseHeader("tiledImageMetaData");
            let imgWidth: number;
            let imgHeight: number;
            let numCol: number;
            let scaleFactor: number;
            if (imageMetaDataString)
            {
                let imageMetaData = JSON.parse(imageMetaDataString);
                imgWidth = imageMetaData['tileWidth'];
                imgHeight = imageMetaData['tileHeight'];
                numCol = imageMetaData['numberOfColumns'];
                scaleFactor = imageMetaData['scaleFactor'];
            }
            this.imageStackWidget.SetImageProperties(xhr.response, imgWidth, imgHeight, numCol, scaleFactor);
        }
        xhr.open('GET', newUrl);
        xhr.send();
        this.imageStackWidget.SetLabelUrl(labelUrl);

        let currentLocation = this.imageMetaData.locationLookup.get(this.selectedLocationId);
        this.imageStackWidget.SetData(this.data, currentLocation);
    }

	protected OnResize(): void
	{
        const topHeightMax = 0.5 * this.height;
        const botHeightMax = this.height - topHeightMax;
        this.imageStackWidget.OnResize(topHeightMax, botHeightMax, this.width);
        this.locationSelectionContainer
            .classed('overflow-scroll', true)
            .attr('style', `max-height: ${topHeightMax}px`)
        this.imageTrackContainer
            .attr('style',
            `max-width: ${this.width}px;
            max-height: ${botHeightMax}px;
            width: ${this.width}px;
            height: ${botHeightMax}px;`)
	}

    public OnBrushChange(): void
    {
        this.imageMetaData.updateInBrushProp(this.data);
        this.draw();
        this.imageStackWidget.OnBrushChange();
    }
    
    private draw(): void
    {
        this.locationListContainer.html(null);
        this.drawFacetRecurse(this.groupByWidget.currentSelectionIndexList);
        this.drawSelectedDots();
    }

    private drawFacetRecurse(remainingSubFacetIndices: number[], verticalPosition: number = 0, facet?: Facet, containerSelection?: HtmlSelection): void
    {
        let container: HtmlSelection;
        if (containerSelection)
        {
            container = containerSelection;
        }
        else
        {
            container = this.locationListContainer;
        }
        if (remainingSubFacetIndices.length === 0)
        {
            this.drawTerminalFacet(container, facet.name, facet.data, verticalPosition, 0);
            return;
        }

        let data: CurveList;
        if (facet)
        {
            data = facet.data;
        }
        else
        {
            data = this.data;
        }

        const facetIndex = remainingSubFacetIndices[0];
        let facetOptions = data.GetFacetOptions();

        let hardCodedOption = facetOptions[facetIndex];
        let facetList = hardCodedOption.GetFacets();
        let grouperDiv
        if (facet)
        {
            grouperDiv  = this.drawGrouperFacet(container, facet.name, verticalPosition, remainingSubFacetIndices.length);
        }
        let childPosition = verticalPosition;
        for (let childFacet of facetList)
        {
            childPosition++;
            this.drawFacetRecurse(remainingSubFacetIndices.slice(1), childPosition, childFacet, grouperDiv);
        }
    }

    private drawGrouperFacet(containerSelection: HtmlSelection, name: string, verticalPosition: number, zIndex: number): HtmlSelection
    {
        this.drawTitleElement(containerSelection, name, verticalPosition, zIndex);

        const grouperDiv = containerSelection.append('div')
            .classed('locationListGrouper', true);

        return grouperDiv;
    }

    private drawTitleElement(containerSelection: HtmlSelection, name: string, verticalPosition: number, zIndex: number): void
    {
        const topPos = (verticalPosition - 1) * 19;

        let styleString = `top: ${topPos}px;`;
        if (zIndex > 0)
        {
            styleString += ` z-index: ${zIndex};`;
        }
        containerSelection.append('div')
            .text(name)
            .classed('locationListCatTitle', true)
            .attr('style', styleString);
    }

    private drawTerminalFacet(containerSelection: HtmlSelection, name: string, data: CurveList, verticalPosition: number, zIndex: number): void
    {
        this.drawTitleElement(containerSelection, name, verticalPosition, zIndex);

        const subListContainer = containerSelection.append('ul')
            .classed('subListContainer', true);

        const listElement = subListContainer.selectAll('li')
            .data(data.locationList)
            .join('li');

        listElement.html(null)
            .append('button')
            .text(d => d)
            .classed('locationButton', true)
            .classed('toggleButton', true)
            .classed('selected', d => d == this.selectedLocationId)
            .attr('id', d => 'imageLocation-' + d)
            .attr('style', d => 
            {
                const location = this.imageMetaData.locationLookup.get(d);
                const stop = (1 - location.inBrushPercent) * 100
                const barColor = '#EDCAC9'; // lighter firebrick
                return `background: linear-gradient(to left, rgba(255,255,255,0), rgba(255,255,255,0) ${stop}%, ${barColor}, ${stop}%, ${barColor})`
            })
            .on('click', d => 
            {
                this.onClickLocation(d);
            });

        const wraperSelection = listElement.append('div')
            .classed('frameListContainer', true);

        // getting the first one, they should all be the same
        const bbox = wraperSelection.node().getBoundingClientRect();
        const miniWidth = bbox.width;

        const svgSelection = wraperSelection.append('svg')
            .attr('width', miniWidth)
            .attr('height', d => d === this.selectedLocationId ? this.frameHeightSelected : this.frameHeight)
            .attr('id', d => 'frameTicksViz-' + d)
            .attr('data-locId', d => d)
            .on('mouseleave', () => 
            {
                this._hoveredLocId = null;
                this.hideFrameTooltip();
                this.removeHoverDots(svgSelection);
            })

        const marginW = 4;
        const frameExtent: [number, number] = this.data.getMinMax('Frame ID');
        this._frameScaleX = d3.scaleLinear()
            .domain(frameExtent)
            .range([marginW, miniWidth -  marginW]);

        const scaleLineWidth = d3.scaleLinear()
            .domain([0, 1])
            .range([1.0, 3.0]);

        this._frameScaleHeight = d3.scaleLinear()
            .domain([0, 1])
            .range([1, this.frameHeight - 2 * this.frameMarginTopBot]);

        svgSelection.selectAll('line')
            .data(d => this.getFrameList(d))
            .join('line')
            .attr('x1', d => this.frameScaleX(d.frameId))
            .attr('x2', d => this.frameScaleX(d.frameId))
            .attr('y1', d => (this.frameHeight - this.frameScaleHeight(d.inBrushPercent)) / 2)
            .attr('y2', d => this.frameHeight - (this.frameHeight - this.frameScaleHeight(d.inBrushPercent)) / 2)
            .attr('stroke-width', d => scaleLineWidth(d.inBrushPercent))
            .attr('stroke', d => d.inBrush ? 'firebrick' : 'black')
            .classed('tickMark', true);
    
        let svgList = svgSelection.nodes();
        for (let i = 0; i < svgList.length; i++)
        {
            const svgElement = svgList[i];
            const locId = +svgElement.dataset['locId'];
            svgElement.addEventListener('mousemove', (event: MouseEvent) =>
            {
                this._hoveredLocId = locId;
                const mouseX = event.offsetX;
                let frameId = this.frameScaleX.invert(mouseX);
                frameId = DevlibMath.clamp(Math.round(frameId), frameExtent);
                this.onHoverLocationFrame(locId, frameId, null, true);
            });
            svgElement.addEventListener('click', (event: MouseEvent) =>
            {
                const mouseX = event.offsetX;
                let frameId = this.frameScaleX.invert(mouseX);
                frameId = DevlibMath.clamp(Math.round(frameId), frameExtent);
                this.onClickLocationFrame(locId, frameId);
            });
        }
    }

	private handleKeyDown(event: KeyboardEvent): void
	{
        let newIndex: number;
        const [locId, frameId] = this.hoveredLocFrame;
        const location = this.imageMetaData.locationLookup.get(locId);
        let nextFrameId: number;
		switch (event.keyCode)
		{
            case 37: // left
                if (this.hoveredLocId !== locId) { return; }
                const minFrameId = location.frameList[0].frameId;
                nextFrameId = Math.max(frameId - 1, minFrameId);
                this.onHoverLocationFrame(locId, nextFrameId, null, true)
				break;
            case 39: // right
                if (this.hoveredLocId !== locId) { return; }
                const maxFrameId = location.frameList[location.frameList.length - 1].frameId;
                nextFrameId = Math.min(frameId + 1, maxFrameId);
                this.onHoverLocationFrame(locId, nextFrameId, null, true);
                break;
            case 13: // enter
                if (this.hoveredLocId !== locId) { return; }
                this.switchToHovered();
                break;
		}
	}

    private onHoverLocationFrame(locationId: number, frameId: number | null, cellId: string | null, showTooltip: boolean): void
    {
        this._hoveredLocFrame = [locationId, frameId];
        const svgContainer = d3.select('#frameTicksViz-' + locationId) as SvgSelection;
        if (frameId === null)
        {
            this.removeHoverDots(svgContainer);
            this.removeHoverBar(svgContainer);
            this.frameTooltip.Hide();
            return;
        }
        if (showTooltip)
        {
            const bbox = svgContainer.node().getBoundingClientRect();
            const xPos = bbox.right;
            const yPos = bbox.top + bbox.height / 2;
            const htmlString = this.createTooltipContent(locationId, frameId);
            this.frameTooltip.Show(htmlString, xPos, yPos);
        }
        this.drawHoverDots(svgContainer, locationId, frameId);
        this.drawFrameRange(svgContainer, cellId);
    }

    private switchToHovered(): void
    {
        const [locId, frameId] = this.hoveredLocFrame;
        this.onClickLocationFrame(locId, frameId);
    }

    private drawFrameRange(svgContainer: SvgSelection, cellId: string | null): void
    {
        if (cellId === null)
        {
            this.removeHoverBar(svgContainer);
            return;
        }
        const curve = this.data.curveLookup.get(cellId);
        const firstPoint = curve.pointList[0];
        const lowFrameId = firstPoint.get("Frame ID");
        const locId = firstPoint.get('Location ID')
        const location: ImageLocation = this.imageMetaData.locationLookup.get(locId);
        const frameLow: ImageFrame = location.frameLookup.get(lowFrameId);
        
        const lastPoint = curve.pointList[curve.pointList.length - 1]
        const highFrameId = lastPoint.get("Frame ID");
        const frameHigh: ImageFrame = location.frameLookup.get(highFrameId);

        const xLow = this.frameScaleX(lowFrameId);
        const xHigh = this.frameScaleX(highFrameId);

        const h1 = (this.frameScaleHeight(frameLow.inBrushPercent) + this.frameHeight) / 2;
        const h2 = (this.frameScaleHeight(frameHigh.inBrushPercent) + this.frameHeight) / 2;

        const betweenTickMargin = 2;
        const fromBottomMargin = 6;

        const y1 = h1 + betweenTickMargin;
        const y2 = this.frameHeightSelected - fromBottomMargin;
        const y3 = h2 + betweenTickMargin;

        const pointList: [number, number][] = [
            [xLow, y1],
            [xLow, y2],
            [xHigh, y2],
            [xHigh, y3]
        ];

        const lineFunction = d3.line<[number, number]>()
                          .x(d => d[0])
                          .y(d => d[1])
                          .curve(d3.curveBasis);

        const path: string = lineFunction(pointList);
        
        svgContainer.selectAll('.hoverBar')
            .data([path])
            .join('path')
            .attr('d', path)
            .classed('hoverBar', true);
    }

    private removeHoverBar(svgContainer: SvgSelection): void
    {
        svgContainer.selectAll('.hoverBar').remove();
    }

    private drawHoverDots(svgContainer: SvgSelection, locationId: number, frameId: number): void
    {
        const xyPositions: [number, number][] =this.getDotCenters(locationId, frameId);
        const dotR = 2;
        svgContainer.selectAll('.hoverDot')
            .data(xyPositions)
            .join('circle')
            .classed('hoverDot', true)
            .attr('cx', d => d[0])
            .attr('cy', d => d[1])
            .attr('fill', '#ECECEC')
            .attr('stroke', 'black')
            .attr('r', dotR)
            .attr('stroke-width', 0.5);
    }

    private drawSelectedDots(): void
    {
        const [locationId, frameId] = this.selectedLocFrame;
        const xyPositions: [number, number][] =this.getDotCenters(locationId, frameId);
        const dotR = 3;

        const svgContainer = d3.select('#frameTicksViz-' + locationId) as SvgSelection;
        svgContainer.selectAll('.selectedDot')
            .data(xyPositions)
            .join('circle')
            .classed('selectedDot', true)
            .attr('cx', d => d[0])
            .attr('cy', d => d[1])
            .attr('fill', 'black')
            .attr('stroke', 'black')
            .attr('r', dotR)
            .attr('stroke-width', 0.5);
    }

    private getDotCenters(locationId: number, frameId: number): [number, number][]
    {
        const frame = this.imageMetaData.locationLookup.get(locationId).frameLookup.get(frameId);
        const xPos = this.frameScaleX(frameId);
        const tickHeight = this.frameScaleHeight(frame.inBrushPercent);
        const dotR = 2;
        const dotMargin = 3;
        const margin = (this.frameHeight - tickHeight) / 2
        const yPos1 = margin - dotR - dotMargin;
        const yPos2 = margin + tickHeight + dotR + dotMargin;
        return [[xPos, yPos1], [xPos, yPos2]];
    }

    private removeHoverDots(svgContainer: SvgSelection): void
    {
        svgContainer.selectAll('.hoverDot').remove();
    }
    
    private removeCurrentSelectedDots(): void
    {
        const svgContainer = d3.select('#frameTicksViz-' + this.selectedLocFrame[0]) as SvgSelection;
        svgContainer.selectAll('.selectedDot').remove();
    }

    private onClickLocation(locationId: number): void
    {
        if (locationId === this.selectedLocationId)
        {
            return;
        }
        this.changeLocationSelection(locationId);
        this.setImageStackWidget();
    }

    private onClickLocationFrame(locationId: number, frameId: number): void
    {
        let [oldLocId, oldFrameId] = this.selectedLocFrame;
        if (oldLocId === locationId && oldFrameId === frameId)
        {
            return;
        }
        this.onClickLocation(locationId);
        this.imageStackWidget.changeSelectedImage(frameId - 1); // matlab
        this.updateSelectedDots(locationId, frameId);
    }
    
    private updateSelectedDots(locationId: number, frameId: number): void
    {
        this.removeCurrentSelectedDots();
        this._selectedLocFrame = [locationId, frameId];
        this.drawSelectedDots();
    }

    private createTooltipContent(locationId: number, frameId: number): string
    {
        const labelValueList: [string, string][] = [
            ['Location', locationId.toString()],
			['Frame', frameId.toString()],
        ];
        return RichTooltip.createLabelValueListContent(labelValueList);
    }

    private hideFrameTooltip(): void
    {
        this.frameTooltip.Hide();
    }

    private getFrameList(locationId: number): ImageFrame[]
    {
        const imageLocation = this.imageMetaData.locationLookup.get(locationId);
        return imageLocation.frameList;
    }

    private changeLocationSelection(newId: number): void
    {
        let lastSelected = d3.select("#imageLocation-" + this.selectedLocationId);
        lastSelected.classed('selected', false);
        let lastSelectedFrameTickViz = d3.select('#frameTicksViz-' + this.selectedLocationId);
        lastSelectedFrameTickViz.attr('height', this.frameHeight);


        this._selectedLocationId = newId;

        let newSelected = d3.select("#imageLocation-" + this.selectedLocationId);
        newSelected.classed('selected', true);
        let newSelectedFrameTickViz = d3.select('#frameTicksViz-' + this.selectedLocationId);
        newSelectedFrameTickViz.attr('height', this.frameHeightSelected);
    }
}