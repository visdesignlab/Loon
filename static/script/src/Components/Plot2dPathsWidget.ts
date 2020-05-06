import * as d3 from 'd3';
import {BaseWidget} from './BaseWidget';
import {CurveList} from '../DataModel/CurveList';
import {PointND} from '../DataModel/PointND';
import {Margin, SvgSelection, HtmlSelection} from '../devlib/DevLibTypes';
import {DevlibTSUtil} from '../devlib/DevlibTSUtil';

export class Plot2dPathsWidget extends BaseWidget<CurveList> {
	
	constructor(container: Element, xKey: string, yKey: string, squareAspectRatio: boolean = true)
	{
		super(container);
		this._xKey = xKey;
		this._yKey = yKey;
		this._squareAspectRatio = squareAspectRatio;
		this.setLabel();
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
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

	private _xKey : string;
	public get xKey() : string {
		return this._xKey;
	}

	private _yKey : string;
	public get yKey() : string {
		return this._yKey;
	}
	
	private _squareAspectRatio : boolean;
	public get squareAspectRatio() : boolean {
		return this._squareAspectRatio;
	}

	protected setMargin(): void
	{
		this._margin = {
			top: 8,
			right: 8,
			bottom: 42,
			left: 64
		}
	}

	protected init(): void
	{

		this._svgSelect = d3.select(this.container).append("svg")
		this._mainGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

		this.mainGroupSelect
			.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

		this.svgSelect.attr("style", 'width: 100%; height: 100%;');

		this._xAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight})`)
			.classed("labelColor", true);

		this._yAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.classed("labelColor", true);

	}

	private setLabel(): void
	{
		this._xLabelTextSelect = this.svgSelect.append('text')
			.classed('axisLabel', true)
			.classed('labelColor', true)
			.classed('noDisp', true)
			.text(this.xKey);

		this._yLabelTextSelect = this.svgSelect.append('text')
			.classed('axisLabel', true)
			.classed('labelColor', true)
			.classed('noDisp', true)
			.text(this.yKey);

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
		if (this.yKey.length === 1)
		{
			transformText = `translate(${transX}, ${transY})`;
		}
		else
		{
			transformText = `rotate(-90) translate(${-transY}, ${transX})`;
		}
		this.yLabelTextSelect.attr('transform', transformText);
	}

	public OnDataChange(): void
	{
		this.updateScales();
		this.updatePaths();
		this.drawAxis();
        this.showLabel();
	}

	private updateScales(): void
	{
		let [minX, maxX] = this.data.minMaxMap.get(this.xKey);
		let [minY, maxY] = this.data.minMaxMap.get(this.yKey);
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

		this.mainGroupSelect.selectAll("path")
			.data(this.data.curveList)
			.join("path")
			.attr("d", d => line(d.pointList))
			.classed("trajectoryPath", true);
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
        this.xLabelTextSelect.classed('noDisp', false);
        this.yLabelTextSelect.classed('noDisp', false);
    }

	protected OnResize(): void
	{
		// this.setVizWidthHeight();
		if (this.data)
		{
			this.updateScales();
			this.updatePaths();
			this.positionLabels();
			this.drawAxis();
		}
	}

	public OnBrushChange(): void
	{
		this.updatePaths();
	}

}