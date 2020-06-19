import * as d3 from 'd3';
import {HtmlSelection, SvgSelection} from '../devlib/DevlibTypes'
import {PointND} from '../DataModel/PointND' 
// import {NDim} from '../devlib/DevlibTypes';
import {ImageLocation} from '../DataModel/ImageLocation';
import { CurveList } from '../DataModel/CurveList';

export class ImageStackWidget {
	
	constructor(container: HTMLElement, maxHeight: number)
	{
		this._container = container;
		this._maxHeight = maxHeight;
		this.init();
		this._imageStackUrl = '';
		this._labelArray = null;
		this._cellHovered = 0;
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
	
	private _imageStackLabelUrl : string;
	public get imageStackLabelUrl() : string {
		return this._imageStackLabelUrl;
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

	private _selectedImageCanvas : HtmlSelection;
	public get selectedImageCanvas() : HtmlSelection {
		return this._selectedImageCanvas;
	}

	private _canvasContext : CanvasRenderingContext2D;
	public get canvasContext() : CanvasRenderingContext2D {
		return this._canvasContext;
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

	
	private _data : CurveList;
	public get data() : CurveList {
		return this._data;
	}
	
	private _labelArray : Int8Array;
	public get labelArray() : Int8Array {
		return this._labelArray;
	}

	private _defaultCanvasState : ImageData;
	public get defaultCanvasState() : ImageData {
		return this._defaultCanvasState;
	}

	private _cellHovered : number;
	public get cellHovered() : number {
		return this._cellHovered;
	}
	
	public init(): void
	{
		const containerSelect = d3.select(this.container);
		this._innerContainer = containerSelect.append('div')
			.classed('innerContainer', true);

		this.innerContainer.attr('style', `max-height: ${this.maxHeight}px;`)

		this._selectedImageContainer = this.innerContainer.append('div')
			.classed('noShrink', true);

		this._selectedImageCanvas = this.selectedImageContainer.append('canvas')
			.style('opacity', 0);

		this.selectedImageCanvas.node().addEventListener('mousemove', (e: MouseEvent) =>
			{
				this.onCanvasMouseMove(e)
			});
			  
		this._canvasContext = (this.selectedImageCanvas.node() as HTMLCanvasElement).getContext('2d');

		this.selectedImageContainer
			.on('mouseenter', () => {
				this.selectedImageCanvas.style('opacity', 1);
			})
			.on('mouseleave', () => {
				this.selectedImageCanvas.style('opacity', 0.6);
			});

		this._selectedImageOverlay = this.selectedImageContainer.append('svg');

		this._thumbnailsContainer = this.innerContainer.append('div')
			.classed('thumbnailsContainer', true);

		document.onkeydown = (event) => {this.handleKeyDown(event)};
	}

	public SetData(data: CurveList, imageLocation: ImageLocation): void
	{
		this._data = data;
		this._selectedImgIndex = 0;
		this._imageLocation = imageLocation;
		this._numImages = imageLocation.frameList.length;
		this.SetImageProperties(); // default values before image load
		this.draw();
	}

	public SetImageProperties(imageUrl?: string, imageWidth?: number, imageHeight?: number, numColumns?: number): void
	{
		// default values for when loading, or if image isn't found
		if (!imageWidth)  { imageWidth  = 256; }
		if (!imageHeight) { imageHeight = 256; }
		if (!numColumns)  { numColumns  = 10; }
		if (imageUrl)
		{
			this._imageStackUrl = imageUrl;
		}
		else
		{
			this._imageStackUrl = '';
		}

		this._imageWidth = imageWidth;
		this._imageHeight = imageHeight;
		this.selectedImageOverlay
			.attr('width', imageWidth)
			.attr('height', imageHeight);
		this._numColumns = numColumns;
		this._imageStackWidth = numColumns * imageWidth;
		const numRows: number = Math.ceil(this.numImages / numColumns);
		this._imageStackHeight = numRows * imageHeight;
		this.draw();
	}

	public SetLabelUrl(labelUrl?: string): void
	{
		this._imageStackLabelUrl = labelUrl;
		this._labelArray = null;
		this.updateCanvas();
		if (!labelUrl)
		{
			return
		}
		d3.buffer(this.imageStackLabelUrl).then((data: ArrayBuffer) =>
		{
			if (data.byteLength === 0)
			{
				this._labelArray = null;
			}
			else
			{
				this._labelArray = new Int8Array(data);
			}
			this.updateCanvas();
		});
	}

	public draw(): void
	{
		this.drawSelectedImage();
		this.drawAllThumbnails();
	}

	public drawUpdate(): void
	{
		this.updateBackgroundPosition(this.selectedImgIndex);
		this.updateCanvas();
		this.changeSelectedThumbnail();

	}

	private drawSelectedImage(): void
	{
		const styleString: string = this.getImageInlineStyle(this.selectedImgIndex, this.imageStackUrl);
		this.selectedImageContainer.attr("style", styleString);
		this.updateCanvas();
	}

	private updateCanvas(): void
	{
		if (!this.imageStackUrl)
		{
			return;
		}
		this.selectedImageCanvas
			.attr('width', this.imageWidth)
			.attr('height', this.imageHeight);

		this.createOutlineImage();
		this.drawDefaultCanvas();
	}

	private createOutlineImage(): void
	{
		let myImageData = this.canvasContext.createImageData(this.imageWidth, this.imageHeight);
		if (!this.labelArray)
		{
			this._defaultCanvasState = myImageData
			return;
		}
		let numPixelsInTile = this.imageWidth * this.imageHeight;
		let firstIndex = numPixelsInTile * this.selectedImgIndex;
		for (let i = firstIndex; i < firstIndex + numPixelsInTile; i++)
		{
			let rIdx = (i - firstIndex) * 4;
			let label = this.labelArray[i];
			if (label > 0 && this.isBorder(i))
			{
				let cell = this.getCell(label)
				let [r, g, b] = this.getCellColor(cell);
				myImageData.data[rIdx] = r;
				myImageData.data[rIdx + 1] = g;
				myImageData.data[rIdx + 2] = b;
				myImageData.data[rIdx + 3] = 255;
			}
		}
		this._defaultCanvasState = myImageData;
	}

	private drawDefaultCanvas(): void
	{
		this.canvasContext.putImageData(this.defaultCanvasState, 0, 0);
	}

	private isBorder(index: number): boolean
	{
		let numPixelsInTile = this.imageWidth * this.imageHeight;
		let firstIndex = numPixelsInTile * this.selectedImgIndex;
		let label = this.labelArray[index];
		let neighborIndices: number[] = [];
		// 4-neighbor
		neighborIndices.push(index + 1);
		neighborIndices.push(index - 1);
		neighborIndices.push(index + this.imageWidth);
		neighborIndices.push(index - this.imageWidth);

		for (let nIdx of neighborIndices)
		{
			if (nIdx < firstIndex || (firstIndex + numPixelsInTile) <= nIdx)
			{
				// neighbor out of bounds of tile
				continue;
			}
			let nVal = this.labelArray[nIdx];
			if (nVal !== label)
			{
				return true
			}
		}
		return false;
	}

	private onCanvasMouseMove(e: MouseEvent): void
	{
		if (!this.labelArray || !this.defaultCanvasState)
		{
			return;
		}
		const numPixelsInTile = this.imageWidth * this.imageHeight;
		const firstIndex = numPixelsInTile * this.selectedImgIndex;
		const labelIndex = firstIndex + e.offsetY * this.imageWidth + e.offsetX;
		const label = this.labelArray[labelIndex];
		if (label === this.cellHovered)
		{
			return
		}
		this._cellHovered = label;
		if (label === 0)
		{
			this.drawDefaultCanvas();
		}
		else
		{
			let cell: PointND = this.getCell(label);
			console.log(cell);
			console.log(cell?.parent?.id);
			let myImageData = this.canvasContext.createImageData(this.imageWidth, this.imageHeight);
			myImageData.data.set(this.defaultCanvasState.data);
			for (let i = firstIndex; i < firstIndex + numPixelsInTile; i++)
			{
				let rIdx = (i - firstIndex) * 4;
				let imgLabel = this.labelArray[i];
				if (imgLabel === this.cellHovered)
				{
					let [r, g, b] = this.getCellColor(cell);
					myImageData.data[rIdx] = r;
					myImageData.data[rIdx + 1] = g;
					myImageData.data[rIdx + 2] = b;
					myImageData.data[rIdx + 3] = 200; // alpha
				}
			}
			this.canvasContext.putImageData(myImageData, 0, 0);
		}
	}

	private getCell(label: number): PointND | null
	{
		let locId = this.imageLocation.locationId
		let currentFrameId = this.imageLocation.frameList[this.selectedImgIndex].frameId
		return this.data.GetCellFromLabel(locId, currentFrameId, label);
	}

	private getCellColor(cell: PointND | null): [number, number, number]
	{
		let color: [number, number, number] = [0, 0, 0];
		if (!cell)
		{
			// SpringGreen
			color = [154, 205, 50];
		}
		else if (cell.inBrush)
		{
			// FireBrick
			color = [178, 34, 34];
		}
		else
		{
			// SteelBlue
			color = [70, 130, 180];
		}
		return color
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
			width: ${this.imageWidth * scale}px;
			height: ${this.imageHeight * scale}px;
			`;
		if (imageUrl)
		{
			styleString += `background-image: url(${imageUrl});`;
		}

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