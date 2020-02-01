import * as d3 from 'd3';
import {HtmlSelection} from '../devlib/DevlibTypes'
import {BaseWidget} from './BaseWidget';
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
	
	private _thumbnailsContainer : HtmlSelection;
	public get thumbnailsContainer() : HtmlSelection {
		return this._thumbnailsContainer;
	}
	
	private _thumbnailScale : number;
	public get thumbnailScale() : number {
		return this._thumbnailScale;
	}
	

	public init(): void
	{
		const containerSelect = d3.select(this.container);
		this._innerContainer = containerSelect.append('div')
			.classed('innerContainer', true);

		this.innerContainer.attr('style', `max-height: ${this.maxHeight}px;`)

		this._selectedImageContainer = this.innerContainer.append('div')
			.classed('selectedImageContainer', true);

		this._thumbnailsContainer = this.innerContainer.append('div')
			.classed('thumbnailsContainer', true);

		document.onkeydown = (event) => {this.handleKeyDown(event)};
	}

	public SetData(url: string, imageLocation: ImageLocation, imageWidth: number, imageHeight: number, numColumns: number): void
	{
		this._imageStackUrl = url;
		this._selectedImgIndex = 0;
		this._imageLocation = imageLocation;
		
		this._imageWidth = imageWidth;
		this._imageHeight = imageHeight;
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

	private drawSelectedImage(): void
	{
		const styleString: string = this.getImageInlineStyle(this.selectedImgIndex);
		this.selectedImageContainer.attr("style", styleString)
	}

	private drawAllThumbnails(): void
	{
		// let indices: number[] = [...Array(this.numImages).keys()];

		this.thumbnailsContainer.attr('style', `max-height: ${this.maxHeight}px;`);

		this.thumbnailsContainer.selectAll('div')
			.data(this.imageLocation.frameList)
		  .join('div')
			.attr('style', (d, index) => this.getImageInlineStyle(index, 0.1))
			.classed('imageStackThumbnail', true)
			.classed('selected', (d, index) => index === this.selectedImgIndex)
			.classed('brushed', d => d.inBrush)
			.on('click', (d, index) => {
				this.changeSelectedImage(index);
			});

	}

	private changeSelectedImage(newIndex: number): void
	{
		this._selectedImgIndex = newIndex;
		this.draw();
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

	private getImageInlineStyle(index: number, scale: number = 1): string
	{
		const left: number = (index % this.numColumns) * this.imageWidth;
		const top: number = Math.floor(index / this.numColumns) * this.imageHeight;
		let styleString: string =
			`
			background-position-x: ${-left * scale}px;
			background-position-y: ${-top * scale}px;
			background-image: url(${this.imageStackUrl});
			width: ${this.imageWidth * scale}px;
			height: ${this.imageHeight * scale}px;
			`;
		if (scale !== 1)
		{
			styleString += `background-size: ${this.imageStackWidth * scale}px ${this.imageStackHeight * scale}px;`
		}
		return styleString;
	}

	public OnResize(newMaxHeight: number): void
	{
		this._maxHeight = this.maxHeight;
		this.thumbnailsContainer.attr('style', `max-height: ${this.maxHeight}px;`);
	}

}