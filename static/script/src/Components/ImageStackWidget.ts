import * as d3 from 'd3';
import {HtmlSelection, SvgSelection} from '../devlib/DevlibTypes';
import { PointND } from '../DataModel/PointND';
import { ImageLocation } from '../DataModel/ImageLocation';
import { CurveList } from '../DataModel/CurveList';
import { RichTooltip } from '../Components/RichTooltip';
import { ImageStackMetaData } from '../types';
import { ImageTrackWidget } from './ImageTrackWidget';
import { CurveND } from '../DataModel/CurveND';

export class ImageStackWidget {
	
	constructor(container: HTMLElement, imageTrackContainer: HTMLElement, maxHeight: number)
	{
		this._container = container;
		this._imageTrackWidget = new ImageTrackWidget(imageTrackContainer, this);
		this._maxHeight = maxHeight;
		this.init();
		this._imageStackMetaData = {
			url: '',
			tileWidth: 0,
			tileHeight: 0,
			numberOfTiles: 0,
			numberOfColumns: 0
		};
		this._labelArray = null;
		this._cellHovered = 0;
		this._selectedImgIndex = 0;
		console.log(d3);
		console.log(this);
		this._tooltip = new RichTooltip();
	}
		
	private _container : HTMLElement;
	public get container() : HTMLElement {
		return this._container;
	}
	
	private _imageTrackWidget : ImageTrackWidget;
	public get imageTrackWidget() : ImageTrackWidget {
		return this._imageTrackWidget;
	}	

	private _maxHeight : number;
	public get maxHeight() : number {
		return this._maxHeight;
	}
	
	private _imageLocation : ImageLocation;
	public get imageLocation() : ImageLocation {
		return this._imageLocation;
	}
	
	private _imageStackBlob : Blob;
	public get imageStackBlob() : Blob {
		return this._imageStackBlob;
	}

	private _imageStackMetaData : ImageStackMetaData;
	public get imageStackMetaData() : ImageStackMetaData {
		return this._imageStackMetaData;
	}

	public get numPixelsInTile() : number {
		return this.imageStackMetaData.tileWidth * this.imageStackMetaData.tileHeight;
	}

	public get firstIndex() : number {
		return this.numPixelsInTile * this.selectedImgIndex;
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

	private _locationLabel : HtmlSelection;
	public get locationLabel() : HtmlSelection {
		return this._locationLabel;
	}
	
	private _frameLabel : HtmlSelection;
	public get frameLabel() : HtmlSelection {
		return this._frameLabel;
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

	private _tooltip : RichTooltip;
	public get tooltip() : RichTooltip {
		return this._tooltip;
	}
	
	public init(): void
	{
		const containerSelect = d3.select(this.container);
		this._innerContainer = containerSelect.append('div')
			.classed('innerContainer', true);

		const locationFrameLabelContainer = this.innerContainer.append('div')
			.classed('locationFrameLabelContainer', true);

		const locationFrameLabel = locationFrameLabelContainer.append('h3')
			.classed('locationFrameLabel', true);
		
		locationFrameLabel.node().append('Location: ');
		this._locationLabel = locationFrameLabel.append('span')
			.classed('locationFrameLabelValue', true);

		locationFrameLabel.node().append('Frame: ');
		this._frameLabel = locationFrameLabel.append('span')
			.classed('locationFrameLabelValue', true);

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
			.on('mouseenter', () => this.brightenCanvas())
			.on('mouseleave', () => {
				this.hideSegmentHover();
				this.dimCanvas();
			});

		this.imageTrackWidget.init();
	}

	public dimCanvas(): void
	{
		this.selectedImageCanvas.style('opacity', 0.6);
	}

	public brightenCanvas(): void
	{
		this.selectedImageCanvas.style('opacity', 1);
	}

	public SetData(data: CurveList, imageLocation: ImageLocation): void
	{
		this._data = data;
		this._selectedImgIndex = 0;
		this._imageLocation = imageLocation;
		this.imageStackMetaData.numberOfTiles = imageLocation.frameList.length;
		this.SetImageProperties(); // default values before image load
		this.draw();
	}

	public SetImageProperties(blob?: Blob, imageWidth?: number, imageHeight?: number, numColumns?: number): void
	{
		// default values for when loading, or if image isn't found
		if (!imageWidth)  { imageWidth  = 256; }
		if (!imageHeight) { imageHeight = 256; }
		if (!numColumns)  { numColumns  = 10; }
		if (blob)
		{
			this.imageStackMetaData.url = window.URL.createObjectURL(blob);
		}
		else
		{
			this.imageStackMetaData.url = '';
		}
		this._imageStackBlob = blob;

		this.imageStackMetaData.tileWidth = imageWidth;
		this.imageStackMetaData.tileHeight = imageHeight;
		this.imageStackMetaData.numberOfColumns = numColumns;
		this._imageStackWidth = numColumns * imageWidth;
		const numRows: number = Math.ceil(this.imageStackMetaData.numberOfTiles / numColumns);
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

	public draw(skipImageTrackDraw = false): void
	{
		this.drawSelectedImage(skipImageTrackDraw);
		this.updateLocationFrameLabel();
	}

	public OnBrushChange(): void
	{
		this.draw(true);
		this.imageTrackWidget.OnBrushChange();
	}

	public drawUpdate(): void
	{
		this.updateBackgroundPosition(this.selectedImgIndex);
		this.updateCanvas();
		this.updateLocationFrameLabel();
	}

	private drawSelectedImage(skipImageTrackDraw = false): void
	{
		const styleString: string = this.getImageInlineStyle(this.selectedImgIndex, this.imageStackMetaData.url);
		this.selectedImageContainer.attr("style", styleString);
		this.updateCanvas(skipImageTrackDraw);
	}

	private updateLocationFrameLabel(): void
	{
		this.locationLabel.text(this.getCurrentLocationId());
		this.frameLabel.text(this.getCurrentFrameId());
	}

	private getCurrentLocationId(): number
	{
		return this.imageLocation.locationId;
	}

	public getCurrentFrameId(): number
	{
		return this.imageLocation.frameList[this.selectedImgIndex].frameId;
	}

	private updateCanvas(skipImageTrackDraw = false): void
	{
		if (!this.imageStackMetaData.url)
		{
			return;
		}
		this.selectedImageCanvas
			.attr('width', this.imageStackMetaData?.tileWidth)
			.attr('height', this.imageStackMetaData?.tileHeight);

		this.createOutlineImage();
		this.drawDefaultCanvas();
		let locId = this.imageLocation.locationId;
		const pointsAtFrame = this.data.GetCellsAtFrame(this.getCurrentLocationId(), this.getCurrentFrameId())
		if (!skipImageTrackDraw)
		{
			let curveList: CurveND[] = [];
			for (let point of pointsAtFrame)
			{
				curveList.push(point.parent);
			}
			this.imageTrackWidget.draw(curveList);
		}
	}

	private createOutlineImage(): void
	{
		let myImageData = this.canvasContext.createImageData(this.imageStackMetaData?.tileWidth, this.imageStackMetaData?.tileHeight);
		if (!this.labelArray)
		{
			this._defaultCanvasState = myImageData
			return;
		}
		const numPixelsInTile = this.numPixelsInTile;
		const firstIndex = this.firstIndex;
		for (let i = firstIndex; i < firstIndex + numPixelsInTile; i++)
		{
			let rIdx = (i - firstIndex) * 4;
			let label = this.labelArray[i];
			if (label > 0 && this.isBorder(i))
			{
				let [cell, _index] = this.getCell(label)
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

	public isBorder(index: number): boolean
	{
		const numPixelsInTile = this.numPixelsInTile;
		const extra = index % (this.imageStackMetaData.tileWidth * this.imageStackMetaData.tileHeight);
		const firstIndex = index - extra;
		let label = this.labelArray[index];
		let neighborIndices: number[] = [];
		// 4-neighbor
		neighborIndices.push(index + 1);
		neighborIndices.push(index - 1);
		neighborIndices.push(index + this.imageStackMetaData.tileWidth);
		neighborIndices.push(index - this.imageStackMetaData.tileWidth);
		// 8-neighbor
		neighborIndices.push(index - this.imageStackMetaData.tileWidth + 1);
		neighborIndices.push(index - this.imageStackMetaData.tileWidth - 1);
		neighborIndices.push(index + this.imageStackMetaData.tileWidth + 1);
		neighborIndices.push(index + this.imageStackMetaData.tileWidth - 1);
		// 12-neighbor
		neighborIndices.push(index + 2);
		neighborIndices.push(index - 2);
		neighborIndices.push(index + 2 * this.imageStackMetaData.tileWidth);
		neighborIndices.push(index - 2 * this.imageStackMetaData.tileWidth);


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
		const numPixelsInTile = this.numPixelsInTile;
		const firstIndex = this.firstIndex;
		const labelIndex = firstIndex + e.offsetY * this.imageStackMetaData.tileWidth + e.offsetX;
		const label = this.labelArray[labelIndex];
		if (label === this.cellHovered)
		{
			return
		}
		this._cellHovered = label;
		if (label === 0)
		{
			this.drawDefaultCanvas();
			this.tooltip.Hide();
		}
		else
		{
			// let [cell, index] = this.getCell(label);
			// let cellX = 0;
			// let cellY = 0;
			// if (cell)
			// {
			// 	let canvasBoundRect = this.selectedImageCanvas.node().getBoundingClientRect();
			// 	cellX = cell.get('X') + cell.get('xShift');
			// 	cellY = cell.get('Y') + cell.get('yShift');
			// }

			// let myImageData = this.canvasContext.createImageData(this.imageStackMetaData.tileWidth, this.imageStackMetaData.tileHeight);
			// myImageData.data.set(this.defaultCanvasState.data);
			// for (let i = firstIndex; i < firstIndex + numPixelsInTile; i++)
			// {
			// 	let [imgX, imgY] = this.getTilePixelXYFromLabelIndex(firstIndex, i);
			// 	let rIdx = (i - firstIndex) * 4;
			// 	let imgLabel = this.labelArray[i];
			// 	if (cell && Math.pow(imgX - cellX, 2) + Math.pow(imgY - cellY, 2) <= 25)
			// 	{
			// 		// cell center label
			// 		let [r, g, b] = this.getCellColor(cell);
			// 		myImageData.data[rIdx] = 255;
			// 		myImageData.data[rIdx + 1] = 0;
			// 		myImageData.data[rIdx + 2] = 255;
			// 		myImageData.data[rIdx + 3] = 255; // alpha
			// 	}
			// 	else if (imgLabel === this.cellHovered)
			// 	{
			// 		// cell region color
			// 		let [r, g, b] = this.getCellColor(cell);
			// 		myImageData.data[rIdx] = r;
			// 		myImageData.data[rIdx + 1] = g;
			// 		myImageData.data[rIdx + 2] = b;
			// 		myImageData.data[rIdx + 3] = 200; // alpha
			// 	}
			// }
			// this.canvasContext.putImageData(myImageData, 0, 0);
			// let tooltipContent: string = this.getTooltipContent(label, cell, index);
			

			// this.tooltip.Show(tooltipContent, pageX, pageY);
			this.showSegmentHover(label);
		}
	}

	public hideSegmentHover(): void
	{
		this.drawDefaultCanvas();
		this.tooltip.Hide();
	}

	public showSegmentHover(segmentId: number): void
	{
		this._cellHovered = segmentId;
		let [cell, index] = this.getCell(segmentId);

		let cellX = 0;
		let cellY = 0;
		let pageX = 0;
		let pageY = 0;
		if (cell)
		{
			let canvasBoundRect = this.selectedImageCanvas.node().getBoundingClientRect();
			cellX = cell.get('X') + cell.get('xShift');
			cellY = cell.get('Y') + cell.get('yShift');
			pageX = canvasBoundRect.x + cellX;
			pageY = canvasBoundRect.y + cellY;
		}

		let myImageData = this.canvasContext.createImageData(this.imageStackMetaData.tileWidth, this.imageStackMetaData.tileHeight);
		myImageData.data.set(this.defaultCanvasState.data);
		for (let i = this.firstIndex; i < this.firstIndex + this.numPixelsInTile; i++)
		{
			let [imgX, imgY] = this.getTilePixelXYFromLabelIndex(this.firstIndex, i);
			let rIdx = (i - this.firstIndex) * 4;
			let imgLabel = this.labelArray[i];
			if (cell && Math.pow(imgX - cellX, 2) + Math.pow(imgY - cellY, 2) <= 25)
			{
				// cell center label
				let [r, g, b] = this.getCellColor(cell);
				myImageData.data[rIdx] = 255;
				myImageData.data[rIdx + 1] = 0;
				myImageData.data[rIdx + 2] = 255;
				myImageData.data[rIdx + 3] = 255; // alpha
			}
			else if (imgLabel === this.cellHovered)
			{
				// cell region color
				let [r, g, b] = this.getCellColor(cell);
				myImageData.data[rIdx] = r;
				myImageData.data[rIdx + 1] = g;
				myImageData.data[rIdx + 2] = b;
				myImageData.data[rIdx + 3] = 200; // alpha
			}
		}
		this.canvasContext.putImageData(myImageData, 0, 0);
		let tooltipContent: string = this.getTooltipContent(segmentId, cell, index);
		this.tooltip.Show(tooltipContent, pageX, pageY);
	}

	public  getTilePixelXYFromLabelIndex(tileStartIndex: number, labelIndex: number): [number, number]
	{
		let imgX = (labelIndex - tileStartIndex) % this.imageStackMetaData.tileWidth;
		let imgY = Math.floor((labelIndex - tileStartIndex) / this.imageStackMetaData.tileWidth);
		return [imgX, imgY];
	}

	public getLabelIndexFromBigImgPixelXY(x: number, y: number): number
	{
		x = Math.round(x);
		y = Math.round(y);

		let tileX = x % this.imageStackMetaData.tileWidth;
		let tileY = y % this.imageStackMetaData.tileHeight;
		let tileIndex = this.getTileIndexFromBigImgPixelXY(x, y);
		let labelIndex = tileIndex * (this.imageStackMetaData.tileWidth * this.imageStackMetaData.tileHeight);
		labelIndex += tileX + tileY * this.imageStackMetaData.tileWidth;
		return labelIndex;
	}

	public getTileIndexFromBigImgPixelXY(x: number, y: number): number
	{
		let colIndex = Math.floor(x / this.imageStackMetaData.tileWidth);
		let rowIndex = Math.floor(y / this.imageStackMetaData.tileHeight);
		return rowIndex * this.imageStackMetaData.numberOfColumns + colIndex;
	}

	private getTooltipContent(label: number, cell: PointND | null, index: number | null): string
	{
		let labelValuePairs: [string, string | null][] = [
			['Location', this.getCurrentLocationId().toString()],
			['Frame', this.getCurrentFrameId().toString()],
			['Segment', label.toString()]
		];
		let cellId = cell?.parent?.id;
		if (cellId)
		{
			labelValuePairs.push(['Cell', cellId]);
			labelValuePairs.push(['Row', index.toString()]);
		}
		else
		{
			labelValuePairs.push(['No cell linked', null])
		}
		return RichTooltip.createLabelValueListContent(labelValuePairs);
	}

	private getCell(label: number): [PointND, number] | [null, null]
	{
		return this.data.GetCellFromLabel(this.getCurrentLocationId(), this.getCurrentFrameId(), label);
	}

	public getCellColor(cell: PointND | null): [number, number, number]
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

	public changeSelectedImage(newIndex: number): void
	{
		this._selectedImgIndex = newIndex;
		this.drawUpdate();
	}

	private getImageInlineStyle(index: number, imageUrl: string, includeFallback = true,  scale: number = 1): string
	{
		const [top, left] = this.getTileTopLeft(index);
		let styleString: string =
			`
			background-position-x: ${-left * scale}px;
			background-position-y: ${-top * scale}px;
			width: ${this.imageStackMetaData.tileWidth * scale}px;
			height: ${this.imageStackMetaData.tileHeight * scale}px;
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

	public getTileTopLeft(index: number): [number, number]
	{
		const left: number = (index % this.imageStackMetaData.numberOfColumns) * this.imageStackMetaData.tileWidth;
		const top: number = Math.floor(index / this.imageStackMetaData.numberOfColumns) * this.imageStackMetaData.tileHeight;
		return [top, left];
	}

	public OnResize(newMaxHeight: number, imageTrackMaxHeight: number, newWidth: number): void
	{
		this._maxHeight = newMaxHeight;
		this.container.setAttribute('style',`max-height: ${this.maxHeight}px;`);
		this.imageTrackWidget.OnResize(newWidth, imageTrackMaxHeight);
	}

}