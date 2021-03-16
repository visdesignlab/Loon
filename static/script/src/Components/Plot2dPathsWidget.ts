import * as d3 from 'd3';
import {BaseWidget} from './BaseWidget';
import {CurveList} from '../DataModel/CurveList';
import {PointND} from '../DataModel/PointND';
import {SvgSelection, HtmlSelection, ButtonProps} from '../devlib/DevLibTypes';
import { valueFilter } from '../types';
import { OptionSelect } from './OptionSelect';
import { DatasetSpec, Facet } from '../types';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';

interface quickPickOption {
	xKey: string,
	yKey: string,
	averaged: boolean,
	squareAspectRatio: boolean
}

export class Plot2dPathsWidget extends BaseWidget<CurveList, DatasetSpec> {
	
	constructor(container: Element,
		quickPickOptions: quickPickOption[],
		initialQuickPickOptionIndex: number = 0,
		squareAspectRatio: boolean = true,
		canBrush: boolean = true,
		isClone: boolean = false)
	{
		super(container, true, quickPickOptions, initialQuickPickOptionIndex, canBrush);
		this._squareAspectRatio = squareAspectRatio;
		this.addLabel();
		this._facetList = [];
		this._isClone = isClone;
	}
	
	protected Clone(container: HTMLElement): BaseWidget<CurveList, DatasetSpec>
    {
		const canBrush = false;
		return new Plot2dPathsWidget(container, this.quickPickOptions, this.quickPickOptionSelect.currentSelectionIndex, this.squareAspectRatio, canBrush, true);
	}

	private _isClone : boolean;
	public get isClone() : boolean {
		return this._isClone;
	}

	protected initProps(props?: any[]): void
	{
		super.initProps();
		this._quickPickOptions = props[0];
		this._initialQuickPickOptionIndex = props[1];
		let initialOption = this.quickPickOptions[this.initialQuickPickOptionIndex];
		this._canBrush = props[2];
		this._xKey = initialOption.xKey;
		this._yKey = initialOption.yKey;
		this._inAverageMode = initialOption.averaged;
		this._smoothCurves = false;
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
	}
	
	private _canvasContainer : SvgSelection;
	public get canvasContainer() : SvgSelection {
		return this._canvasContainer;
	}	

	private _canvasElement : HTMLCanvasElement;
	public get canvasElement() : HTMLCanvasElement {
		return this._canvasElement;
	}

	private _averageCurveLabelContainer : SvgSelection;
	public get averageCurveLabelContainer() : SvgSelection {
		return this._averageCurveLabelContainer;
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
	
	private _inAverageMode : boolean;
	public get inAverageMode() : boolean {
		return this._inAverageMode;
	}

	private _smoothCurves : boolean;
	public get smoothCurves() : boolean {
		return this._smoothCurves;
	}

	private _facetList : Facet[];
	public get facetList() : Facet[] {
		return this._facetList;
	}

	protected setMargin(): void
	{
		this._margin = {
			top: 20,
			right: 120,
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

		this._canvasContainer = this.mainGroupSelect
			.append('foreignObject')
				.attr('width', this.vizWidth)
				.attr('height', this.vizHeight);

		this._canvasElement = this.canvasContainer.append('xhtml:canvas')
				.attr('width', this.vizWidth)
				.attr('height', this.vizHeight)
			.node() as HTMLCanvasElement;

		if (this.canBrush)
		{
			this._brushGroupSelect = this.svgSelect.append("g")
				.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
				.classed('brushContainer', true)
				.classed('noDisp', this.inAverageMode);

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

		this._averageCurveLabelContainer = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

		this.initQuickPickOptions();

		document.addEventListener('groupByChanged', async (e: CustomEvent) =>
		{
			let popupContainer = d3.select('#largePopupContainerOuter');
			if (!popupContainer.empty() && !popupContainer.classed('noDisp'))
			{
				return;
			}
			 this._facetList = e.detail.flatFacetList;
			 if (this.inAverageMode)
			 {
				 this.OnDataChange();
			 }
		});

		document.addEventListener('smoothCurveChange', (e: CustomEvent) => 
		{
			this._smoothCurves = e.detail;
			if (this.inAverageMode)
			{
				this.OnDataChange();
			}
		});

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
			let optionName: string;
			if (quickPickOption.averaged)
			{
				optionName = 'Averaged: ' + quickPickOption.yKey + ' over ' + quickPickOption.xKey;
			}
			else
			{
				optionName = quickPickOption.yKey + " v. " + quickPickOption.xKey;
			}
			let buttonProp: ButtonProps = {
				displayName: optionName,
				callback: () => this.changeAxes(quickPickOption.xKey, quickPickOption.yKey, quickPickOption.averaged, quickPickOption.squareAspectRatio)
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

	private changeAxes(xKey: string, yKey: string, inAverageMode: boolean, squareAspectRatio: boolean): void
	{
		this._xKey = xKey;
		this._yKey = yKey;
		if (this._inAverageMode !== inAverageMode)
		{
			this._inAverageMode = inAverageMode;
			if (inAverageMode)
			{
				this.margin.right = 120;
			}
			else
			{
				this.margin.right = 8;
			}
			this.setWidthHeight();
			this.OnResize();
		}
		if (this.canBrush)
		{
			let brushElement = this.brushGroupSelect.node();
			if (this.inAverageMode)
			{
				DevlibTSUtil.hide(brushElement);
			}
			else
			{
				DevlibTSUtil.show(brushElement);
			}
		}
		this._squareAspectRatio = squareAspectRatio;
		this.removeBrush();
		this.OnDataChange();
		document.dispatchEvent(new CustomEvent('averageCurveKeyChange', {
			detail: {
				yKey: yKey
			}
		}));
	}
	
	private removeBrush(): void
	{
		this.brushGroupSelect.call(this.brush.move, null);
	}

	private updateScales(): void
	{
		let minX : number, maxX : number, minY : number, maxY : number;
		if (this.inAverageMode)
		{
			minY = d3.min(this.facetList, facet => d3.min((facet.data as CurveList).getAverageCurve(this.yKey, false, this.smoothCurves), d => d[1]));
			maxY = d3.max(this.facetList, facet => d3.max((facet.data as CurveList).getAverageCurve(this.yKey, false, this.smoothCurves), d => d[1]));

			if (this.data.brushApplied)
			{
				minY = d3.min([minY, d3.min(this.facetList, facet => d3.min((facet.data as CurveList).getAverageCurve(this.yKey, true, this.smoothCurves), d => d[1]))]);
				maxY = d3.max([maxY, d3.max(this.facetList, facet => d3.max((facet.data as CurveList).getAverageCurve(this.yKey, true, this.smoothCurves), d => d[1]))]);
			}
		}
		else
		{
			let data: CurveList;
			if (this.isClone)
			{
				data = this.fullData;
			}
			else
			{
				data = this.data;
			}

			[minY, maxY] = data.minMaxMap.get(this.yKey);
		}
		[minX, maxX] = this.data.minMaxMap.get(this.xKey);
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
		if (this.inAverageMode)
		{
			this.updateAveragePaths();
			this.drawAxis();
		}
		else
		{
			this.updateAllPaths()
		}
	}

	private updateAllPaths(): void
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
		this.clearLabels();
	}

	private updateAveragePaths(): void
	{
        let lineAvg = d3.line<[number, number]>()
            .x(d => this.scaleX(d[0]))
            .y(d => this.scaleY(d[1]));
		
		const canvasContext = this.canvasElement.getContext('2d');
		canvasContext.clearRect(0,0, this.vizWidth, this.vizHeight);
		canvasContext.lineJoin = 'round';
		
		let labelData: [string, [number, number]][] = [];
		for (let i = this.facetList.length - 1; i >= 0 ; i--)
		{
			if (i < 10)
			{
				canvasContext.globalAlpha = 0.85;
				canvasContext.lineWidth = 2;
			}
			else
			{
				canvasContext.globalAlpha = 0.4;
				canvasContext.lineWidth = 1;
			}

			let facet = this.facetList[i];
			canvasContext.strokeStyle = i >= 10 ? 'black' : d3.schemeCategory10[i];
			let dataPoints = facet.data.getAverageCurve(this.yKey, false, this.smoothCurves);
			if (dataPoints.length !== 0)
			{
				if (this.data.brushApplied)
				{
					canvasContext.save()
					canvasContext.setLineDash([2, 3]);
					canvasContext.globalAlpha *= 0.8;
					canvasContext.lineWidth *= 0.5;
				}
				const path = new Path2D(lineAvg(dataPoints));
				canvasContext.stroke(path);
			}
			let lastPoint: [number, number] = dataPoints[dataPoints.length - 1];
			canvasContext.restore();

			if (this.data.brushApplied)
			{
				let filteredDataPoints = facet.data.getAverageCurve(this.yKey, true, this.smoothCurves);
				if (filteredDataPoints.length !== 0)
				{
					// canvasContext.setLineDash([]);
					const path = new Path2D(lineAvg(filteredDataPoints));
					canvasContext.stroke(path);
				}
				lastPoint = filteredDataPoints[filteredDataPoints.length - 1];
			}
			labelData.unshift([facet.name, lastPoint]);
		}
		this.drawLabels(labelData);
	}

	private drawLabels(labelData: [string, [number, number]][]): void
	{
		this.averageCurveLabelContainer.selectAll('circle')
			.data(labelData)
			.join('circle')
			.attr('cx', d => this.scaleX(d[1][0]))
			.attr('cy', d => this.scaleY(d[1][1]))
			.attr('r', 3)
			.attr('fill', (d, i) => i >= 10 ? 'black' : d3.schemeCategory10[i]);

		const horizontalPad = 12;

		this.averageCurveLabelContainer.selectAll('text')
			.data(labelData)
			.join('text')
			.attr('transform', d => `translate(${this.scaleX(d[1][0]) + horizontalPad}, ${this.scaleY(d[1][1])})`)
			.attr('alignment-baseline', 'central')
			.text(d => d[0])
			.attr('stroke', (d, i) => i >= 10 ? 'black' : d3.schemeCategory10[i])

			// todo overlap prevention
	}

	private clearLabels(): void
	{
		this.averageCurveLabelContainer.html(null);
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
			this.canvasContainer
				.attr('width', this.vizWidth)
				.attr('height', this.vizHeight);

			d3.select(this.canvasElement)
				.attr('width', this.vizWidth)
				.attr('height', this.vizHeight);
				
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
		for (let facet of this.facetList)
		{
			facet.data._averageFilteredCurveCache.clear();
		}
		if (this.inAverageMode)
		{
			this.updateScales();
		}
		this.updatePaths();
	}

}