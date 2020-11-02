import * as d3 from 'd3';
import {HtmlSelection, SvgSelection} from '../devlib/DevlibTypes';
import { PointND } from '../DataModel/PointND';
import { ImageLocation } from '../DataModel/ImageLocation';
import { CurveList } from '../DataModel/CurveList';
import { RichTooltip } from '../Components/RichTooltip';
import { ImageStackMetaData } from '../types';
import { ImageTrackWidget } from './ImageTrackWidget';
import { CurveND } from '../DataModel/CurveND';
import { ImageLabels, ImageStackDataRequest, Row } from '../DataModel/ImageStackDataRequest';

export class ImageStackWidget {
	
	constructor(container: HTMLElement, imageTrackContainer: HTMLElement, maxHeight: number)
	{
		this._container = container;
		this._imageTrackWidget = new ImageTrackWidget(imageTrackContainer, this);
		this._maxHeight = maxHeight;
		this.init();
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

	public get numPixelsInTile() : number {
		return this.imageStackDataRequest?.tileWidth * this.imageStackDataRequest?.tileHeight;
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
	
	private _imageStackDataRequest : ImageStackDataRequest;
	public get imageStackDataRequest() : ImageStackDataRequest {
		return this._imageStackDataRequest;
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

	public SetData(data: CurveList, imageLocation: ImageLocation, imageStackDataRequest: ImageStackDataRequest): void
	{
		this._data = data;
		this._imageStackDataRequest = imageStackDataRequest;
		this._selectedImgIndex = 0;
		this._imageLocation = imageLocation;
		this.SetImageProperties(); // default values before image load
		this.draw();
	}

	public SetImageProperties(blob?: Blob, imageWidth?: number, imageHeight?: number, numColumns?: number, scaleFactor?: number): void
	{
		// default values for when loading, or if image isn't found
		if (!imageWidth)  { imageWidth  = 256; }
		if (!imageHeight) { imageHeight = 256; }
		if (!numColumns)  { numColumns  = 10; }
		this._imageStackBlob = blob;
		this.draw();
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
		this.setImageInlineStyle(this.selectedImgIndex);
		// this.selectedImageContainer.attr("style", styleString);
		this.updateCanvas(skipImageTrackDraw);
	}

	private updateLocationFrameLabel(): void
	{
		this.locationLabel.text(this.getCurrentLocationId());
		this.frameLabel.text(this.getCurrentFrameId());
	}

	public getCurrentLocationId(): number
	{
		return this.imageLocation.locationId;
	}

	public getCurrentFrameId(): number
	{
		return this.selectedImgIndex + 1;
		// return this.imageLocation.frameList[this.selectedImgIndex].frameId;
	}

	private updateCanvas(skipImageTrackDraw = false): void
	{
		if (!this.imageStackDataRequest)
		{
			return;
		}
		this.selectedImageCanvas
			.attr('width', this.imageStackDataRequest?.tileWidth)
			.attr('height', this.imageStackDataRequest?.tileHeight);

		this.imageStackDataRequest?.getLabel(this.getCurrentLocationId(), this.selectedImgIndex,
			(data: ImageLabels, firstIndex: number) =>
			{
				this.createOutlineImage(data, firstIndex);
				this.drawDefaultCanvas();
			});

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

	private createOutlineImage(rowArray: ImageLabels, firstIndex: number): void
	{
		if (!this.imageStackDataRequest)
		{
			return;
		}
		let myImageData = this.canvasContext.createImageData(this.imageStackDataRequest.tileWidth, this.imageStackDataRequest.tileHeight);

		for (let rowIdx = firstIndex; rowIdx < firstIndex + this.imageStackDataRequest.tileHeight; rowIdx++)
		{
			let row: Row = rowArray.rowList[rowIdx];
			for (let labelRun of row.row)
			{
				for (let colIdx = labelRun.start; colIdx < labelRun.start + labelRun.length; colIdx++)
				{
					if (this.isBorder(labelRun.label, rowIdx, colIdx, rowArray))
					{

						let flatIdx = (rowIdx - firstIndex) * this.imageStackDataRequest.tileWidth + colIdx;
						flatIdx *= 4;
						let [cell, _index] = this.getCell(labelRun.label)
						let [r, g, b] = this.getCellColor(cell);
						myImageData.data[flatIdx] = r;
						myImageData.data[flatIdx + 1] = g;
						myImageData.data[flatIdx + 2] = b;
						myImageData.data[flatIdx + 3] = 255;
					}
				}
			}
		}

		this._defaultCanvasState = myImageData;
	}

	private drawDefaultCanvas(): void
	{
		this.canvasContext.putImageData(this.defaultCanvasState, 0, 0);
	}

	public isBorder(label: number, rowIdx: number, colIdx: number, rowArray: ImageLabels): boolean
	{
		let neighborIndices: [number, number][] = [];
		// 4-neighbor
		neighborIndices.push([rowIdx - 1, colIdx]);
		neighborIndices.push([rowIdx + 1, colIdx]);
		neighborIndices.push([rowIdx, colIdx - 1]);
		neighborIndices.push([rowIdx, colIdx + 1]);
		// 8-neighbor
		neighborIndices.push([rowIdx - 1, colIdx - 1]);
		neighborIndices.push([rowIdx + 1, colIdx - 1]);
		neighborIndices.push([rowIdx + 1, colIdx - 1]);
		neighborIndices.push([rowIdx - 1, colIdx + 1]);
		// 12-neighbor
		neighborIndices.push([rowIdx - 2, colIdx]);
		neighborIndices.push([rowIdx + 2, colIdx]);
		neighborIndices.push([rowIdx, colIdx - 2]);
		neighborIndices.push([rowIdx, colIdx + 2]);


		for (let [rI, cI] of neighborIndices)
		{
			if (rI < 0
				|| rI >= rowArray.rowList.length
				|| cI < 0
				|| cI >= this.imageStackDataRequest.tileWidth)
			{
				// neighbor out of bounds of tile
				continue;
			}
			let nVal = ImageStackDataRequest.getLabelValue(rI, cI, rowArray);
			if (nVal !== label)
			{
				return true
			}
		}
		return false;
	}

	private onCanvasMouseMove(e: MouseEvent): void
	{
		if (!this.imageStackDataRequest || !this.defaultCanvasState)
		{
			return;
		}
		this.imageStackDataRequest.getLabel(this.getCurrentLocationId(), this.selectedImgIndex,
			(rowArray: ImageLabels, firstIndex: number) =>
			{
				const rowIdx = e.offsetY + firstIndex;
				const colIdx = e.offsetX;
				const label = ImageStackDataRequest.getLabelValue(rowIdx, colIdx, rowArray);
				if (label === this.cellHovered)
				{
					return;
				}
				this._cellHovered = label;
				if (label === 0)
				{
					this.drawDefaultCanvas();
					this.tooltip.Hide();
					const customEvent = new CustomEvent('frameHoverChange', { detail:
						{
							locationId: this.getCurrentLocationId(),
							frameId: this.getCurrentFrameId(),
							cellId: null
						}});
					document.dispatchEvent(customEvent);
				}
				else
				{
					this.showSegmentHover(rowArray, label, firstIndex, false, e);
				}
			});
	}

	public hideSegmentHover(hideTooltipImmediately: boolean = false): void
	{
		this.drawDefaultCanvas();
		let delayOverride: number;
		if (hideTooltipImmediately)
		{
			delayOverride = 0;
		}
		this.tooltip.Hide(delayOverride);
	}

	public showSegmentHover(rowArray: ImageLabels, segmentId: number, firstIndex: number, showTooltipImmediately: boolean = false, event?: MouseEvent): void
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

			const customEvent = new CustomEvent('frameHoverChange', { detail:
				{
					locationId: this.getCurrentLocationId(),
					frameId: this.getCurrentFrameId(),
					cellId: cell.parent.id
				}});
			document.dispatchEvent(customEvent);
		}
		else if (event)
		{
			pageX = event.pageX;
			pageY = event.pageY;
		}

		let myImageData = this.canvasContext.createImageData(this.imageStackDataRequest?.tileWidth, this.imageStackDataRequest?.tileHeight);
		myImageData.data.set(this.defaultCanvasState.data);
		for (let rowIdx = firstIndex; rowIdx < firstIndex + this.imageStackDataRequest.tileHeight; rowIdx++)
		{
			let row: Row = rowArray.rowList[rowIdx];
			for (let labelRun of row.row)
			{
				if (labelRun.label === this.cellHovered)
				{
					for (let colIdx = labelRun.start; colIdx < labelRun.start + labelRun.length; colIdx++)
					{
							let flatIdx = (rowIdx - firstIndex) * this.imageStackDataRequest.tileWidth + colIdx;
							flatIdx *= 4;
							let [cell, _index] = this.getCell(labelRun.label)
							let [r, g, b] = this.getCellColor(cell);
							myImageData.data[flatIdx] = r;
							myImageData.data[flatIdx + 1] = g;
							myImageData.data[flatIdx + 2] = b;
							myImageData.data[flatIdx + 3] = 200;
					}
				}

			}
		}

		this.canvasContext.putImageData(myImageData, 0, 0);
		if (cell)
		{
			this.canvasContext.beginPath();
			this.canvasContext.arc(cellX, cellY, 5, 0, 2 * Math.PI);
			this.canvasContext.strokeStyle = 'black';
			this.canvasContext.stroke();
			this.canvasContext.fillStyle = '#FF00FF';
			this.canvasContext.fill();
		}

		let tooltipContent: string = this.getTooltipContent(segmentId, cell, index);
		let delayOverride: number;
		if (showTooltipImmediately)
		{
			delayOverride = 0;
		}
		this.tooltip.Show(tooltipContent, pageX, pageY, delayOverride);
	}

	public getLabelIndexFromBigImgPixelXY(frameIndex: number, x: number, y: number): [number, number]
	{
		x = Math.round(x);
		y = Math.round(y);

		let colIdx = x % this.imageStackDataRequest?.tileWidth;
		let rowIdx = (y % this.imageStackDataRequest?.tileHeight) + (frameIndex % this.imageStackDataRequest?.tilesPerFile) * this.imageStackDataRequest?.tileHeight;

		return [rowIdx, colIdx];
	}

	public getTileIndexFromBigImgPixelXY(x: number, y: number): number
	{
		let colIndex = Math.floor(x / this.imageStackDataRequest?.tileWidth);
		let rowIndex = Math.floor(y / this.imageStackDataRequest?.tileHeight);
		return rowIndex * this.imageStackDataRequest?.numberOfColumns + colIndex;
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

	private setImageInlineStyle(index: number, includeFallback = true): void
	{
		this.imageStackDataRequest?.getImage(this.getCurrentLocationId(), index,
			(top, left, _blob, imageUrl) =>
			{
				let styleString: string =
					`
					background-position-x: ${-left}px;
					background-position-y: ${-top}px;
					width: ${this.imageStackDataRequest?.tileWidth}px;
					height: ${this.imageStackDataRequest?.tileHeight}px;
					`;
				if (imageUrl)
				{
					styleString += `background-image: url(${imageUrl});`;
				}
		
				if (includeFallback)
				{
					styleString += 'background-color: #ebebeb;';
				}
				this.selectedImageContainer.attr("style", styleString);
			});
	}

	private updateBackgroundPosition(index: number)
	{
		this.setImageInlineStyle(index);
		return;
		const [top, left] = this.imageStackDataRequest?.getTileTopLeft(index);
		this.selectedImageContainer.node().style.backgroundPositionX =  -left + 'px';
		this.selectedImageContainer.node().style.backgroundPositionY = -top + 'px';
	}
	
	public OnResize(newMaxHeight: number, imageTrackMaxHeight: number, newWidth: number): void
	{
		this._maxHeight = newMaxHeight;
		this.container.setAttribute('style',`max-height: ${this.maxHeight}px;`);
		this.imageTrackWidget.OnResize(newWidth, imageTrackMaxHeight);
	}

}