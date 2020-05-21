import * as d3 from 'd3';
import {SvgSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import { NDim } from '../devlib/DevlibTypes';
import {valueFilter, PointCollection} from '../DataModel/PointCollection';
import { DatasetSpec } from '../types';

export class ScatterPlotWidget extends BaseWidget<PointCollection, DatasetSpec> {
	
	constructor(container: HTMLElement, xKey: string, yKey: string, canBrush: boolean = true)
	{
		super(container, true, canBrush);
		this._xKey = xKey;
		this._yKey = yKey;
		this.setLabel();
	}

	protected Clone(container: HTMLElement): BaseWidget<PointCollection, DatasetSpec>
    {
		const canBrush = false;
        return new ScatterPlotWidget(container, this.xKey,  this.yKey, canBrush);
	}
	
	protected initProps(props?: any[]): void
	{
		super.initProps();
		this._canBrush = props[0];
	}

	private _xKey : string;
	public get xKey() : string {
		return this._xKey;
	}

	private _yKey : string;
	public get yKey() : string {
		return this._yKey;
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
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

	private _scaleX : d3.ScaleLinear<number, number>;
	public get scaleX() : d3.ScaleLinear<number, number> {
		return this._scaleX;
	}

	private _scaleY : d3.ScaleLinear<number, number>;
	public get scaleY() : d3.ScaleLinear<number, number> {
		return this._scaleY;
	}

	private _axisPadding :  number;
	public get axisPadding() :  number {
		return this._axisPadding;
	}

	private _brush : d3.BrushBehavior<any>;
	public get brush() : d3.BrushBehavior<any> {
		return this._brush;
	}

	protected setMargin(): void
	{
		this._margin = {
			top: 8,
			right: 8,
			bottom: 56,
			left: 56
		}
	}

	public init(): void
	{
		this._svgSelect = d3.select(this.container).append("svg")
			.attr("width", this.width)
			.attr("height", this.height);

		this._mainGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
		
		if (this.canBrush)
		{
			this._brushGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.classed("brushContainer", true);
		}
			
		this._axisPadding = 0;
			
		this._xAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight + this.axisPadding})`)
			.classed("labelColor", true);
			
		this._yAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left - this.axisPadding}, ${this.margin.top})`)
			.classed("labelColor", true);

		if (this.canBrush)
		{
			this._brush = d3.brush()
				.extent([[0, 0], [this.vizWidth, this.vizHeight]])
				.on("end", () => { this.brushHandler() });
			
			this.brushGroupSelect.call(this.brush);
		}
	}

	private setLabel(): void
	{
		const bufferForAxis = 32 + this.axisPadding;
		this._xLabelTextSelect = this.svgSelect.append('text')
			.attr('transform', `translate(${this.margin.left + this.vizWidth / 2}, ${this.margin.top + this.vizHeight + bufferForAxis})`)
			.classed('axisLabel', true)
			.classed('labelColor', true)
			.text(this.xKey);

		let transX = this.margin.left - bufferForAxis;
		let transY = this.margin.top + this.vizHeight / 2;
		let transformText: string;
		if (this.yKey.length === 1)
		{
			transformText = `translate(${transX}, ${transY})`;
		}
		else
		{
			transformText = `rotate(-90) translate(${-transY}, ${transX})`;
		}

		this._yLabelTextSelect = this.svgSelect.append('text')
			.attr('transform', transformText)
			.classed('axisLabel', true)
			.classed('labelColor', true)
			.text(this.yKey);
	}

	public OnDataChange()
	{
		this.updateScales();
		this.mainGroupSelect.selectAll("circle")
			.data<NDim>(this.data.Array)
		  .join("circle")
			.attr("cx", d => this.scaleX(d.get(this.xKey)))
			.attr("cy", d => this.scaleY(d.get(this.yKey)))
			.classed("scatterPoint", true)
			.classed("noDisp", d => !d.inBrush);

		this.drawAxis();
	}

	protected drawFacetedData(facetOptionIndex: number): void
	{
		super.drawFacetedDataDefault(facetOptionIndex, "300px", "300px");
	}

	private updateScales(): void
	{
		let minMaxX = this.fullData.getMinMax(this.xKey);
		this._scaleX = d3.scaleLinear()
			.domain(minMaxX)
			.range([0, this.vizWidth]);

		let minMaxY = this.fullData.getMinMax(this.yKey);
		this._scaleY = d3.scaleLinear()
			.domain(minMaxY)
			.range([this.vizHeight, 0]);
	}

	private drawAxis(): void
	{
		this.xAxisGroupSelect
			.call(d3.axisBottom(this.scaleX).ticks(5));

		this.yAxisGroupSelect
			.call(d3.axisLeft(this.scaleY).ticks(5));
	}

	protected OnResize(): void
	{
		// resize is handled by css / HTML
	}

	private brushHandler():  void
	{
		const selection: [[number, number], [number, number]] | null  | undefined = d3.event.selection;
		if (typeof selection === "undefined" || selection === null)
		{
			this.data.removeBrush(this.ComponentId);
			return;
		}
		let [[left, top], [right, bottom]] = selection;
		
		let minX = this.scaleX.invert(left);
		let maxX = this.scaleX.invert(right);
		let xValueFilter: valueFilter = {
			key: this.xKey,
			bound: [minX, maxX]
		}

		let minY = this.scaleY.invert(bottom);
		let maxY = this.scaleY.invert(top);
		let yValueFilter: valueFilter = {
			key: this.yKey,
			bound: [minY, maxY]
		}

		this.data.addBrush(this.ComponentId, xValueFilter, yValueFilter);
	}

	public OnBrushChange(): void
	{
		if (this.container.classList.contains("noDisp"))
		{
			return;
		}

		// hide dynamically
		this.mainGroupSelect.selectAll("circle")
			.data<NDim>(this.data.Array)
		  .join("circle")
			.classed("noDisp", d => !d.inBrush);
	}

}