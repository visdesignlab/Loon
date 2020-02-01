import * as d3 from 'd3';
import {HtmlSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import {ImageStackWidget} from './ImageStackWidget';
import {PointCollection} from '../DataModel/PointCollection';
import {ImageMetaData} from '../DataModel/ImageMetaData';

export class ImageSelectionWidget extends BaseWidget<PointCollection> {
	
	// constructor(container: HTMLElement)
	// {

	// }

    
    private _imageMetaData : ImageMetaData;
    public get imageMetaData() : ImageMetaData {
        return this._imageMetaData;
    }

    private _innerContainer : HtmlSelection;
    public get innerContainer() : HtmlSelection {
        return this._innerContainer;
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
        this._locationSelectionContainer = this.innerContainer.append('div')
            .classed('locationSelectionContainer', true);

        this._imageCountContainer = this._locationSelectionContainer.append('div')
            .classed('imageCountContainer', true);

        this._locationListContainer = this._locationSelectionContainer.append('div')
            .classed('locationListContainer', true);

        this._imageStackContainer = this.innerContainer.append('div')
            .attr('style', `max-height: ${this.vizHeight}px;`)
            .classed('imageStackContainer', true);

        // const imgWidth = 400;
        // const imgHeight = 300;
        // const numImg = 281;
        // const numCol = 10;
        // const folderId = '1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX';
        // // const imgPath = `/data/${this.data.sourceKey}/img_${this.selectedLocationId}.jpg`
        this._imageStackWidget = new ImageStackWidget(this.imageStackContainer.node(), this.vizHeight);

	}

	public OnDataChange()
	{
        this._imageMetaData = ImageMetaData.fromPointCollection(this.data);
        this._selectedLocationId = this.imageMetaData.locationList[0].locationId;
        
        // let currentLocation = this.imageMetaData.locationLookup.get(this.selectedLocationId);
        // this.imageStackWidget.setImageLocation(currentLocation);
        this.setImageStackWidget()
        this.OnBrushChange()
    }
    
    public setImageStackWidget(): void
    {
        // TODO - get imgWidth x imgHeight dynamically
        const imgWidth = 400;
        const imgHeight = 300;
        // const numImg = 281;
        const numCol = 10;
        const newUrl = `/data/${this.data.sourceKey}/img_${this.selectedLocationId}.jpg`
        let currentLocation = this.imageMetaData.locationLookup.get(this.selectedLocationId);
        this.imageStackWidget.SetData(newUrl, currentLocation, imgWidth, imgHeight, numCol);
        // this.imageStackWidget.setImageLocation(currentLocation);
        // this.imageStackWidget.setImageUrl(newUrl);

    }

	protected OnResize(): void
	{
        this.imageStackWidget.OnResize(this.vizHeight);
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
                // TODO - refactor when not tired.
                let lastSelected = d3.select("#imageLocation-" + this.selectedLocationId);
                lastSelected.classed('selected', false);
                this._selectedLocationId = d;
                this.setImageStackWidget();
                // const folderId = '1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX';
                // const newUrl = `/data/${this.data.sourceKey}/img_${this.selectedLocationId}.jpg`
                // let currentLocation = this.imageMetaData.locationLookup.get(this.selectedLocationId);
                // this.imageStackWidget.setImageLocation(currentLocation);
                // this.imageStackWidget.setImageUrl(newUrl);
                let newSelected = d3.select("#imageLocation-" + this.selectedLocationId);
                newSelected.classed('selected', true);
            });
        // let currentLocation = this.imageMetaData.locationLookup.get(this.selectedLocationId);
        // this.imageStackWidget.setImageLocation(currentLocation);
        this.imageStackWidget.draw(); // TODO - make this more specific
    }

}