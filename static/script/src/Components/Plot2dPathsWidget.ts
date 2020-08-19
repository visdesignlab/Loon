import * as d3 from 'd3';
import {BaseWidget} from './BaseWidget';
import {CurveList} from '../DataModel/CurveList';
import {PointND} from '../DataModel/PointND';
import {SvgSelection, HtmlSelection, ButtonProps} from '../devlib/DevLibTypes';
import { valueFilter } from '../DataModel/PointCollection';
import { OptionSelect } from './OptionSelect';
import { DatasetSpec } from '../types';
import { thresholdFreedmanDiaconis } from 'd3';

interface quickPickOption {
	xKey: string,
	yKey: string,
	squareAspectRatio: boolean
}

export class Plot2dPathsWidget extends BaseWidget<CurveList, DatasetSpec> {
	
	constructor(container: Element, quickPickOptions: quickPickOption[], initialQuickPickOptionIndex: number = 0, squareAspectRatio: boolean = true, canBrush: boolean = true)
	{
		super(container, true, quickPickOptions, initialQuickPickOptionIndex, canBrush);
		this._squareAspectRatio = squareAspectRatio;
		this.addLabel();
	}
	
	protected Clone(container: HTMLElement): BaseWidget<CurveList, DatasetSpec>
    {
		const canBrush = false;
		return new Plot2dPathsWidget(container, this.quickPickOptions, this.quickPickOptionSelect.currentSelectionIndex, this.squareAspectRatio, canBrush);
	}

	protected initProps(props?: any[]): void
	{
		super.initProps();
		this._quickPickOptions = props[0];
		this._initialQuickPickOptionIndex = props[1];
		this._canBrush = props[2];
		this._xKey = this.quickPickOptions[this.initialQuickPickOptionIndex].xKey;
		this._yKey = this.quickPickOptions[this.initialQuickPickOptionIndex].yKey;
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
	}
	
	private _canvasElement : HTMLCanvasElement;
	public get canvasElement() : HTMLCanvasElement {
		return this._canvasElement;
	}

	private _canBrush : boolean;
	public get canBrush() : boolean {
		return this._canBrush;
	}

	private _brushGroupSelect : SvgSelection;
	public get brushGroupSelect() : SvgSelection {
		return this._brushGroupSelect;
	}

	private _xAxisGroupSelect : SvgSelection;
	public get xAxisGroupSelect() : SvgSelection {
		return this._xAxisGroupSelect;
	}

	private _xLabelTextSelect : SvgSelection;
	public get xLabelTextSelect() : SvgSelection {
		return this._xLabelTextSelect;
	}

	private _yAxisGroupSelect : SvgSelection;
	public get yAxisGroupSelect() : SvgSelection {
		return this._yAxisGroupSelect;
	}

	private _yLabelTextSelect : SvgSelection;
	public get yLabelTextSelect() : SvgSelection {
		return this._yLabelTextSelect;
	}

	private _quickPickContainerSelect : HtmlSelection;
	public get quickPickContainerSelect() : HtmlSelection {
		return this._quickPickContainerSelect;
	}
	public set quickPickContainerSelect(v : HtmlSelection) {
		this._quickPickContainerSelect = v;
	}

	private _scaleX : d3.ScaleLinear<number, number>;
	public get scaleX() : d3.ScaleLinear<number, number> {
		return this._scaleX;
	}

	private _scaleY : d3.ScaleLinear<number, number>;
	public get scaleY() : d3.ScaleLinear<number, number> {
		return this._scaleY;
	}

	private _xKey : string;
	public get xKey() : string {
		return this._xKey;
	}

	private _yKey : string;
	public get yKey() : string {
		return this._yKey;
	}

	private _quickPickOptions : quickPickOption[];
	public get quickPickOptions() : quickPickOption[] {
		return this._quickPickOptions;
	}	

	private _initialQuickPickOptionIndex : number;
	public get initialQuickPickOptionIndex() : number {
		return this._initialQuickPickOptionIndex;
	}
	
	private _quickPickOptionSelect : OptionSelect;
	public get quickPickOptionSelect() : OptionSelect {
		return this._quickPickOptionSelect;
	}

	private _squareAspectRatio : boolean;
	public get squareAspectRatio() : boolean {
		return this._squareAspectRatio;
	}

	private _brush : d3.BrushBehavior<any>;
	public get brush() : d3.BrushBehavior<any> {
		return this._brush;
	}
	
	private _lastXValueBrushBound : [number, number];
	public get lastXValueBrushBound() : [number, number] {
		return this._lastXValueBrushBound;
	}

	private _lastYValueBrushBound : [number, number];
	public get lastYValueBrushBound() : [number, number] {
		return this._lastYValueBrushBound;
	}
	

	protected setMargin(): void
	{
		this._margin = {
			top: 20,
			right: 8,
			bottom: 42,
			left: 64
		}
	}

	protected init(): void
	{
		const containerSelect = d3.select(this.container);
		containerSelect
			.on('mouseenter', () =>
			{
				if (this.data)
				{
					this.showQuickPickContainer();
				}
			})
			.on('mouseleave', () =>
			{
				this.hideQuickPickContainer();
			})
		this._svgSelect = containerSelect.append("svg")
		this._mainGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

		this._canvasElement = this.mainGroupSelect
			.append('foreignObject')
				.attr('width', this.vizWidth)
				.attr('height', this.vizHeight)
			.append('xhtml:canvas')
				.attr('width', this.vizWidth)
				.attr('height', this.vizHeight)
			.node() as HTMLCanvasElement;

		if (this.canBrush)
		{
			this._brushGroupSelect = this.svgSelect.append("g")
				.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
				.classed("brushContainer", true);
			this.initBrush();
		}

		// this.svgSelect.attr("style", 'width: 100%; height: 100%;');
		this.svgSelect.attr('width', this.width);
		this.svgSelect.attr('height', this.height);

		this._xAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight})`)
			.classed("labelColor", true);

		this._yAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.classed("labelColor", true);

		this.initQuickPickOptions();
	}

	private initQuickPickOptions(): void
	{
		const containerId = this.ComponentId + '-quickPickContainer';
		this._quickPickContainerSelect = d3.select(this.container).append('div')
			.classed('quickPickContainer', true)
			.attr('id', containerId);

		this._quickPickOptionSelect = new OptionSelect(containerId, "Option");
		let buttonPropList: ButtonProps[] = [];
		for (let quickPickOption of this.quickPickOptions)
		{
			let buttonProp: ButtonProps = {
				displayName: quickPickOption.yKey + " v. " + quickPickOption.xKey,
				callback: () => this.changeAxes(quickPickOption.xKey, quickPickOption.yKey, quickPickOption.squareAspectRatio)
			}
			buttonPropList.push(buttonProp);
		}
		this.hideQuickPickContainer();
		this.quickPickOptionSelect.onDataChange(buttonPropList, this.initialQuickPickOptionIndex);
	}

	private initBrush(): void
	{
		this._brush = d3.brush()
		.extent([[0, 0], [this.vizWidth, this.vizHeight]])
		.on("end", () => { this.brushHandler() });

		this.brushGroupSelect.call(this.brush);
	}

	private addLabel(): void
	{
		this._xLabelTextSelect = this.svgSelect.append('text')
			.classed('axisLabel', true)
			.classed('labelColor', true)
			.classed('noDisp', true);

		this._yLabelTextSelect = this.svgSelect.append('text')
			.classed('axisLabel', true)
			.classed('labelColor', true)
			.classed('noDisp', true);

		this.positionLabels();
	}

	private positionLabels(): void
	{
		// X-Axis
		let bufferForAxis = 32;
		this.xLabelTextSelect
			.attr('transform', `translate(${this.margin.left + this.vizWidth / 2}, ${this.margin.top + this.vizHeight + bufferForAxis})`);

		bufferForAxis = 40;
		// Y-Axis
		let transX = this.margin.left - bufferForAxis;
		let transY = this.margin.top + this.vizHeight / 2;
		let transformText: string;
		transformText = `rotate(-90) translate(${-transY}, ${transX})`;
		this.yLabelTextSelect.attr('transform', transformText);
	}

	private showQuickPickContainer(): void
	{
		this.quickPickContainerSelect.classed('noDisp', false);
	}

	private hideQuickPickContainer(): void
	{
		this.quickPickContainerSelect.classed('noDisp', true);
	}

	public OnDataChange(): void
	{
		this.updateScales();
		this.updatePaths();
		this.drawAxis();
        this.showLabel();
	}

	private changeAxes(xKey: string, yKey: string, squareAspectRatio: boolean): void
	{
		this._xKey = xKey;
		this._yKey = yKey;
		this._squareAspectRatio = squareAspectRatio;
		this.removeBrush();
		this.OnDataChange();
	}
	
	private removeBrush(): void
	{
		this.brushGroupSelect.call(this.brush.move, null);
	}

	private updateScales(): void
	{
		let [minX, maxX] = this.fullData.minMaxMap.get(this.xKey);
		let [minY, maxY] = this.fullData.minMaxMap.get(this.yKey);
		if (this.squareAspectRatio)
		{
			this.makeSquareAspectRatioScales(minX, maxX, minY, maxY);
		}
		else
		{
			this.makeStretchedAspectRatioScales(minX, maxX, minY, maxY);
		}

	
	}

	private makeSquareAspectRatioScales(minX: number, maxX: number, minY: number, maxY: number): void
	{
		// this code keeps the data aspect ratio square and keeps it centered and as large
		// as possible in it's container
		let containerRatio = this.vizHeight / this.vizWidth;
		let dataRatio = (maxY - minY) / (maxX - minX);
		if (containerRatio > dataRatio)
		{
			this._scaleX = d3.scaleLinear()
				.domain([minX, maxX])
				.range([0, this.vizWidth]);

			let [scaledMinY, scaledMaxY] = [this.scaleX(minY), this.scaleX(maxY)]; 
			let dataLength = scaledMaxY - scaledMinY;
			let offset = (this.vizHeight - dataLength) / 2.0 - scaledMinY;

			this._scaleY = d3.scaleLinear()
				.domain([minY, maxY])
				.range([scaledMaxY + offset, scaledMinY + offset]);
		}
		else
		{
			this._scaleY = d3.scaleLinear()
				.domain([minY, maxY])
				.range([this.vizHeight, 0]);


			let [scaledMinX, scaledMaxX] = [this.scaleY(minX), this.scaleY(maxX)]; 
			let dataLength = scaledMaxX - scaledMinX;
			let offset = (this.vizWidth - dataLength) / 2.0 - scaledMinX;

			this._scaleX = d3.scaleLinear()
				.domain([minX, maxX])
				.range([scaledMaxX + offset, scaledMinX + offset]);
		}
	}

	private makeStretchedAspectRatioScales(minX: number, maxX: number, minY: number, maxY: number): void
	{
		this._scaleX = d3.scaleLinear()
			.domain([minX, maxX])
			.range([0, this.vizWidth]);

		this._scaleY = d3.scaleLinear()
			.domain([minY, maxY])
			.range([this.vizHeight, 0]);
	}

	private updatePaths(): void
	{
		let line = d3.line<PointND>()
			.x((d, i) => { return this.scaleX(d.get(this.xKey)) })
			.y((d) => { return this.scaleY(d.get(this.yKey)) })
			.defined(d => d.inBrush);
		
		const canvasContext = this.canvasElement.getContext('2d');
		canvasContext.clearRect(0,0, this.vizWidth, this.vizHeight);
		canvasContext.strokeStyle = 'black';
		canvasContext.lineWidth = 1;
		canvasContext.globalAlpha = 0.25;
		canvasContext.lineJoin = 'round';

		for (let curve of this.data.curveList)
		{
			const path = new Path2D(line(curve.pointList));
			canvasContext.stroke(path);
		}
	}

	private drawAxis(): void
	{
		this.xAxisGroupSelect
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight})`)
			.call(d3.axisBottom(this.scaleX).ticks(5));

		this.yAxisGroupSelect
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.call(d3.axisLeft(this.scaleY).ticks(5));
	}

    private showLabel(): void
    {
		this.xLabelTextSelect
			.text(this.xKey)
			.classed('noDisp', false);

		this.yLabelTextSelect
			.text(this.yKey)
			.classed('noDisp', false);
		
    }

	protected OnResize(): void
	{
		if (this.data)
		{
			this.svgSelect.attr('width', this.width);
			this.svgSelect.attr('height', this.height);	
			this.updateScales();
			this.updatePaths();
			this.positionLabels();
			this.drawAxis();
		}
		this.resizeBrush();
	}

	private resizeBrush(): void
	{
		this.initBrush();
		if (this.lastYValueBrushBound == null || this.lastXValueBrushBound == null)
		{
			return;
		}
		let left = this.scaleX(this.lastXValueBrushBound[0]);
		let right = this.scaleX(this.lastXValueBrushBound[1]);
		let top = this.scaleY(this.lastYValueBrushBound[1]);
		let bottom = this.scaleY(this.lastYValueBrushBound[0]);
		this.brushGroupSelect.call(this.brush.move, [[left, top], [right, bottom]]);
	}

	private brushHandler(): void
	{
		const selection: [[number, number], [number, number]] | null  | undefined = d3.event.selection;
		if (typeof selection === "undefined" || selection === null)
		{
			this.data.removeCurveBrush(this.ComponentId);
			this._lastXValueBrushBound = null;
			this._lastYValueBrushBound = null;
			return;
		}

		let [[left, top], [right, bottom]] = selection;

		let minX = this.scaleX.invert(left);
		let maxX = this.scaleX.invert(right);
		this._lastXValueBrushBound = [minX, maxX];
		let xValueFilter: valueFilter = {
			key: this.xKey,
			bound: this.lastXValueBrushBound
		}

		let minY = this.scaleY.invert(bottom);
		let maxY = this.scaleY.invert(top);
		this._lastYValueBrushBound = [minY, maxY];
		let yValueFilter: valueFilter = {
			key: this.yKey,
			bound: this.lastYValueBrushBound
		}
		this.data.addCurveBrush(this.ComponentId, [xValueFilter, yValueFilter]);

	}
	
	public OnBrushChange(): void
	{
		this.updatePaths();
	}

}