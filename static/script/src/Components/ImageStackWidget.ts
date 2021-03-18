import * as d3 from 'd3';
import * as quickSelect from 'quickselect.js';
import { HtmlSelection } from '../devlib/DevlibTypes';
import { PointND } from '../DataModel/PointND';
import { ImageLocation } from '../DataModel/ImageLocation';
import { CurveList } from '../DataModel/CurveList';
import { RichTooltip } from '../Components/RichTooltip';
import { ImageTrackWidget } from './ImageTrackWidget';
import { CurveND } from '../DataModel/CurveND';
import { ImageLabels, ImageStackDataRequest, Row } from '../DataModel/ImageStackDataRequest';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { Facet } from '../types';

export class ImageStackWidget {

	constructor(
		container: HTMLElement,
		imageTrackContainer: HTMLElement,
		maxHeight: number,
		samplingStratOptions: {"strat": (number[] | number), "label": string}[])
	{
		this._container = container;
		this._imageTrackWidget = new ImageTrackWidget(imageTrackContainer, this, samplingStratOptions);
		this._maxHeight = maxHeight;
		this.init();
		this._cellHovered = 0;
		this._selectedImgIndex = 0;
		console.log(d3);
		console.log(this);
		this._tooltip = new RichTooltip();
		this._exemplarAttribute = 'Avg Mass'; // TODO change default
		this._inExemplarMode = true;
		this._inCondensedMode = true;
		this._condensedModeCount = 7;
		this._exemplarLocations = new Set();
		this._exemplarFrames = new Map();
		this._facetList = [];
		this._manuallyPinnedTracks = [];
		this.setNumExemplars();
	}

	private setNumExemplars(): void
	{
		const currentStrat = this.imageTrackWidget.currentSamplingStategy.strat;
		if (Array.isArray(currentStrat))
		{
			this._numExemplars = currentStrat.length;
		}
		else
		{
			this._numExemplars = currentStrat;
		}
	}

	private _container: HTMLElement;
	public get container(): HTMLElement {
		return this._container;
	}

	private _imageTrackWidget: ImageTrackWidget;
	public get imageTrackWidget(): ImageTrackWidget {
		return this._imageTrackWidget;
	}

	private _maxHeight: number;
	public get maxHeight(): number {
		return this._maxHeight;
	}

	private _imageLocation: ImageLocation;
	public get imageLocation(): ImageLocation {
		return this._imageLocation;
	}

	private _imageStackBlob: Blob;
	public get imageStackBlob(): Blob {
		return this._imageStackBlob;
	}

	public get numPixelsInTile(): number {
		return this.imageStackDataRequest?.tileWidth * this.imageStackDataRequest?.tileHeight;
	}

	public get firstIndex(): number {
		return this.numPixelsInTile * this.selectedImgIndex;
	}

	private _imageStackLabelUrl: string;
	public get imageStackLabelUrl(): string {
		return this._imageStackLabelUrl;
	}

	private _imageStackWidth: number;
	public get imageStackWidth(): number {
		return this._imageStackWidth;
	}

	private _imageStackHeight: number;
	public get imageStackHeight(): number {
		return this._imageStackHeight;
	}

	private _selectedImgIndex: number;
	public get selectedImgIndex(): number {
		return this._selectedImgIndex;
	}

	private _innerContainer: HtmlSelection;
	public get innerContainer(): HtmlSelection {
		return this._innerContainer;
	}

	private _locationLabel: HtmlSelection;
	public get locationLabel(): HtmlSelection {
		return this._locationLabel;
	}

	private _frameLabel: HtmlSelection;
	public get frameLabel(): HtmlSelection {
		return this._frameLabel;
	}
	
	private _toggleOptionsContainer : HtmlSelection;
	public get toggleOptionsContainer() : HtmlSelection {
		return this._toggleOptionsContainer;
	}
	
	private _showOutlineToggle : HtmlSelection;
	public get showOutlineToggle() : HtmlSelection {
		return this._showOutlineToggle;
	}

	private _invertImageToggle : HtmlSelection;
	public get invertImageToggle() : HtmlSelection {
		return this._invertImageToggle;
	}
	
	private _selectedImageContainer: HtmlSelection;
	public get selectedImageContainer(): HtmlSelection {
		return this._selectedImageContainer;
	}

	private _selectedImageCanvas: HtmlSelection;
	public get selectedImageCanvas(): HtmlSelection {
		return this._selectedImageCanvas;
	}

	private _canvasContext: CanvasRenderingContext2D;
	public get canvasContext(): CanvasRenderingContext2D {
		return this._canvasContext;
	}

	private _data: CurveList;
	public get data(): CurveList {
		return this._data;
	}

	private _fullData: CurveList;
	public get fullData(): CurveList {
		return this._fullData;
	}

	private _imageStackDataRequest: ImageStackDataRequest;
	public get imageStackDataRequest(): ImageStackDataRequest {
		return this._imageStackDataRequest;
	}

	private _defaultCanvasState: ImageData;
	public get defaultCanvasState(): ImageData {
		return this._defaultCanvasState;
	}

	private _cellHovered: number;
	public get cellHovered(): number {
		return this._cellHovered;
	}

	private _tooltip: RichTooltip;
	public get tooltip(): RichTooltip {
		return this._tooltip;
	}

	private _exemplarAttribute: string;
	public get exemplarAttribute(): string {
		return this._exemplarAttribute;
	}

	private _inExemplarMode: boolean;
	public get inExemplarMode(): boolean {
		return this._inExemplarMode;
	}

	private _inCondensedMode: boolean;
	public get inCondensedMode(): boolean {
		return this._inCondensedMode;
	}

	private _condensedModeCount: number;
	public get condensedModeCount(): number {
		return this._condensedModeCount;
	}

	private _exemplarLocations: Set<number>;
	public get exemplarLocations(): Set<number> {
		return this._exemplarLocations;
	}

	private _exemplarFrames: Map<number, Set<number>>;
	public get exemplarFrames(): Map<number, Set<number>> {
		return this._exemplarFrames;
	}

	private _facetList: Facet[];
	public get facetList(): Facet[] {
		return this._facetList;
	}

	private _colorLookup : Map<string, string>;
	public get colorLookup() : Map<string, string> {
		return this._colorLookup;
	}

	private _numExemplars: number;
	public get numExemplars(): number {
		return this._numExemplars;
	}

	private _manuallyPinnedTracks : CurveND[];
	public get manuallyPinnedTracks() : CurveND[] {
		return this._manuallyPinnedTracks;
	}	

	public init(): void {
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

		this._toggleOptionsContainer = this.innerContainer.append('div')
			.classed('toggleOptions', true)
			.classed('smallText', true);

		const outlineId = 'imageToggle-outlines';
		this._showOutlineToggle = this.toggleOptionsContainer.append('input')
			.attr('type', 'checkbox')
			.on('change', () => 
			{
				let node = document.getElementById(outlineId) as HTMLInputElement;
				this.updateCanvas();
			})
			.attr('id', outlineId);
		this.toggleOptionsContainer.append('label')
			.attr('for', outlineId)
			.text('Show Outlines');

		(this.showOutlineToggle.node() as HTMLInputElement).checked = true;
		
		const invertId = 'imageToggle-invert';
		this._invertImageToggle = this.toggleOptionsContainer.append('input')
			.attr('type', 'checkbox')
			.on('change', () =>
			{
				let node = document.getElementById(invertId) as HTMLInputElement;
				this.selectedImageContainer.classed('invert', node.checked);
				this.selectedImageCanvas.classed('invert', node.checked);
				this.updateCanvas();
			})
			.attr('id', invertId);
		this.toggleOptionsContainer.append('label')
			.attr('for', invertId)
			.text('Invert');

		this._selectedImageContainer = this.innerContainer.append('div')
			.classed('noShrink', true);

		this._selectedImageCanvas = this.selectedImageContainer.append('canvas')

		this.selectedImageCanvas.node().addEventListener('mousemove', (e: MouseEvent) => {
			this.onCanvasMouseMove(e)
		});

		this.selectedImageCanvas.node().addEventListener('click', (e: MouseEvent) => {
			this.onCanvasClick(e)
		});

		this._canvasContext = (this.selectedImageCanvas.node() as HTMLCanvasElement).getContext('2d');

		this.selectedImageContainer
			.on('mouseleave', () => {
				this.hideSegmentHover();
			});

		this.imageTrackWidget.init();

		document.addEventListener('samplingStrategyChange', (e: CustomEvent) => 
		{
			this.setNumExemplars();
			this.updateTracksCanvas();
		});

		document.addEventListener('launchExemplarCurve', (e: CustomEvent) => {
			this._exemplarAttribute = e.detail;

			let buttonChangeEvent = new CustomEvent('changeModeSelect', { detail: 0 });
			document.dispatchEvent(buttonChangeEvent);

			let modeChangeEvent = new CustomEvent('modeChange', {
				detail: {
					inCondensedMode: true,
					inExemplarMode: true
				}
			});
			document.dispatchEvent(modeChangeEvent);
		});

		document.addEventListener('modeChange', (e: CustomEvent) => {
			this._inExemplarMode = e.detail.inExemplarMode;
			this._inCondensedMode = e.detail.inCondensedMode;
			this.updateTracksCanvas();
			document.dispatchEvent(new CustomEvent('imageSelectionRedraw'));
			document.dispatchEvent(new CustomEvent('exemplarAttributeChange', { detail: this.inExemplarMode ? this.exemplarAttribute : null }));
		});

		document.addEventListener('groupByChanged', async (e: CustomEvent) => {
			let popupContainer = d3.select('#largePopupContainerOuter');
			if (!popupContainer.empty() && !popupContainer.classed('noDisp'))
			{
				return;
			}

			DevlibTSUtil.launchSpinner();
			await DevlibTSUtil.makeAsync(() => this._facetList = e.detail.flatFacetList);
			this._colorLookup = e.detail.colorLookup;
			this.updateTracksCanvas();
			document.dispatchEvent(new CustomEvent('imageSelectionRedraw'));

		});
	}

	public SetData(data: CurveList, fullData: CurveList, imageLocation: ImageLocation, imageStackDataRequest: ImageStackDataRequest, skipImageTrackDraw = false): void {
		this._data = data;
		this._fullData = fullData;
		this._imageStackDataRequest = imageStackDataRequest;
		this._selectedImgIndex = 0;
		this._imageLocation = imageLocation;
		this.SetImageProperties(skipImageTrackDraw); // default values before image load
		this.draw(skipImageTrackDraw);
		document.dispatchEvent(new CustomEvent('exemplarAttributeChange', { detail: this.inExemplarMode ? this.exemplarAttribute : null }));
	}

	public SetImageProperties(skipImageTrackDraw: boolean, blob?: Blob, imageWidth?: number, imageHeight?: number, numColumns?: number, scaleFactor?: number): void
	{
		// default values for when loading, or if image isn't found
		if (!imageWidth) { imageWidth = 256; }
		if (!imageHeight) { imageHeight = 256; }
		if (!numColumns) { numColumns = 10; }
		this._imageStackBlob = blob;
		this.draw(skipImageTrackDraw);
	}

	public draw(skipImageTrackDraw = false): void {
		this.drawSelectedImage(skipImageTrackDraw);
		this.updateLocationFrameLabel();
	}

	public OnBrushChange(): void {
		this.draw(true);
		this.imageTrackWidget.OnBrushChange();
	}

	public drawUpdate(): void {
		this.updateBackgroundPosition(this.selectedImgIndex);
		this.updateCanvas(this.inExemplarMode);
		this.updateLocationFrameLabel();
	}

	private drawSelectedImage(skipImageTrackDraw = false): void
	{
		this.setImageInlineStyle(this.selectedImgIndex);
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
	}

	private updateCanvas(skipImageTrackDraw = false): void
	{
		if (!this.imageStackDataRequest) {
			return;
		}
		this.selectedImageCanvas
			.attr('width', this.imageStackDataRequest?.tileWidth)
			.attr('height', this.imageStackDataRequest?.tileHeight);

		if ((this.showOutlineToggle.node() as HTMLInputElement).checked)
		{
			this.imageStackDataRequest?.getLabel(this.getCurrentLocationId(), this.selectedImgIndex,
				(data: ImageLabels, firstIndex: number) => {
					this.createOutlineImage(data, firstIndex);
					this.drawDefaultCanvas();
				});
		}
		else
		{
			this.clearCanvas();
		}
		this.drawPinnedCellMarkers();


		let locId = this.imageLocation.locationId;
		if (!skipImageTrackDraw) {
			this.updateTracksCanvas();
		}
	}

	private updateTracksCanvas(): void
	{
		let autoCurveList: CurveND[];
		if (this.inExemplarMode) {
			this.exemplarLocations.clear();
			this.exemplarFrames.clear();
			autoCurveList = this.getExemplarCurves();
			for (let curveList of [autoCurveList, this.manuallyPinnedTracks])
			{
				for (let curve of curveList)
				{
					const firstPoint = curve.pointList[0];
					const locId = firstPoint.get('Location ID')
					this.exemplarLocations.add(locId);
					if (!this.exemplarFrames.has(locId)) {
						this.exemplarFrames.set(locId, new Set());
					}
					let frameSet = this.exemplarFrames.get(locId);
					for (let i = 0; i < this.condensedModeCount; i++) {
						const point: PointND = this.imageTrackWidget.getPointInCondensedMode(curve, i);
						const frame: number = point.get('Frame ID');
						frameSet.add(frame);
					}
				}
			}
		}
		else {
			autoCurveList = this.getCurvesBasedOnPointsAtCurrentFrame();
			this.exemplarLocations.clear();
			this.exemplarFrames.clear();
		}
		this.imageTrackWidget.draw(autoCurveList, this.manuallyPinnedTracks);
	}

	private getExemplarCurves(): CurveND[]
	{
		let curveList: CurveND[] = [];
		const trackLengthKey = 'Track Length';
		for (let facet of this.facetList) {
			let facetData: CurveList = facet.data;
			let maxLength = facetData.curveCollection.getMinMax(trackLengthKey)[1];
			let longTracks = facetData.curveList.filter(x => x.get(trackLengthKey) > (maxLength / 2.0));
			let numCurves = longTracks.length;
			// const percentages = [0.05, 0.50, 0.95]; // todo make this more general
			const samplingStat = this.imageTrackWidget.currentSamplingStategy.strat;
			let percentages: number[];
			if (Array.isArray(samplingStat))
			{
				percentages = samplingStat;
			}
			else
			{
				percentages = [];
				for (let i = 0; i < samplingStat; i++)
				{
					percentages.push(Math.random());
				}
			}
			for (let p of percentages)
			{
				let index = Math.round((numCurves - 1) * p);
				let exemplarCurve = quickSelect(longTracks, index, (curve: CurveND) => curve.get(this.exemplarAttribute));
				curveList.push(exemplarCurve);
			}
		}

		return curveList
	}

	private getCurvesBasedOnPointsAtCurrentFrame(): CurveND[] {
		let curveList: CurveND[] = [];
		const pointsAtFrame = this.data.GetCellsAtFrame(this.getCurrentLocationId(), this.getCurrentFrameId())
		for (let point of pointsAtFrame) {
			curveList.push(point.parent);
		}
		return curveList
	}

	private createOutlineImage(rowArray: ImageLabels, firstIndex: number): void {
		if (!this.imageStackDataRequest) {
			return;
		}
		let myImageData = this.canvasContext.createImageData(this.imageStackDataRequest.tileWidth, this.imageStackDataRequest.tileHeight);

		for (let rowIdx = firstIndex; rowIdx < firstIndex + this.imageStackDataRequest.tileHeight; rowIdx++) {
			let row: Row = rowArray.rowList[rowIdx];
			for (let labelRun of row.row) {
				for (let colIdx = labelRun.start; colIdx < labelRun.start + labelRun.length; colIdx++) {
					if (this.isBorder(labelRun.label, rowIdx, colIdx, rowArray)) {

						let flatIdx = (rowIdx - firstIndex) * this.imageStackDataRequest.tileWidth + colIdx;
						flatIdx *= 4;
						let [cell, _index] = this.getCell(labelRun.label, this.data);
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

	private drawPinnedCellMarkers(): void
	{

		for (let track of this.manuallyPinnedTracks)
		{
			for (let point of track.pointList)
			{
				if (point.get('Location ID') !== this.getCurrentLocationId())
				{
					break;
				}
				if (point.get('Frame ID') === this.getCurrentFrameId())
				{
					this.drawCellCenter(point, 3);
				}
			}
		}
	}

	private clearCanvas(): void
	{
		this.canvasContext.clearRect(0, 0, this.imageStackWidth, this.imageStackHeight);
		this._defaultCanvasState = this.canvasContext.createImageData(this.imageStackDataRequest.tileWidth, this.imageStackDataRequest.tileHeight);
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


		for (let [rI, cI] of neighborIndices) {
			if (rI < 0
				|| rI >= rowArray.rowList.length
				|| cI < 0
				|| cI >= this.imageStackDataRequest.tileWidth) {
				// neighbor out of bounds of tile
				continue;
			}
			let nVal = ImageStackDataRequest.getLabelValue(rI, cI, rowArray);
			if (nVal !== label) {
				return true
			}
		}
		return false;
	}

	private onCanvasMouseMove(e: MouseEvent): void
	{
		if (!this.imageStackDataRequest || !this.defaultCanvasState) {
			return;
		}
		this.imageStackDataRequest.getLabel(this.getCurrentLocationId(), this.selectedImgIndex,
			(rowArray: ImageLabels, firstIndex: number) => {
				const rowIdx = e.offsetY + firstIndex;
				const colIdx = e.offsetX;
				const label = ImageStackDataRequest.getLabelValue(rowIdx, colIdx, rowArray);
				if (label === this.cellHovered) {
					return;
				}
				this._cellHovered = label;
				if (label === 0) {
					this.drawDefaultCanvas();
					this.drawPinnedCellMarkers();
					this.tooltip.Hide();
					const customEvent = new CustomEvent('frameHoverChange', {
						detail:
						{
							locationId: this.getCurrentLocationId(),
							frameId: this.getCurrentFrameId(),
							cellId: null
						}
					});
					document.dispatchEvent(customEvent);
				}
				else {
					this.showSegmentHover(rowArray, label, firstIndex, false, e);
				}
			});
	}

	private onCanvasClick(e: MouseEvent): void
	{
		if (!this.imageStackDataRequest || !this.defaultCanvasState) {
			return;
		}
		this.imageStackDataRequest.getLabel(this.getCurrentLocationId(), this.selectedImgIndex,
			(rowArray: ImageLabels, firstIndex: number) => {
				const rowIdx = e.offsetY + firstIndex;
				const colIdx = e.offsetX;
				const label = ImageStackDataRequest.getLabelValue(rowIdx, colIdx, rowArray);
				let [cell, _index] = this.getCell(label, this.fullData);
				if (cell)
				{
					const track = cell.parent;
					this.togglePin(track);
				}
			});
	}

	public togglePin(track: CurveND): void
	{
		if (this.manuallyPinnedTracks.includes(track))
		{
			const index = this.manuallyPinnedTracks.indexOf(track);
			this.manuallyPinnedTracks.splice(index, 1);
		}
		else
		{
			this.manuallyPinnedTracks.unshift(track);
		}
		this.updateCanvas();
		const manualPinToggleEvent = new CustomEvent('manualPinToggle', {detail: this.manuallyPinnedTracks});
		document.dispatchEvent(manualPinToggleEvent);
	}

	public hideSegmentHover(hideTooltipImmediately: boolean = false): void {
		this.drawDefaultCanvas();
		this.drawPinnedCellMarkers();
		let delayOverride: number;
		if (hideTooltipImmediately) {
			delayOverride = 0;
		}
		this.tooltip.Hide(delayOverride);
	}

	public showSegmentHover(rowArray: ImageLabels, segmentId: number, firstIndex: number, showTooltipImmediately: boolean = false, event?: MouseEvent): void {
		this._cellHovered = segmentId;
		let [cell, index] = this.getCell(segmentId, this.fullData);

		let cellX = 0;
		let cellY = 0;
		let pageX = 0;
		let pageY = 0;
		if (cell) {
			let canvasBoundRect = this.selectedImageCanvas.node().getBoundingClientRect();
			cellX = (cell.get('X') + cell.get('xShift')) / this.imageStackDataRequest.scaleFactor;
			cellY = (cell.get('Y') + cell.get('yShift')) / this.imageStackDataRequest.scaleFactor;
			pageX = canvasBoundRect.x + cellX;
			pageY = canvasBoundRect.y + cellY;

			const customEvent = new CustomEvent('frameHoverChange', {
				detail:
				{
					locationId: this.getCurrentLocationId(),
					frameId: this.getCurrentFrameId(),
					cellId: cell.parent.id
				}
			});
			document.dispatchEvent(customEvent);
		}
		else if (event) {
			pageX = event.pageX;
			pageY = event.pageY;
		}

		let myImageData = this.canvasContext.createImageData(this.imageStackDataRequest?.tileWidth, this.imageStackDataRequest?.tileHeight);
		myImageData.data.set(this.defaultCanvasState.data);
		for (let rowIdx = firstIndex; rowIdx < firstIndex + this.imageStackDataRequest.tileHeight; rowIdx++) {
			let row: Row = rowArray.rowList[rowIdx];
			for (let labelRun of row.row) {
				if (labelRun.label === this.cellHovered) {
					for (let colIdx = labelRun.start; colIdx < labelRun.start + labelRun.length; colIdx++) {
						let flatIdx = (rowIdx - firstIndex) * this.imageStackDataRequest.tileWidth + colIdx;
						flatIdx *= 4;
						let [cell, _index] = this.getCell(labelRun.label, this.data);
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
		this.drawPinnedCellMarkers();
		this.drawCellCenter(cell, 5);

		let tooltipContent: string = this.getTooltipContent(segmentId, cell, index);
		let delayOverride: number;
		if (showTooltipImmediately) {
			delayOverride = 0;
		}
		this.tooltip.Show(tooltipContent, pageX, pageY, delayOverride);
	}

	private drawCellCenter(cell: PointND, radius: number): void
	{
		if (cell)
		{
			let cellX = (cell.get('X') + cell.get('xShift')) / this.imageStackDataRequest.scaleFactor;
			let cellY = (cell.get('Y') + cell.get('yShift')) / this.imageStackDataRequest.scaleFactor;
			this.canvasContext.beginPath();
			this.canvasContext.arc(cellX, cellY, radius, 0, 2 * Math.PI);
			this.canvasContext.strokeStyle = 'black';
			this.canvasContext.stroke();
			this.canvasContext.fillStyle = '#FF00FF';
			this.canvasContext.fill();
		}
	}

	public getLabelIndexFromBigImgPixelXY(frameIndex: number, x: number, y: number): [number, number] {
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

	private getTooltipContent(label: number, cell: PointND | null, index: number | null): string {
		let labelValuePairs: [string, string | null][] = []
		let cellId = cell?.parent?.id;
		if (cellId)
		{
			for (let key of ['Mass (pg)', 'X', 'Y', 'Area'])
			{
				let value = cell.get(key);
				if (typeof value !== 'undefined')
				{
					labelValuePairs.push([key, value.toPrecision(6)]);
				}
			}
			labelValuePairs.push(['Mean Phase Shift', 'need equation']);
			labelValuePairs.push(['Row', index.toString()]);
			labelValuePairs.push(['Segment', label.toString()]);
		}
		else
		{
			labelValuePairs.push(['Segment', label.toString()]);
			labelValuePairs.push(['No cell linked', null])
		}
		return RichTooltip.createLabelValueListContent(labelValuePairs);
	}

	public getCell(label: number, dataSource: CurveList): [PointND, number] | [null, null]
	{
		return dataSource.GetCellFromLabel(this.getCurrentLocationId(), this.getCurrentFrameId(), label);
	}

	public getCellColor(cell: PointND | null): [number, number, number]
	{
		let color: [number, number, number] = [0, 0, 0];
		if (!cell) {
			// nuted/darkened from SpringGreen
			color = [119, 140, 77];
		}
		else if (cell.inBrush) {
			// FireBrick
			color = [178, 34, 34];
		}
		else {
			// SteelBlue
			color = [70, 130, 180];
		}
		return color
	}

	public changeSelectedImage(newIndex: number): void {
		this._selectedImgIndex = newIndex;
		this.drawUpdate();
	}

	private setImageInlineStyle(index: number, includeFallback = true): void {
		this.imageStackDataRequest?.getImage(this.getCurrentLocationId(), index,
			(top, left, _blob, imageUrl) => {
				let styleString: string =
					`
					background-position-x: ${-left}px;
					background-position-y: ${-top}px;
					width: ${this.imageStackDataRequest?.tileWidth}px;
					height: ${this.imageStackDataRequest?.tileHeight}px;
					`;
				if (imageUrl) {
					styleString += `background-image: url(${imageUrl});`;
				}

				if (includeFallback) {
					styleString += 'background-color: #ebebeb;';
				}
				this.selectedImageContainer.attr("style", styleString);
			});
	}

	private updateBackgroundPosition(index: number) {
		this.setImageInlineStyle(index);
		return;
	}

	public OnResize(newMaxHeight: number, imageTrackMaxHeight: number, newWidth: number): void {
		this._maxHeight = newMaxHeight;
		this.container.setAttribute('style', `max-height: ${this.maxHeight}px;`);
		this.imageTrackWidget.OnResize(newWidth, imageTrackMaxHeight);
	}

}