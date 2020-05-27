import * as d3 from 'd3';
import {SvgSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import { valueFilter, PointCollection } from '../DataModel/PointCollection';
import { NDim } from '../devlib/DevlibTypes';
import { DatasetSpec } from '../types';
import { DevlibAlgo } from '../devlib/DevlibAlgo';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';

export class HistogramWidget extends BaseWidget<PointCollection, DatasetSpec> {

	constructor(container: HTMLElement, valueKey: string, canBrush: boolean = true)
	{
		super(container, true, canBrush);
		this._valueKey = valueKey;
		this.setLabel();
	}

    protected Clone(container: HTMLElement): BaseWidget<PointCollection, DatasetSpec>
    {
		const canBrush = false;
        let clone = new HistogramWidget(container, this.valueKey, canBrush);
        return clone;
    }

	protected initProps(props?: any[]): void
	{
		super.initProps();
		this._canBrush = props[0];
	}

	private _valueKey : string;
	public get valueKey() : string {
		return this._valueKey;
	}
	
	private _sortedData : NDim[];
	public get sortedData() : NDim[] {
		return this._sortedData;
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
	}
	
	private _totalHistogramGroupSelect : SvgSelection;
	public get totalHistogramGroupSelect() : SvgSelection {
		return this._totalHistogramGroupSelect;
	}
	
	private _brushedHistogramGroupSelect : SvgSelection;
	public get brushedHistogramGroupSelect() : SvgSelection {
		return this._brushedHistogramGroupSelect;
	}

	private _totalKDEGroupSelect : SvgSelection;
	public get totalKDEGroupSelect() : SvgSelection {
		return this._totalKDEGroupSelect;
	}
	
	private _brushedKDEGroupSelect : SvgSelection;
	public get brushedKDEGroupSelect() : SvgSelection {
		return this._brushedKDEGroupSelect;
	}

	private _canBrush : boolean;
	public get canBrush() : boolean {
		return this._canBrush;
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

	private _axisPadding :  number;
	public get axisPadding() :  number {
		return this._axisPadding;
	}

	private _brush : d3.BrushBehavior<any>;
	public get brush() : d3.BrushBehavior<any> {
		return this._brush;
	}
	
	
	private _useHistogramButton : HTMLButtonElement;
	public get useHistogramButton() : HTMLButtonElement {
		return this._useHistogramButton;
	}

	private _useKDEButton : HTMLButtonElement;
	public get useKDEButton() : HTMLButtonElement {
		return this._useKDEButton;
	}
	
	private static _useKdeInsteadOfHistogram : boolean = true;
	
	private static get useKdeInsteadOfHistogram() : boolean {
		return HistogramWidget._useKdeInsteadOfHistogram;
	}

	private static set useKdeInsteadOfHistogram(v : boolean) {
		HistogramWidget._useKdeInsteadOfHistogram = v;
		let event = new Event('switchBetweenKdeAndHistogram');
		document.dispatchEvent(event);
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
		this._useHistogramButton = this.AddButton('chart-bar', () =>
		{
			HistogramWidget.useKdeInsteadOfHistogram = false;
		});
		
		this._useKDEButton = this.AddButton('chart-area', () =>
		{
			HistogramWidget.useKdeInsteadOfHistogram = true;
		});
		if (HistogramWidget.useKdeInsteadOfHistogram)
		{
			DevlibTSUtil.hide(this.useKDEButton);
		}
		else
		{
			DevlibTSUtil.hide(this.useHistogramButton);
		}

		document.addEventListener('switchBetweenKdeAndHistogram', (e: Event) => 
		{
			if (HistogramWidget.useKdeInsteadOfHistogram)
			{
				DevlibTSUtil.show(this.useHistogramButton);
				DevlibTSUtil.hide(this.useKDEButton);
			}
			else
			{
				DevlibTSUtil.hide(this.useHistogramButton);
				DevlibTSUtil.show(this.useKDEButton);
			}
			this.OnDataChange();
		});


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

			this._brush = d3.brushX()
				.extent([[0, 0], [this.vizWidth, this.vizHeight]])
				.on("end", () => { this.brushHandler() });
		
			this.brushGroupSelect.call(this.brush);
		}

		this._totalHistogramGroupSelect = this.mainGroupSelect.append('g');
		this._brushedHistogramGroupSelect = this.mainGroupSelect.append('g');

		this._totalKDEGroupSelect = this.mainGroupSelect.append('g');
		this._brushedKDEGroupSelect = this.mainGroupSelect.append('g');

		this._axisPadding = 2;

		this._axisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight + this.axisPadding})`)
			.classed('labelColor', true);
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
		let validNumbers = this.data.Array.filter(d => !isNaN(d.get(this.valueKey)));	
		let allBins = this.calculateBins(validNumbers);
		this.updateScales(allBins);
		if (HistogramWidget._useKdeInsteadOfHistogram)
		{
			let shallowCopy = [...validNumbers];
			const key = this.valueKey;
			this._sortedData = shallowCopy.sort(DevlibAlgo.sortOnProperty<NDim>(d => d.get(key) ));
			this.drawTotalKDE();
			this.drawBrushedKDE();
			this.removeHistograms();
		}
		else
		{
			this.drawHistogram(this.totalHistogramGroupSelect, allBins);
			this.drawBrushedHistogram();
			this.removeKDEs();
		}

		this.drawAxis();
	}

	private calculateBins(points: NDim[]): d3.Bin<NDim, number>[]
	{
		let count = Math.round(Math.sqrt(this.fullData.length));
		let minMax = this.fullData.getMinMax(this.valueKey);
		let x = d3.scaleLinear()
			.domain(minMax)
			.nice(count);

		let bins = d3.histogram<NDim, number>()
			.domain(x.domain() as [number, number])
			.thresholds(x.ticks(count))
			.value(d => d.get(this.valueKey))
			(points);

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
		return bins;
	}

	private removeHistograms(): void
	{
		this.totalHistogramGroupSelect.html(null);
		this.brushedHistogramGroupSelect.html(null);
	}
	
	private drawBrushedHistogram(): void
	{
		let validNumbers = this.data.Array.filter(d => !isNaN(d.get(this.valueKey)));
		let brushedNumbers = validNumbers.filter(d => d.inBrush);
		if (validNumbers.length === brushedNumbers.length)
		{
			this.brushedHistogramGroupSelect.html(null);
			return;
		}
		let brushedBins = this.calculateBins(brushedNumbers);
		this.drawHistogram(this.brushedHistogramGroupSelect, brushedBins, true);
	}

	private drawHistogram(select: SvgSelection, bins: d3.Bin<NDim, number>[], inBrush: boolean = false): void
	{
		let pathPoints = this.getHistogramSkyline(bins);
		let lineFunc = d3.line()
			.x(d => d[0])
			.y(d => d[1])
			.defined(d => d[0] !== null);

		select.html(null)
			.append("path")
			.datum(pathPoints)
			.classed('kdePath', true)
			.classed('inBrush', inBrush)
			.attr("d", lineFunc);
	}

	private getHistogramSkyline(bins: d3.Bin<NDim, number>[], singleWidth: number = 18): [number, number][]
	{
		
		let pathPoints: [number, number][] = [];

		if (bins.length === 1)
		{
			let left = (this.vizWidth - singleWidth) / 2;
			let right = (this.vizWidth + singleWidth) / 2
			pathPoints.push([left, this.vizHeight]);
			pathPoints.push([left, 0]);
			pathPoints.push([right, 0]);
			pathPoints.push([right, this.vizHeight]);
			return pathPoints;
		}

		let biggestBinCount = d3.max(bins, d => d.length);
		let scaleY = d3.scaleLinear<number, number>()
			.domain([0, biggestBinCount])
			.range([0, this.vizHeight]);

		for (let bin of bins)
		{
			let x1: number = this.scaleX(bin.x0);
			let y: number = this.vizHeight - scaleY(bin.length);
			pathPoints.push([x1, y]);

			if (bin.length === 0)
			{
				let splitPoint: [number, number] = [null, null];
				pathPoints.push(splitPoint);
			}

			let x2: number = this.scaleX(bin.x1);
			pathPoints.push([x2, y]);
		}
		

		pathPoints.unshift([0, this.vizHeight]);
		pathPoints.push([this.vizWidth, this.vizHeight]);

		return pathPoints;
	}

	private removeKDEs(): void
	{
		this.totalKDEGroupSelect.html(null);
		this.brushedKDEGroupSelect.html(null);
	}
	

	private drawTotalKDE(): void
	{
		this.drawKDE(this.sortedData, false, this.totalKDEGroupSelect);
	}

	private drawBrushedKDE(): void
	{
		let brushedPoints = this.sortedData.filter(d => d.inBrush);
		if (brushedPoints.length === this.sortedData.length)
		{
			this.brushedKDEGroupSelect.html(null);
			return;
		}
		this.drawKDE(brushedPoints, true, this.brushedKDEGroupSelect);
	}

	private drawKDE(points: NDim[], inbrush: boolean, select: SvgSelection): void
	{
		let pathPoints = this.kde(points);

		let maxVal = d3.max(pathPoints, d => d[1]);
		let kdeScaleY = d3.scaleLinear<number, number>()
			.domain([0, maxVal])
			.range([this.vizHeight, 0]);

		let lineFunc = d3.line()
			.curve(d3.curveBasis)
			.x(d => this.scaleX(d[0]))
			.y(d => kdeScaleY(d[1]));

		select.html(null)
			.append("path")
			.datum(pathPoints)
			.classed('kdePath', true)
			.classed('inBrush', inbrush)
			.attr("d", lineFunc);
	}

	private kde(points: NDim[]): [number, number][]
	{
		// Assumes that points is sorted based on valueKey
		const kernel: Function = this.epanechnikov;
		let [low, high] = this.scaleX.domain();
		const bandwidth: number = 0.01 * (high - low);
		let ticks = this.scaleX.ticks(100);

		let pathPoints: [number, number][] = [];
		for (let t of ticks)
		{
			// get index with value closest to t
			let compareFunction = DevlibAlgo.compareProperty<NDim>(t, (point: NDim) => 
			{
				return point.get(this.valueKey);
			});

			let startIndex: number;
			let searchResult: number | [number, number] = DevlibAlgo.BinarySearchIndex(points, compareFunction);
	
			if (typeof searchResult === "number")
			{
				startIndex = searchResult;
			}
			else
			{
				const [idx1, idx2] = searchResult;
				if (typeof idx1 !== "undefined")
				{
					startIndex = idx1;
				}
				else
				{
					startIndex = idx2;
				}
			}

			let kernelSum = 0;
			// look forward
			for (let i = startIndex + 1; i < points.length; i++)
			{
				let point = points[i];
				let u: number = (t - point.get(this.valueKey)) / bandwidth;
				if (Math.abs(u) > 1)
				{
					break;
				}
				kernelSum += kernel(u);
			}

			// look backward
			for (let i = startIndex; i >= 0; i--)
			{
				let point = points[i];
				let u: number = (t - point.get(this.valueKey)) / bandwidth;
				if (Math.abs(u) > 1)
				{
					break;
				}
				kernelSum += kernel(u);
			}
			pathPoints.push([t, kernelSum / points.length]);
		}

		pathPoints.unshift([low, 0]);
		pathPoints.push([high, 0]);
		return pathPoints;
	}

	private epanechnikov(u: number): number
	{
		//https://en.wikipedia.org/wiki/Kernel_(statistics)#Kernel_functions_in_common_use
		if (Math.abs(u) <= 1)
		{
			return 0.75 * (1 - u * u);
		}
		return 0;
	}

	private updateScales(bins: d3.Bin<NDim, number>[]): void
	{
		let minBinBoundary = bins[0].x0;
		let maxBinBoundary = bins[bins.length - 1].x1;

		this._scaleX = d3.scaleLinear<number, number>()
			.domain([minBinBoundary, maxBinBoundary])
			.range([0, this.vizWidth]);
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
			this.data.removeBrush(this.ComponentId);
			return;
		}
		let [minBound, maxBound] = selection;
		let minV = this.scaleX.invert(minBound);
		let maxV = this.scaleX.invert(maxBound);

		let valueFilter: valueFilter = {
			key: this.valueKey,
			bound: [minV, maxV]
		}

		this.data.addBrush(this.ComponentId, valueFilter);
	}

	public OnBrushChange(): void
	{
		if (HistogramWidget._useKdeInsteadOfHistogram)
		{
			this.drawBrushedKDE();
		}
		else
		{
			this.drawBrushedHistogram();
		}
	}


}