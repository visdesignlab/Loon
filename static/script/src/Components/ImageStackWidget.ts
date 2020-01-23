import * as d3 from 'd3';
// import {SvgSelection} from '../devlib/DevLibTypes';
import {HtmlSelection} from '../devlib/DevlibTypes'
import {BaseWidget} from './BaseWidget';
import {PointCollection} from '../DataModel/PointCollection';
import { style } from 'd3';
// import {PointND} from '../DataModel/PointND';
// import {valueFilter} from '../DataModel/PointCollection';

export class ImageStackWidget extends BaseWidget<PointCollection> {
	
	constructor(container: HTMLElement, imageWidth: number, imageHeight: number, numImages: number, numColumns: number, imageStackUrl: string)
	{
		super(container);
		this._imageWidth = imageWidth;
		this._imageHeight = imageHeight;
		this._numImages = numImages;
		this._numColumns = numColumns;
		this._imageStackUrl = imageStackUrl;
		this._selectedImgIndex = 0;
		console.log(d3);
		console.log(this);
		this._imageStackWidth = numColumns * imageWidth;
		const numRows: number = Math.ceil(numImages / numColumns);
		this._imageStackHeight = numRows * imageHeight;
		this._thumbnailScale = 0.1; // thumbnails are 1/10th the size of the original
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
		this._selectedImageContainer = containerSelect.append('div');

		this._thumbnailsContainer = containerSelect.append('div')
			.classed('thumbnailsContainer', true);

		document.onkeydown = (event) => {this.handleKeyDown(event)};
	}

	public OnDataChange()
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
		let indices: number[] = [...Array(this.numImages).keys()];

		this.thumbnailsContainer.selectAll('div')
			.data(indices)
		  .join('div')
			.attr('style', d => this.getImageInlineStyle(d, 0.1))
			.classed('imageStackThumbnail', true)
			.classed('selected', d => d === this.selectedImgIndex)
			.on('click', (d) => {
				this.changeSelectedImage(d);
			});

	}

	private changeSelectedImage(newIndex: number): void
	{
		this._selectedImgIndex = newIndex;
		this.OnDataChange();
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
		const styleString: string =
			`
			background-position-x: ${-left * scale}px;
			background-position-y: ${-top * scale}px;
			background-image: url(${this.imageStackUrl});
			width: ${this.imageWidth * scale}px;
			height: ${this.imageHeight * scale}px;
			background-size: ${this.imageStackWidth * scale}px ${this.imageStackHeight * scale}px;
			`;
		return styleString;
	}

	protected OnResize(): void
	{
		// TODO
	}

}