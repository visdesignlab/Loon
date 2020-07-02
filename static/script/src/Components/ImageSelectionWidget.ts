import * as d3 from 'd3';
import {HtmlSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import {ImageStackWidget} from './ImageStackWidget';
import {ImageMetaData} from '../DataModel/ImageMetaData';
import { CurveList } from '../DataModel/CurveList';
import { DatasetSpec } from '../types';

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
    
    private _imageCountContainer : HtmlSelection;
    public get imageCountContainer() : HtmlSelection {
        return this._imageCountContainer;
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

	public init(): void
	{
        this._innerContainer = d3.select(this.container).append('div');
        this.innerContainer.classed('imageSelectionContainer', true);

        this._imageTrackContainer = d3.select(this.container).append('div');
        this.imageTrackContainer
            .classed('imageTrackContainer', true)
            .classed('overflow-scroll', true);

        this._locationSelectionContainer = this.innerContainer.append('div')
            .classed('locationSelectionContainer', true);

        this._imageCountContainer = this._locationSelectionContainer.append('div')
            .classed('imageCountContainer', true);

        this._locationListContainer = this._locationSelectionContainer.append('div')
            .classed('locationListContainer', true);

        this._imageStackContainer = this.innerContainer.append('div')
            .classed('imageStackContainer', true);
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
        const topHeightMax = 0.6 * this.vizHeight;
        this.imageStackWidget.OnResize(topHeightMax);
        this.locationSelectionContainer
            .attr('style', `max-height: ${topHeightMax}`)
        this.imageTrackContainer
            .attr('style',
            `max-width: ${this.vizWidth}px;
            max-height: ${0.4 * this.vizHeight}px;`)
	}

    public OnBrushChange(): void
    {
        this.imageMetaData.updateInBrushProp(this.data);
        let brushedImageCount: number = this.imageMetaData.getBrushedImageCount();
        this._imageCountContainer.text(`Selected Images = (${brushedImageCount})`);

        let brushedLocationList: number[] = this.imageMetaData.getBrushedLocations();
        this.locationListContainer.selectAll('button')
            .data(brushedLocationList)
            .join('button')
            .text(d => d)
            .classed('locationButton', true)
            .classed('selected', d => d == this.selectedLocationId)
            .attr('id', d => 'imageLocation-' + d)
            .on('click', d => 
            {
                this.changeLocationSelection(d);
                this.setImageStackWidget();
            });
        this.imageStackWidget.draw();
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