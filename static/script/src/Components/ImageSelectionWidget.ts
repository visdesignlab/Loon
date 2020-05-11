import * as d3 from 'd3';
import {HtmlSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import {ImageStackWidget} from './ImageStackWidget';
import {ImageMetaData} from '../DataModel/ImageMetaData';
import { CurveList } from '../DataModel/CurveList';

export class ImageSelectionWidget extends BaseWidget<CurveList> {
    
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
        this._imageStackWidget = new ImageStackWidget(this.imageStackContainer.node(), this.vizHeight);

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
        const newUrl = `/data/${this.data.datasetSpec.googleDriveId}/img_${this.selectedLocationId}.png`
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
            let blobUrl = window.URL.createObjectURL(xhr.response);
            this.imageStackWidget.SetImageProperties(blobUrl, imgWidth, imgHeight, numCol);
        }
        xhr.open('GET', newUrl);
        xhr.send();

        let currentLocation = this.imageMetaData.locationLookup.get(this.selectedLocationId);
        let pointsAtLocation = this.data.Array.filter(d => d.get('Location ID') === currentLocation.locationId);
        this.imageStackWidget.SetData(pointsAtLocation, currentLocation);
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