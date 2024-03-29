import * as d3 from 'd3';
import {SvgSelection} from '../devlib/DevLibTypes';
import {BaseWidget} from './BaseWidget';
import { PointCollection } from '../DataModel/PointCollection';
import { NDim } from '../devlib/DevlibTypes';
import { DatasetSpec, valueFilter } from '../types';
import { DevlibAlgo } from '../devlib/DevlibAlgo';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';

export class HistogramWidget extends BaseWidget<PointCollection, DatasetSpec> {

	constructor(
		container: HTMLElement,
		valueKey: string,
		canBrush: boolean = true,
		includeExemplarTrackButton: boolean = false,
		isClone: boolean = false)
	{
		super(container, true, canBrush, includeExemplarTrackButton);
		this._valueKey = valueKey;
		this.setLabel();
		this._isClone = isClone;
	}

    protected Clone(container: HTMLElement): BaseWidget<PointCollection, DatasetSpec>
    {
		const canBrush = false;
        let clone = new HistogramWidget(container, this.valueKey, canBrush, false);
        return clone;
    }

	private _isClone : boolean;
	public get isClone() : boolean {
		return this._isClone;
	}

	protected initProps(props?: any[]): void
	{
		super.initProps();
		this._canBrush = props[0];
		this._includeExemplarTrackButton = props[1];
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

	private _scaleYHistogramAbsolute : d3.ScaleLinear<number, number>;
	public get scaleYHistogramAbsolute() : d3.ScaleLinear<number, number> {
		return this._scaleYHistogramAbsolute;
	}
	private _scaleYHistogramRelative : d3.ScaleLinear<number, number>;
	public get scaleYHistogramRelative() : d3.ScaleLinear<number, number> {
		return this._scaleYHistogramRelative;
	}

	private _scaleYKdeAbsolute : d3.ScaleLinear<number, number>;
	public get scaleYKdeAbsolute() : d3.ScaleLinear<number, number> {
		return this._scaleYKdeAbsolute;
	}
	private _scaleYKdeRelative : d3.ScaleLinear<number, number>;
	public get scaleYKdeRelative() : d3.ScaleLinear<number, number> {
		return this._scaleYKdeRelative;
	}


	private _allBins : d3.Bin<NDim, number>[];
	public get allBins() : d3.Bin<NDim, number>[] {
		return this._allBins;
	}
	
	private _brushedBins : d3.Bin<NDim, number>[];
	public get brushedBins() : d3.Bin<NDim, number>[] {
		return this._brushedBins;
	}
	public set brushedBins(v : d3.Bin<NDim, number>[]) {
		this._brushedBins = v;
	}

	private _allPathPoints : [number, number][];
	public get allPathPoints() : [number, number][] {
		return this._allPathPoints;
	}

	private _maxDensityAll : number;
	public get maxDensityAll() : number {
		return this._maxDensityAll;
	}	

	private _brushedPathPoints : [number, number][];
	public get brushedPathPoints() : [number, number][] {
		return this._brushedPathPoints;
	}

	private _brushedPointsLength : number;
	public get brushedPointsLength() : number {
		return this._brushedPointsLength;
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
	
	private static _useKdeInsteadOfHistogram : boolean = false;
	
	private static get useKdeInsteadOfHistogram() : boolean {
		return HistogramWidget._useKdeInsteadOfHistogram;
	}

	private static set useKdeInsteadOfHistogram(v : boolean) {
		HistogramWidget._useKdeInsteadOfHistogram = v;
		let event = new Event('switchBetweenKdeAndHistogram');
		document.dispatchEvent(event);
	}	
	
	
	private _useAbsoluteButton : HTMLButtonElement;
	public get useAbsoluteButton() : HTMLButtonElement {
		return this._useAbsoluteButton;
	}

	private _useRelativeButton : HTMLButtonElement;
	public get useRelativeButton() : HTMLButtonElement {
		return this._useRelativeButton;
	}

	private static _useAbsoluteScaling : boolean = true;
	
	private static get useAbsoluteScaling() : boolean {
		return HistogramWidget._useAbsoluteScaling;
	}

	private static set useAbsoluteScaling(v : boolean) {
		HistogramWidget._useAbsoluteScaling = v;
		let event = new Event('switchBetweenAbsoluteAndRelativeScaling');
		document.dispatchEvent(event);
	}

	
	private _includeExemplarTrackButton : boolean;
	public get includeExemplarTrackButton() : boolean {
		return this._includeExemplarTrackButton;
	}
	public set includeExemplarTrackButton(v : boolean) {
		this._includeExemplarTrackButton = v;
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
		
		this.initKDEHIstogramToggle();
		this.initAbsoluteRelativeToggle();
		if (this.includeExemplarTrackButton)
		{
			this.initExemplarTrackButton();
		}

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

		document.addEventListener('exemplarAttributeChange', (e: CustomEvent) => 
		{
			let newExemplarAttribute = e.detail;
			if (newExemplarAttribute === this.valueKey)
			{
				this.container.classList.add('selected');
			}
			else
			{
				this.container.classList.remove('selected');
			}
		});
	}

	private initKDEHIstogramToggle(): void
	{
		this._useHistogramButton = this.AddButton('chart-bar', 'Change to histograms', () =>
		{
			HistogramWidget.useKdeInsteadOfHistogram = false;
		});
		
		this._useKDEButton = this.AddButton('chart-area', 'Change to kernel density plots', () =>
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
	}

	private initAbsoluteRelativeToggle(): void
	{
		this._useAbsoluteButton = this.AddButton('hashtag', 'Change to absolute comparison of selections.', () =>
		{
			HistogramWidget.useAbsoluteScaling = true;
		});
		
		this._useRelativeButton = this.AddButton('percent', 'Change to relative comparison of selections.', () =>
		{
			HistogramWidget.useAbsoluteScaling = false;
		});
		if (HistogramWidget.useAbsoluteScaling)
		{
			DevlibTSUtil.hide(this.useAbsoluteButton);
		}
		else
		{
			DevlibTSUtil.hide(this.useRelativeButton);
		}

		document.addEventListener('switchBetweenAbsoluteAndRelativeScaling', (e: Event) => 
		{
			if (this.container.classList.contains("noDisp"))
			{
				return;
			}
			if (HistogramWidget.useAbsoluteScaling)
			{
				DevlibTSUtil.show(this.useRelativeButton);
				DevlibTSUtil.hide(this.useAbsoluteButton);
			}
			else
			{
				DevlibTSUtil.hide(this.useRelativeButton);
				DevlibTSUtil.show(this.useAbsoluteButton);
			}
			if (HistogramWidget.useKdeInsteadOfHistogram)
			{
				this.drawAllKDE(false);
			}
			else
			{
				this.drawAllHistograms([], true);
			}
		});
	}

	private initExemplarTrackButton(): void
	{
		this.AddButton('rocket', 'Sample new exemplars from this attribute.', async () =>
		{
			let event = new CustomEvent('launchExemplarCurve', {detail: this.valueKey});
			DevlibTSUtil.launchSpinner();
			await DevlibTSUtil.makeAsync(() => document.dispatchEvent(event));
		});
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
		if (this.container.classList.contains("noDisp"))
		{
			return;
		}
		let validNumbers = this.data.Array.filter(d => !isNaN(d.get(this.valueKey)));	
		this._allBins = this.calculateBins(validNumbers);
		this.updateScales(validNumbers.length);
		if (HistogramWidget._useKdeInsteadOfHistogram)
		{
			let shallowCopy = [...validNumbers];
			const key = this.valueKey;
			this._sortedData = shallowCopy.sort((a,b) => d3.ascending(a.get(key), b.get(key)));

			this._allPathPoints = this.kde(this.sortedData);
			this._maxDensityAll = d3.max(this.allPathPoints, d => d[1]);
			this.drawAllKDE(false)
			this.removeHistograms();
		}
		else
		{
			this.drawAllHistograms(validNumbers);
			this.removeKDEs();
		}

		this.drawAxis();
	}

	private calculateBins(points: NDim[]): d3.Bin<NDim, number>[]
	{
		let bins = HistogramWidget.calculateBins(points, this.valueKey, this.fullData);
		return bins;
	}


	public static calculateBins(points: NDim[], valueKey: string, fullData: PointCollection, numBins?: number, skipNice: boolean = false): d3.Bin<NDim, number>[]
	{
		let count: number;
		if (numBins)
		{
			count = numBins;
		}
		else
		{
			count = Math.round(Math.sqrt(fullData.length)) / 3;
		}
		let minMax = fullData.getMinMax(valueKey);
		let x = d3.scaleLinear()
			.domain(minMax);

		let thresholds: number[];
		if (!skipNice)
		{
			x = x.nice(count);
			thresholds = x.ticks(count);
		}
		else
		{
			thresholds = d3.range(minMax[0], minMax[1], (minMax[1] - minMax[0]) / count);
		}

		let bins = d3.histogram<NDim, number>()
			.domain(x.domain() as [number, number])
			.thresholds(thresholds)
			.value(d => d.get(valueKey))
			(points);

		// account for degenerate last bin -_-
		let ultimateBin = bins[bins.length - 1];
		if (ultimateBin.x0 === ultimateBin.x1)
		{
			let penultimateBin = bins[bins.length - 2]
			if (penultimateBin)
			{
				for (let point of ultimateBin)
				{
					penultimateBin.push(point);
				}
			}
		}
		return bins;
	}

	private removeHistograms(): void
	{
		this.totalHistogramGroupSelect.html(null);
		this.brushedHistogramGroupSelect.html(null);
	}

	private drawAllHistograms(validNumbers?: NDim[], skipRecalculation = false): void
	{
		if (this.container.classList.contains("noDisp"))
		{
			return;
		}
		if (!skipRecalculation)
		{
			let brushedNumbers = validNumbers.filter(d => d.inBrush);
			if (validNumbers.length === brushedNumbers.length)
			{
				this.brushedHistogramGroupSelect.html(null);
				this._brushedBins = []
			}
			else
			{
				this._brushedBins = this.calculateBins(brushedNumbers);
			}	
			
			let biggestBinRelativeAll = d3.max(this.allBins, d => d.length / validNumbers.length);
			let biggestBinRelativeBrushed = d3.max(this.brushedBins, d => d.length / brushedNumbers.length);
			this._scaleYHistogramRelative = d3.scaleLinear<number, number>()
				.domain([0, d3.max([biggestBinRelativeAll, biggestBinRelativeBrushed])])
				.range([0, this.vizHeight]);
		}


		this.drawHistogram(this.totalHistogramGroupSelect, this.allBins);
		this.drawHistogram(this.brushedHistogramGroupSelect, this.brushedBins, true);
	}

	private drawHistogram(select: SvgSelection, bins: d3.Bin<NDim, number>[], inBrush: boolean = false): void
	{
		if (bins.length === 0)
		{
			select.html(null);
			return;
		}
		let pathPoints = this.getHistogramSkyline(bins);
		let lineFunc = d3.line()
			.x(d => d[0])
			.y(d => d[1])
			.defined(d => d[0] !== null);


		select.selectAll('path')
			.data([lineFunc(pathPoints)])
			.join('path')
			.classed('kdePath', true)
			.classed('inBrush', inBrush)
			.transition()
			.attr('d', d => d);
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

		const totalCount = d3.sum(bins, bin => bin.length);

		for (let bin of bins)
		{
			let x1: number = this.scaleX(bin.x0);
			let offset: number;
			if (HistogramWidget.useAbsoluteScaling)
			{
				offset = this.scaleYHistogramAbsolute(bin.length);
			}
			else
			{
				offset = this.scaleYHistogramRelative(bin.length / totalCount);
			}
			let y: number = this.vizHeight - offset;
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

	private drawAllKDE(filterChanged: boolean): void
	{

		let brushedPoints = this.sortedData.filter(d => d.inBrush);
		this._brushedPathPoints = this.kde(brushedPoints);
		this._brushedPointsLength = brushedPoints.length;

		let maxDomain = this.maxDensityAll;
		if (!HistogramWidget.useAbsoluteScaling)
		{
			let maxValBrushed = d3.max(this.brushedPathPoints, d => d[1]);
			maxDomain = d3.max([maxDomain, maxValBrushed])
		}

		this._scaleYKdeRelative = d3.scaleLinear<number, number>()
			.domain([0, maxDomain])
			.range([this.vizHeight, 0]);

		if (!filterChanged || HistogramWidget.useAbsoluteScaling)
		{	
			this.drawKDE(this.sortedData.length, this.allPathPoints, false, this.totalKDEGroupSelect);
		}
		if (this.brushedPointsLength === this.sortedData.length)
		{
			this.brushedKDEGroupSelect.html(null);
		}
		else
		{
			this.drawKDE(this.brushedPointsLength, this.brushedPathPoints, true, this.brushedKDEGroupSelect);
		}
	}

	private drawKDE(numPoints: number, pathPoints: [number, number][], inBrush: boolean, select: SvgSelection): void
	{
		let yFunc: (d: [number, number]) => number;

		if (HistogramWidget.useAbsoluteScaling)
		{
			yFunc = d => this.scaleYKdeRelative((numPoints / this.sortedData.length ) * d[1]);
		}
		else
		{
			yFunc = d => this.scaleYKdeRelative(d[1])
		}

		let lineFunc = d3.line()
			// .curve(d3.curveBasis)
			.x(d => this.scaleX(d[0]))
			.y(yFunc)

		select.selectAll('path')
			.data([lineFunc(pathPoints)])
			.join('path')
			.classed('kdePath', true)
			.classed('inBrush', inBrush)
			.transition()
			.attr('d', d => d);
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

	private updateScales(totalCount: number): void
	{

		let minBinBoundary = this.allBins[0].x0;
		let maxBinBoundary = this.allBins[this.allBins.length - 1].x1;

		this._scaleX = d3.scaleLinear<number, number>()
			.domain([minBinBoundary, maxBinBoundary])
			.range([0, this.vizWidth]);

		let biggestBinCount = d3.max(this.allBins, d => d.length);
		this._scaleYHistogramAbsolute = d3.scaleLinear<number, number>()
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
		if (this.container.classList.contains("noDisp"))
		{
			return;
		}
		if (HistogramWidget._useKdeInsteadOfHistogram)
		{
			// this.drawBrushedKDE();
			this.drawAllKDE(true);
		}
		else
		{
			let validNumbers = this.data.Array.filter(d => !isNaN(d.get(this.valueKey)));
			this.drawAllHistograms(validNumbers);
		}
	}


}