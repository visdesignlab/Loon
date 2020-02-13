import * as d3 from 'd3';
import {HtmlSelection, SvgSelection} from '../devlib/DevlibTypes'
import {PointND} from '../DataModel/PointND'
import {ImageLocation} from '../DataModel/ImageLocation';

export class ImageStackWidget {
	
	constructor(container: HTMLElement, maxHeight: number)
	{
		this._container = container;
		this._maxHeight = maxHeight;
		this.init();
		this._imageStackUrl = '';
		this._selectedImgIndex = 0;
		console.log(d3);
		console.log(this);
		this._thumbnailScale = 0.1; // thumbnails are 1/10th the size of the original
	}
	
	
	private _container : HTMLElement;
	public get container() : HTMLElement {
		return this._container;
	}
	
	private _maxHeight : number;
	public get maxHeight() : number {
		return this._maxHeight;
	}
	
	
	private _imageLocation : ImageLocation;
	public get imageLocation() : ImageLocation {
		return this._imageLocation;
	}
	

	private _imageWidth : number;
	public get imageWidth() : number {
		return this._imageWidth;
	}
	
	private _imageHeight : number;
	public get imageHeight() : number {
		return this._imageHeight;
	}
	
	private _numImages : number;
	public get numImages() : number {
		return this._numImages;
	}
	
	private _numColumns : number;
	public get numColumns() : number {
		return this._numColumns;
	}
	
	private _imageStackUrl : string;
	public get imageStackUrl() : string {
		return this._imageStackUrl;
	}
	
	private _imageStackWidth : number;
	public get imageStackWidth() : number {
		return this._imageStackWidth;
	}

	private _imageStackHeight : number;
	public get imageStackHeight() : number {
		return this._imageStackHeight;
	}
	
	private _selectedImgIndex : number;
	public get selectedImgIndex() : number {
		return this._selectedImgIndex;
	}
	
	
	private _innerContainer : HtmlSelection;
	public get innerContainer() : HtmlSelection {
		return this._innerContainer;
	}

	private _selectedImageContainer : HtmlSelection;
	public get selectedImageContainer() : HtmlSelection {
		return this._selectedImageContainer;
	}	

	private _selectedImageOverlay : SvgSelection;
	public get selectedImageOverlay() : SvgSelection {
		return this._selectedImageOverlay;
	}
	
	
	private _thumbnailsContainer : HtmlSelection;
	public get thumbnailsContainer() : HtmlSelection {
		return this._thumbnailsContainer;
	}
	
	private _thumbnailScale : number;
	public get thumbnailScale() : number {
		return this._thumbnailScale;
	}

	
	private _data : PointND[];
	public get data() : PointND[] {
		return this._data;
	}
	
	public init(): void
	{
		const containerSelect = d3.select(this.container);
		this._innerContainer = containerSelect.append('div')
			.classed('innerContainer', true);

		this.innerContainer.attr('style', `max-height: ${this.maxHeight}px;`)

		this._selectedImageContainer = this.innerContainer.append('div')
			.classed('noShrink', true);

		this._selectedImageOverlay = this._selectedImageContainer.append('svg');

		this._thumbnailsContainer = this.innerContainer.append('div')
			.classed('thumbnailsContainer', true);

		document.onkeydown = (event) => {this.handleKeyDown(event)};
	}

	public SetData(data: PointND[], url: string, imageLocation: ImageLocation, imageWidth: number, imageHeight: number, numColumns: number): void
	{
		this._data = data;
		this._imageStackUrl = url;
		this._selectedImgIndex = 0;
		this._imageLocation = imageLocation;
		
		this._imageWidth = imageWidth;
		this._imageHeight = imageHeight;
		this.selectedImageOverlay
			.attr('width', imageWidth)
			.attr('height', imageHeight);

		this._numImages = imageLocation.frameList.length;
		this._numColumns = numColumns;
		this._imageStackWidth = numColumns * imageWidth;
		const numRows: number = Math.ceil(this.numImages / numColumns);
		this._imageStackHeight = numRows * imageHeight;
		this.draw();
	}

	public draw(): void
	{
		this.drawSelectedImage();
		this.drawAllThumbnails();
	}

	public drawUpdate(): void
	{
		this.updateBackgroundPosition(this.selectedImgIndex);
		this.drawBrushedCentroids();
		this.changeSelectedThumbnail();

	}

	private drawSelectedImage(): void
	{
		const styleString: string = this.getImageInlineStyle(this.selectedImgIndex, this.imageStackUrl);
		this.selectedImageContainer.attr("style", styleString)
		this.drawBrushedCentroids();
	}

	private drawBrushedCentroids()
	{
		let currentFrameId = this.imageLocation.frameList[this.selectedImgIndex].frameId;
		let thisFramesData = this.data.filter(d => d.get('frameId') === currentFrameId)

		this.selectedImageOverlay.selectAll('circle')
		  .data(thisFramesData)
			.join('circle')
			.attr('cx', d => d.get('x') + d.get('xShift'))
			.attr('cy', d => d.get('y') + d.get('yShift'))
			.classed('centroidIndicator', true)
			.classed('inBrush', d => d.inBrush)
	}

	private drawAllThumbnails(): void
	{
		this.thumbnailsContainer.attr('style', `max-height: ${this.maxHeight}px;`);

		this.thumbnailsContainer.selectAll('div')
			.data(this.imageLocation.frameList)
		  .join('div')
			.attr('style', (d, index) => this.getImageInlineStyle(index, this.imageStackUrl, true, 0.1))
			.classed('imageStackThumbnail', true)
			.classed('selected', (d, index) => index === this.selectedImgIndex)
			.classed('brushed', d => d.inBrush)
			.on('click', (d, index) => {
				this.changeSelectedImage(index);
			});
	}

	private changeSelectedThumbnail(): void
	{
		this.thumbnailsContainer.selectAll('div')
			.data(this.imageLocation.frameList)
		  	.classed('selected', (d, index) => index === this.selectedImgIndex)
	}

	private changeSelectedImage(newIndex: number): void
	{
		this._selectedImgIndex = newIndex;
		this.drawUpdate();
	}

	private handleKeyDown(event: KeyboardEvent): void
	{
		let newIndex: number;
		switch (event.keyCode)
		{
			case 37: // left
				newIndex = Math.max(0, this.selectedImgIndex - 1);
				this.changeSelectedImage(newIndex);
				break;
			case 39: // right
				newIndex = Math.min(this.numImages - 1, this.selectedImgIndex + 1);
				this.changeSelectedImage(newIndex);
				break;
		}
	}

	private getImageInlineStyle(index: number, imageUrl: string, includeFallback = true,  scale: number = 1): string
	{
		const [top, left] = this.getTileTopLeft(index);
		let styleString: string =
			`
			background-position-x: ${-left * scale}px;
			background-position-y: ${-top * scale}px;
			background-image: url(${this.imageStackUrl});
			width: ${this.imageWidth * scale}px;
			height: ${this.imageHeight * scale}px;
			`;

		if (includeFallback)
		{
			styleString += 'background-color: #ebebeb;';
		}
		if (scale !== 1)
		{
			styleString += `background-size: ${this.imageStackWidth * scale}px ${this.imageStackHeight * scale}px;`
		}
		return styleString;
	}

	private updateBackgroundPosition(index: number)
	{
		const [top, left] = this.getTileTopLeft(index);
		this.selectedImageContainer.node().style.backgroundPositionX =  -left + 'px';
		this.selectedImageContainer.node().style.backgroundPositionY = -top + 'px';
	}

	private getTileTopLeft(index): [number, number]
	{
		const left: number = (index % this.numColumns) * this.imageWidth;
		const top: number = Math.floor(index / this.numColumns) * this.imageHeight;
		return [top, left];
	}

	public OnResize(newMaxHeight: number): void
	{
		this._maxHeight = this.maxHeight;
		this.thumbnailsContainer.attr('style', `max-height: ${this.maxHeight}px;`);
	}

}