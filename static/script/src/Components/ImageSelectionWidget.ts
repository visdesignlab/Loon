import * as d3 from 'd3';
import {HtmlSelection, SvgSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import {ImageStackWidget} from './ImageStackWidget';
import {ImageMetaData} from '../DataModel/ImageMetaData';
import { CurveList } from '../DataModel/CurveList';
import { DatasetSpec } from '../types';
import { ImageFrame } from '../DataModel/ImageFrame';
import { DevlibMath } from '../devlib/DevlibMath';
import { RichTooltip } from './RichTooltip';

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
    
    // private _tooltipContainer : HTMLDivElement;
    // public get tooltipContainer() : HTMLDivElement {
    //     return this._tooltipContainer;
    // }

	public init(): void
	{
        this._frameTooltip = new RichTooltip(0, 0);
        // this._tooltipContainer = document.createElement('div');
        this._innerContainer = d3.select(this.container).append('div');
        this.innerContainer.classed('imageSelectionContainer', true);

        this._imageTrackContainer = d3.select(this.container).append('div');
        this.imageTrackContainer
            .classed('imageTrackContainer', true);
            // .classed('overflow-scroll', true);

        this._locationSelectionContainer = this.innerContainer.append('div')
            .classed('locationSelectionContainer', true);

        // this._imageCountContainer = this._locationSelectionContainer.append('div')
        //     .classed('imageCountContainer', true);

        this._locationListContainer = this._locationSelectionContainer.append('div')
            .classed('locationListContainer', true);

        this._imageStackContainer = this.innerContainer.append('div')
            .classed('imageStackContainer', true)
            .classed('overflow-scroll', true);
        this._imageStackWidget = new ImageStackWidget(this.imageStackContainer.node(), this.imageTrackContainer.node(), this.vizHeight);

        this.OnResize()
	}

	public OnDataChange()
	{
        this._imageMetaData = ImageMetaData.fromPointCollection(this.data);
        this._selectedLocationId = this.imageMetaData.locationList[0].locationId;
        this.setImageStackWidget()
        this.OnBrushChange()
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
            if (imageMetaDataString)
            {
                let imageMetaData = JSON.parse(imageMetaDataString);
                imgWidth = imageMetaData['tileWidth'];
                imgHeight = imageMetaData['tileHeight'];
                numCol = imageMetaData['numberOfColumns'];
            }
            this.imageStackWidget.SetImageProperties(xhr.response, imgWidth, imgHeight, numCol);
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
        let facetOptions = this.data.GetFacetOptions();

        let hardCodedOption = facetOptions[0];
        let facetList = hardCodedOption.GetFacets();
        this.locationListContainer.html(null);
        for (let facet of facetList)
        {
            this.drawFacet(facet.name, facet.data);
        }
    }

    private drawFacet(name: string, data: CurveList): void
    {
        this.locationListContainer.append('div')
            .text(name)
            .classed('locationListCatTitle', true);

        const subListContainer = this.locationListContainer.append('ul')
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
                this.changeLocationSelection(d);
                this.setImageStackWidget();
            });

        const wraperSelection = listElement.append('div')
            .classed('frameListContainer', true);

        // getting the first one, they should all be the same
        const bbox = wraperSelection.node().getBoundingClientRect();
        const miniWidth = bbox.width;
        const miniHeight = 20; // hardcoded based on CSS

        const svgSelection = wraperSelection.append('svg')
            .attr('width', miniWidth)
            .attr('height', miniHeight)
            .attr('id', d => 'frameTicksViz-' + d)
            .attr('data-locId', d => d)
            .on('mouseleave', () => this.hideFrameTooltip())

        const marginW = 4;
        const marginH = 2;
        const frameExtent: [number, number] = this.data.getMinMax('Frame ID');
        const scaleX = d3.scaleLinear()
            .domain(frameExtent)
            .range([marginW, miniWidth -  marginW]);

        const scaleLineWidth = d3.scaleLinear()
            .domain([0, 1])
            .range([0.5, 1.5]);

        const scaleLineHeight = d3.scaleLinear()
            .domain([0, 1])
            .range([1, miniHeight - 2 * marginH]);

        svgSelection.selectAll('line')
            .data(d => this.getFrameList(d))
            .join('line')
            .attr('x1', d => scaleX(d.frameId))
            .attr('x2', d => scaleX(d.frameId))
            .attr('y1', d => (miniHeight - scaleLineHeight(d.inBrushPercent)) / 2)
            .attr('y2', d => miniHeight - (miniHeight - scaleLineHeight(d.inBrushPercent)) / 2) // lerp
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
                const mouseX = event.offsetX;
                let frameId = scaleX.invert(mouseX);
                frameId = DevlibMath.clamp(Math.round(frameId), frameExtent);
                this.onHoverLocationFrame(locId, frameId);
            });
        }
    }

    private onHoverLocationFrame(locationId: number, frameId: number): void
    {
        const svgContainer = d3.select('#frameTicksViz-' + locationId);
        const bbox = (svgContainer.node() as SVGElement).getBoundingClientRect();

        const xPos = bbox.right;
        const yPos = bbox.top + bbox.height / 2;
        const htmlString = this.createTooltipContent(locationId, frameId);
        this.frameTooltip.Show(htmlString, xPos, yPos);
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

        this._selectedLocationId = newId;

        let newSelected = d3.select("#imageLocation-" + this.selectedLocationId);
        newSelected.classed('selected', true);
    }
}