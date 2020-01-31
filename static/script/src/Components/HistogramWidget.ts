import * as d3 from 'd3';
import {SvgSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import {PointCollection, valueFilter} from '../DataModel/PointCollection';
import {PointND} from '../DataModel/PointND';

export class HistogramWidget extends BaseWidget<PointCollection> {
	
	constructor(container: HTMLElement, valueKey: string)
	{
		super(container);
		this._valueKey = valueKey;
		this.setLabel()
	}

	private _valueKey : string;
	public get valueKey() : string {
		return this._valueKey;
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
	}

	private _brushGroupSelect : SvgSelection;
	public get brushGroupSelect() : SvgSelection {
		return this._brushGroupSelect;
	}

	private _axisGroupSelect : SvgSelection;
	public get axisGroupSelect() : SvgSelection {
		return this._axisGroupSelect;
	}

	private _labelTextSelect : SvgSelection;
	public get labelTextSelect() : SvgSelection {
		return this._labelTextSelect;
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
			top: 6,
			right: 8,
			bottom: 50,
			left: 8
		}
	}

	public init(): void
	{
		this._svgSelect = d3.select(this.container).append("svg")
			.attr("width", this.width)
			.attr("height", this.height);

		this._mainGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
		
		this._brushGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.classed("brushContainer", true);

		this._axisPadding = 2;

		this._axisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight + this.axisPadding})`)
			.classed('labelColor', true);

		this._brush = d3.brushX()
			.extent([[0, 0], [this.vizWidth, this.vizHeight]])
			.on("end", () => { this.brushHandler() });
	
		this.brushGroupSelect.call(this.brush);

	}

	private setLabel(): void
	{	
		const bufferForAxis = 32 + this.axisPadding;
		this._labelTextSelect = this.svgSelect.append('text')
			.attr('transform', `translate(${this.margin.left + this.vizWidth / 2}, ${this.margin.top + this.vizHeight + bufferForAxis})`)
			.classed('axisLabel', true)
			.classed('labelColor', true)
			.text(this.valueKey);
	}

	public OnDataChange(): void
	{
		let count = Math.round(Math.sqrt(this.data.length));
		let minMax = this.data.getMinMax(this.valueKey);
		let x = d3.scaleLinear()
			.domain(minMax)
			.nice(count);

		let bins = d3.histogram<PointND, number>()
			.domain(x.domain() as [number, number])
			.thresholds(x.ticks(count))
			.value(d => d.get(this.valueKey))
			(this.data);

		// account for degenerate last bin -_-
		let ultimateBin = bins[bins.length - 1];
		if (ultimateBin.x0 === ultimateBin.x1)
		{
			let penultimateBin = bins[bins.length - 2]
			if (penultimateBin)
			{
				penultimateBin.push(...ultimateBin);
			}
		}

		this.updateScales(bins);

		const singleWidth = 18;

		this.mainGroupSelect.selectAll("rect")
			.data(bins)
		  .join("rect")
		  	.classed("histogramBar", true)
			.attr("x", d =>
			{
				if (bins.length === 1)
				{
					return (this.vizWidth - singleWidth) / 2
				}
				return this.scaleX(d.x0);;
			})
			.attr("y", d => this.vizHeight - this.scaleY(d.length))
			.attr("width", (d) =>
			{
				if (bins.length === 1)
				{
					return singleWidth;
				}
				return this.scaleX(d.x1) - this.scaleX(d.x0);
			})
			.attr("height", d => this.scaleY(d.length));

			this.drawAxis();
	}

	private updateScales(bins: d3.Bin<PointND, number>[]): void
	{
		let minBinBoundary = bins[0].x0;
		let maxBinBoundary = bins[bins.length - 1].x1;

		this._scaleX = d3.scaleLinear<number, number>()
			.domain([minBinBoundary, maxBinBoundary])
			.range([0, this.vizWidth]);

		let biggestBinCount = d3.max(bins, d => d.length);
		this._scaleY = d3.scaleLinear<number, number>()
			.domain([0, biggestBinCount])
			.range([0, this.vizHeight]);
	}

	public MoveBrush(newRange: [number, number] | null): void
	{
		if (newRange)
		{
			newRange[0] = this.scaleX(newRange[0]);
			newRange[1] = this.scaleX(newRange[1]);
		}
		this.brushGroupSelect.call(this.brush.move, newRange);
	}

	private drawAxis(): void
	{
		this.axisGroupSelect
			.call(d3.axisBottom(this.scaleX).ticks(5))
	}

	protected OnResize(): void
	{
		this.OnDataChange();
	}

	private brushHandler():  void
	{
		const selection: [number, number] | null  | undefined = d3.event.selection;
		if (typeof selection === "undefined" || selection === null)
		{
			this.data.removeBrush(this.getUniqueKey());
			return;
		}
		let [minBound, maxBound] = selection;
		let minV = this.scaleX.invert(minBound);
		let maxV = this.scaleX.invert(maxBound);

		let valueFilter: valueFilter = {
			key: this.valueKey,
			bound: [minV, maxV]
		}

		this.data.addBrush(this.getUniqueKey(), valueFilter);
	}

	private getUniqueKey(): string
	{
		return this.constructor.name + "." + this.valueKey;
	}

	public OnBrushChange(): void
	{

		console.log("~~~~~~ Histo: OnBrushChange");
	}


}