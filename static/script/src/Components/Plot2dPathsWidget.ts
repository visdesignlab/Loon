import * as d3 from 'd3';
import {BaseWidget} from './BaseWidget';
import {CurveList} from '../DataModel/CurveList';
import {PointND} from '../DataModel/PointND';
import {SvgSelection, HtmlSelection, ButtonProps} from '../devlib/DevLibTypes';
import { valueFilter } from '../types';
import { OptionSelect } from './OptionSelect';
import { DatasetSpec, Facet } from '../types';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { DataEvents } from '../DataModel/DataEvents';
import { GroupByWidget } from './GroupByWidget';

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
		this._colorLookup = new Map<string, string>();
		this._isClone = isClone;
		if (this.inAverageMode)
		{
			DevlibTSUtil.hide(this.facetButton);
		}
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
		this._inFacetMode = true;
		this._tempConditionFilterState = new Map<string, Map<string, boolean>>();
		this._smoothCurves = true;
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _svgFacetSelect : SvgSelection;
	public get svgFacetSelect() : SvgSelection {
		return this._svgFacetSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
	}
	
	private _mainGroupFacetSelect : SvgSelection;
	public get mainGroupFacetSelect() : SvgSelection {
		return this._mainGroupFacetSelect;
	}

	private _yAxisFacetSelect : SvgSelection;
	public get yAxisFacetSelect() : SvgSelection {
		return this._yAxisFacetSelect;
	}

	private _xAxisFacetSelect : SvgSelection;
	public get xAxisFacetSelect() : SvgSelection {
		return this._xAxisFacetSelect;
	}

	private _averageLegendSelect : SvgSelection;
	public get averageLegendSelect() : SvgSelection {
		return this._averageLegendSelect;
	}

	private _facetLegendSelect : SvgSelection;
	public get facetLegendSelect() : SvgSelection {
		return this._facetLegendSelect;
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

	private _inFacetMode : boolean;
	public get inFacetMode() : boolean {
		return this._inFacetMode;
	}

	private _smoothCurves : boolean;
	public get smoothCurves() : boolean {
		return this._smoothCurves;
	}

	private _facetList : Facet[];
	public get facetList() : Facet[] {
		return this._facetList;
	}

	private _colorLookup : Map<string, string>;
	public get colorLookup() : Map<string, string> {
		return this._colorLookup;
	}	

	private _forceSimulation : d3.Simulation<any, undefined> ;
	public get forceSimulation() : d3.Simulation<any, undefined>  {
		return this._forceSimulation;
	}

	private _tempConditionFilterState : Map<string, Map<string, boolean>>;
	public get tempConditionFilterState() : Map<string, Map<string, boolean>> {
		return this._tempConditionFilterState;
	}

	private _miniCellSelect : SvgSelection;
	public get miniCellSelect() : SvgSelection {
		return this._miniCellSelect;
	}

	private _selectConditionButton : HTMLButtonElement;
	public get selectConditionButton() : HTMLButtonElement {
		return this._selectConditionButton;
	}

	private _compareConditionButton : HTMLButtonElement;
	public get compareConditionButton() : HTMLButtonElement {
		return this._compareConditionButton;
	}	

	protected setMargin(): void
	{
		this._margin = {
			top: 20,
			right: 120,
			bottom: 62,
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
		this._svgSelect = containerSelect.append("svg");
		this._mainGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

		this._svgFacetSelect = containerSelect.append('svg');
		this._mainGroupFacetSelect = this.svgFacetSelect.append('g')
		this._yAxisFacetSelect = this.svgFacetSelect.append('g')
		this._xAxisFacetSelect = this.svgFacetSelect.append('g')

		this.swapSvgVisibility();

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

		this.svgSelect.attr('width', this.width);
		this.svgSelect.attr('height', this.height);

		this.svgFacetSelect.attr('width', this.width);
		this.svgFacetSelect.attr('height', this.height);

		this._xAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight})`)
			.classed("labelColor", true);

		this._yAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.classed("labelColor", true);

		this._averageCurveLabelContainer = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

		this._averageLegendSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left + this.vizWidth - 60}, ${this.margin.top + this.vizHeight + 30})`);
		
		this._facetLegendSelect = this.svgFacetSelect.append('g')
			.attr('transform', `translate(${this.margin.left + this.vizWidth - 60}, ${this.margin.top + this.vizHeight + 30})`);
		
		this.initQuickPickOptions();
		this.drawLegend();

		document.addEventListener('groupByChanged', async (e: CustomEvent) =>
		{
			let popupContainer = d3.select('#largePopupContainerOuter');
			if (!popupContainer.empty() && !popupContainer.classed('noDisp'))
			{
				return;
			}
			 this._facetList = e.detail.flatFacetList;
			 this._colorLookup = e.detail.colorLookup;
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

		this._selectConditionButton = this.AddButton('layer-group', 'Filter data on experimental conditions', () =>
		{
			DevlibTSUtil.hide(this.selectConditionButton);
			DevlibTSUtil.show(this.compareConditionButton);
			this.drawFacetContent()
		},
		'Select Conditions');

		this._compareConditionButton = this.AddButton('layer-group', 'Show conditions together to compare them', () =>
		{
			DevlibTSUtil.show(this.selectConditionButton);
			DevlibTSUtil.hide(this.compareConditionButton);
			this.drawFacetContent()
		},
		'Compare Conditions');

		DevlibTSUtil.hide(this.compareConditionButton);
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
		this.tempConditionFilterState.clear();
		this.resetTempConditionFilter();
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
				DevlibTSUtil.hide(this.facetButton);
				DevlibTSUtil.show(this.averageLegendSelect.node());
				DevlibTSUtil.show(this.facetLegendSelect.node());
				if (this.inFacetMode)
				{
					DevlibTSUtil.show(this.compareConditionButton);
				}
				else
				{
					DevlibTSUtil.show(this.selectConditionButton);
				}
			}
			else
			{
				this.margin.right = 8;
				if (this.inFacetMode)
				{
					this._inFacetMode = false;
					this.swapSvgVisibility();
				}

				DevlibTSUtil.show(this.facetButton);
				DevlibTSUtil.hide(this.selectConditionButton);
				DevlibTSUtil.hide(this.compareConditionButton);
				DevlibTSUtil.hide(this.averageLegendSelect.node());
				DevlibTSUtil.hide(this.facetLegendSelect.node());
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

	private swapSvgVisibility(): void
	{
		this.svgSelect.classed('noDisp', this.inFacetMode);
		this.svgFacetSelect.classed('noDisp', !this.inFacetMode);
		if (this.inFacetMode && this.dataSuperset)
		{
			this.resetTempConditionFilter();
		}
		else
		{
			let applyButton = document.getElementById('conditionFilterApplyButton');
			if (applyButton)
			{
				DevlibTSUtil.hide(applyButton);
			}
		}
	}

	private updatePaths(): void
	{
		if (this.inAverageMode)
		{
			if (this.inFacetMode)
			{
				this.updateFacetPaths();
			}
			else
			{
				this.updateAveragePaths();
				this.drawAxis();
			}
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
			canvasContext.globalAlpha = 0.85;
			canvasContext.lineWidth = 2;

			let facet = this.facetList[i];
			canvasContext.strokeStyle = GroupByWidget.getColor(facet.name, this.colorLookup);
			let dataPoints = facet.data.getAverageCurve(this.yKey, false, this.smoothCurves);
			if (dataPoints.length !== 0)
			{
				if (this.data.brushApplied)
				{
					canvasContext.save()
					// canvasContext.setLineDash([2, 3]);
					canvasContext.globalAlpha *= 0.8;
					canvasContext.lineWidth = 1;
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
					const path = new Path2D(lineAvg(filteredDataPoints));
					canvasContext.stroke(path);
				}
				lastPoint = filteredDataPoints[filteredDataPoints.length - 1];
			}
			if (typeof(lastPoint) === 'undefined')
			{
				lastPoint = null;
			}
			labelData.unshift([facet.name.join('___'), lastPoint]);
		}
		this.drawLabels(labelData);
	}

	private updateFacetPaths(): void
	{
		const margin = {
			top: 30,
			left: 120,
			right: 20,
			bottom: 48
		}

		const defaultFacets = this.data.defaultFacets;
		const defaultFacetsFull = this.fullData.defaultFacets;
		const defaultAxisTicks = this.fullData.defaultFacetAxisTicks;
		const wCount = defaultAxisTicks.xAxisTicks.length;
		const lCount = defaultAxisTicks.yAxisTicks.length;

		let miniWidth = (this.width - margin.left - margin.right) / wCount
		let miniHeight = (this.height - margin.top - margin.bottom) / lCount;

		let miniSize = Math.min(miniWidth, miniHeight);
		const miniPadding = Math.round(0.08 * miniSize);
		miniSize -= 2 * miniPadding;

		const vizWidth = wCount * miniSize + (wCount - 1) * miniPadding;
		const vizHeight = lCount * miniSize + (lCount - 1) * miniPadding;

		this.addApplyButton(d3.select(this.container as HTMLElement));

		this.mainGroupFacetSelect
			.attr('transform', `translate(${margin.left}, ${margin.top})`)

		let rowSelect = this.mainGroupFacetSelect.selectAll('g.row')
			.data(defaultAxisTicks.yAxisTicks)
			.join('g')
			.classed('row', true)
			.attr('transform', (_, i) => `translate(0, ${i * (miniSize + miniPadding)})`);

		this._miniCellSelect = rowSelect.selectAll('g.miniCell')
			.data(d => defaultAxisTicks.xAxisTicks.map(label => [d, label]))
			.join('g')
			.classed('miniCell', true)
			.on('click', (d) =>
			{
				if (this.allConditionsTrue())
				{
					this.setAllConditionsFalse();
				}
				let oldVal = this.tempConditionFilterState.get(d[0])?.get(d[1]);
				this.tempConditionFilterState.get(d[0])?.set(d[1], !oldVal);
				this.updateConditionFilterSelection();
			})
			.attr('transform', (_, i) => `translate(${i * (miniSize + miniPadding)}, 0)`) as SvgSelection;
			
		this.updateConditionFilterSelection()
		
		let frameExtent = this.data.getMinMax('Frame ID');
		const framePad = 1;
		const scaleX = d3.scaleLinear()
			.domain(frameExtent)
			.range([framePad, miniSize - framePad]);

		let [minMass, maxMass] = this.getExtentOfGrowthCurves(defaultFacets);
		let [minMassFull, maxMassFull] = this.getExtentOfGrowthCurves(defaultFacetsFull, true);
		minMass = Math.min(minMass, minMassFull);
		maxMass = Math.max(maxMass, maxMassFull);

		const scaleY = d3.scaleLinear()
			.domain([minMass, maxMass])
			.range([miniSize - framePad, framePad]);

        let lineAvg = d3.line<[number, number]>()
            .x(d => scaleX(d[0]))
            .y(d => scaleY(d[1]));
					

		this.miniCellSelect.selectAll('.miniExemplarArea')
			.data(d => [d])
			.join('path')
			.classed('miniExemplarArea', true)
			.attr('d', d => 
			{
				let pathString = this.getGrowthLine(d, defaultFacets, lineAvg, false, true, minMass);
				if (pathString)
				{
					return pathString
				}
				return this.getGrowthLine(d, defaultFacetsFull, lineAvg, true, true, minMass);
			});

		this.miniCellSelect.selectAll('.miniExemplarCurve.allData')
			.data(d => [d])
			.join('path')
			.classed('miniExemplarCurve', true)
			.classed('allData', true)
			.classed('active', !this.data.brushApplied)
			.attr('stroke', d => GroupByWidget.getColor(d, this.colorLookup))
			.attr('d', d => 
			{
				let pathString = this.getGrowthLine(d, defaultFacets, lineAvg, false, false);
				if (pathString)
				{
					return pathString
				}
				return this.getGrowthLine(d, defaultFacetsFull, lineAvg, true, false);
			});

		if (this.data.brushApplied)
		{
			this.miniCellSelect.selectAll('.miniExemplarCurve.selection')
				.data(d => [d])
				.join('path')
				.classed('miniExemplarCurve', true)
				.classed('selection', true)
				.classed('active', true)
				.attr('stroke', d => GroupByWidget.getColor(d, this.colorLookup))
				.attr('d', d => 
				{
					return this.getGrowthLine(d, defaultFacets, lineAvg, true, false);
				});
		}
		else
		{
			this.miniCellSelect.selectAll('.miniExemplarCurve.selection').remove();
		}

		this.miniCellSelect.selectAll('rect')
			.data(d => [d])
			.join('rect')
			.attr('width', miniSize)
			.attr('height', miniSize)
			.classed('miniBox', true)
			.on('mouseenter', function(d)
			{	
				d3.select(this).classed('hovered', true);
			})
			.on('mouseleave', function(d) 
			{
				d3.select(this).classed('hovered', false);
			});

		this.yAxisFacetSelect
			.attr('transform', `translate(${margin.left}, ${margin.top})`);
		
		const maxLabelWidth = 70;
		const labelPadding = 8;

		const mainLabelSize = 20;

		this.yAxisFacetSelect.selectAll('text')
			.data([defaultAxisTicks.axisLabels[0]])
		  .join('text')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.attr('transform', `translate(${-maxLabelWidth - labelPadding - mainLabelSize}, ${vizHeight/2}) rotate(-90)`)
			.classed('mediumText', true)
			.text(d => d)

		this.yAxisFacetSelect.selectAll('foreignObject')
			.data(defaultAxisTicks.yAxisTicks)
		  .join('foreignObject')
			.attr('width', maxLabelWidth)
			.attr('height', miniSize)
			.attr('transform', (d, i) => `translate(${-maxLabelWidth - labelPadding}, ${i * (miniSize + miniPadding)})`)
		  	.selectAll('div')
		 	.data(d => [d]) 
		  .join('xhtml:div')
			.attr('style', `height: ${miniSize}px;`)
			.classed('y', true)
			.classed('axisButtonContainer', true)
			.selectAll('button')
			.data(d => [d])
		  .join('button')
			.classed('basicIconButton', true)
			.attr('style', `max-width: ${maxLabelWidth}px; min-width: ${maxLabelWidth}px;`)
			.attr('title', d => d)
			.on('click', (d) => 
			{
				if (this.allConditionsTrue())
				{
					this.setAllConditionsFalse();
				}
				let rowMap = this.tempConditionFilterState.get(d);
				let newValue: boolean = !Array(...rowMap.values()).every(x => x)
				for (let key of rowMap.keys())
				{
					rowMap.set(key, newValue);
				}
				this.updateConditionFilterSelection();
			})
			.on('mouseenter', (label, i) => 
			{
				this.miniCellSelect
					.selectAll('rect')
					.data(d => [d])
					.classed('hovered', d =>
					{
						let [l1, _l2] = d;
						return l1 === label;
					});
			})
			.on('mouseleave', () => this.miniCellSelect.selectAll('rect').classed('hovered', false))
			.text(d => d);
		
		const maxLabelHeight = 36;

		this.xAxisFacetSelect
			.attr('transform', `translate(${margin.left}, ${margin.top + vizHeight})`);
		
		this.xAxisFacetSelect.selectAll('text')
			.data([defaultAxisTicks.axisLabels[1]])
		  .join('text')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.attr('transform', `translate(${vizWidth / 2}, ${maxLabelHeight + 2 * labelPadding})`)
			.classed('mediumText', true)
			.text(d => d)

		this.xAxisFacetSelect.selectAll('foreignObject')
			.data(defaultAxisTicks.xAxisTicks)
		  .join('foreignObject')
			.attr('width', miniSize)
			.attr('height', maxLabelHeight)
			.attr('transform', (d, i) => `translate(${i * (miniSize + miniPadding)}, ${labelPadding})`)
			.selectAll('div')
			.data(d => [d])
		  .join('xhtml:div')
			.classed('x', true)
			.classed('axisButtonContainer', true)
			.selectAll('button')
			.data(d => [d])
		  .join('button')
		  	.classed('basicIconButton', true)
			.attr('style', `max-width: ${miniSize}px; min-width: ${miniSize}px; height: ${maxLabelHeight}px`)
		  	.attr('title', d => d)
			.on('click', (d) => 
			{
				if (this.allConditionsTrue())
				{
					this.setAllConditionsFalse();
				}
				const rowList: Map<string, boolean>[] = Array(...this.tempConditionFilterState.values())
				const colValues: boolean[] = rowList.map(m => m.get(d))
				const newValue: boolean = !colValues.every(x => x)
				for (let map of rowList)
				{
					map.set(d, newValue);
				}
				this.updateConditionFilterSelection();
			})
			.on('mouseenter', (label, i) => 
			{
				this.miniCellSelect
					.selectAll('rect')
					.data(d => [d])
					.classed('hovered', d =>
					{
						let [_l1, l2] = d;
						return l2 === label;
					});
			})
			.on('mouseleave', () => this.miniCellSelect.selectAll('rect').classed('hovered', false))
			.text(d => d);
	}

	private getGrowthLine(
		label: [string, string],
		facets: Map<string, Map<string, CurveList>>,
		lineFunc: d3.Line<[number, number]>,
		selection: boolean,
		makeAreaPath: boolean,
		minYValue?: number): string
	{
		let [drugLabel, concLabel] = label;
		if (!facets.has(drugLabel))
		{
			return ''; // empty when no data
		}
		let row = facets.get(drugLabel);
		if (!row.has(concLabel))
		{
			return '';
		}
		let data: CurveList = row.get(concLabel)
		let avergeGrowthLine = [...data.getAverageCurve(this.yKey, selection, this.smoothCurves)];
		if (avergeGrowthLine.length === 0)
		{
			return '';
		}
		if (makeAreaPath)
		{
			let first = avergeGrowthLine[0];
			avergeGrowthLine.unshift([first[0], minYValue]);
			
			let last = avergeGrowthLine[avergeGrowthLine.length - 1];
			avergeGrowthLine.push([last[0], minYValue]);
			// avergeGrowthLine.push([first[0], minYValue]);

		}
		return lineFunc(avergeGrowthLine);
	}

	private getExtentOfGrowthCurves(facets: Map<string, Map<string, CurveList>>, filteredOnly: boolean = false): [number, number]
	{
		let minMass = Infinity;
		let maxMass = -Infinity;
		for (let map of facets.values())
		{
			for (let data of map.values())
			{
				let thisMin: number
				let thisMax: number;
				if (filteredOnly)
				{
					thisMin = Infinity;
					thisMax = -Infinity;
				}
				else
				{
					const allDataPoints = data.getAverageCurve(this.yKey, false, this.smoothCurves);
					thisMin = d3.min(allDataPoints, d => d[1]);
					thisMax = d3.max(allDataPoints, d => d[1]);
				}

				let dataPoints = data.getAverageCurve(this.yKey, true, this.smoothCurves);
				const shouldCheckFiltered = (filteredOnly || this.data.brushApplied) && dataPoints.length > 0;
				if (shouldCheckFiltered)
				{
					thisMin = Math.min(thisMin, d3.min(dataPoints, d => d[1]));
				}
				minMass = Math.min(thisMin, minMass);

				if (shouldCheckFiltered)
				{
					thisMax = Math.max(thisMax, d3.max(dataPoints, d => d[1]));
				}
				maxMass = Math.max(thisMax, maxMass);
			}
		}
		return [minMass, maxMass];
	}

	private addApplyButton(container: HtmlSelection): void
	{	
		let buttonSelect = container
			.selectAll('div.applyButtonContainer')
			.data([42])
		.join('div')
			.classed('applyButtonContainer', true)
			.selectAll('button')
			.data([42])
		.join('button')
			.attr('id', 'conditionFilterApplyButton')
			.text('Apply Filter')
			.classed('devlibButton', true)
			.classed('big', true)
			.on('click', () =>
			{
				this.copyTempConditionsToModel();
				DevlibTSUtil.hide(document.getElementById('conditionFilterApplyButton'));
				document.dispatchEvent(new CustomEvent(DataEvents.applyNewFilter));
			});
		DevlibTSUtil.hide(document.getElementById('conditionFilterApplyButton'));
	}

	private updateConditionFilterSelection(): void
	{
		this.miniCellSelect.classed('inFilter', d => 
		{
			if (!this.tempConditionFilterState.has(d[0]))
			{
				return false;
			}
			let letRowFilters = this.tempConditionFilterState.get(d[0])
			if (this.tempConditionFilterState.has(d[1]))
			{
				return false;
			}
			return letRowFilters.get(d[1]);
		});

		let applyButton = document.getElementById('conditionFilterApplyButton');
		if (this.tempConditionsDifferent())
		{
			DevlibTSUtil.show(applyButton);
		}
		else
		{
			DevlibTSUtil.hide(applyButton);
		}
	}

	private resetTempConditionFilter(): void
	{
		for (let [key, value] of this.dataSuperset.conditionFilterState.entries())
		{
			this.tempConditionFilterState.set(key, new Map(value));
		}
	}

	private allConditionsTrue(): boolean
	{
		for (let map of this.tempConditionFilterState.values())
		{
			for (let val of map.values())
			{
				if (!val)
				{
					return false;
				}
			}
		}
		return true;
	}

	private setAllConditionsFalse(): void
	{
		for (let map of this.tempConditionFilterState.values())
		{
			for (let key of map.keys())
			{
				map.set(key, false);
			}
		}
	}

	private tempConditionsDifferent(): boolean
	{
		for (let key1 of this.tempConditionFilterState.keys())
		{
			let innerKeyVals = this.tempConditionFilterState.get(key1).entries();
			for (let [key2, val] of innerKeyVals)
			{
				if (val !== this.fullData.conditionFilterState.get(key1)?.get(key2))
				{
					return true;
				}
			}
		}
		return false;
	}

	private copyTempConditionsToModel(): void
	{
		for (let key1 of this.tempConditionFilterState.keys())
		{
			let innerKeyVals = this.tempConditionFilterState.get(key1).entries();
			for (let [key2, val] of innerKeyVals)
			{
				this.fullData.conditionFilterState.get(key1)?.set(key2, val);
			}
		}
	}


	protected drawFacetContent(): void
	{
		if (this.inAverageMode)
		{
			this._inFacetMode = !this.inFacetMode;
			this.swapSvgVisibility();
			this.updatePaths();
		}
		else
		{
			super.drawFacetContent();
		}
	}

	private drawLabels(labelData: [string, [number, number] | null][]): void
	{
		const indexedPoints: [string, [number, number] | null, number][] = labelData.map((d,i) => [d[0], d[1], i]);
		const validPoints = indexedPoints.filter((x, i) => x[1] !== null);
		const pixelSpacePoints: [number, number, number][] = validPoints.map(d => [this.scaleX(d[1][0]), this.scaleY(d[1][1]), d[2]]);
		this.averageCurveLabelContainer.selectAll('circle')
			.data(pixelSpacePoints)
			.join('circle')
			.attr('cx', d => d[0])
			.attr('cy', d => d[1])
			.attr('r', 3)
			.attr('fill', d => GroupByWidget.getColor(labelData[d[2]][0].split('___'), this.colorLookup));

		const radius = d3.scaleLinear<number, number>()
			.domain([5,50])
			.range([9,2])
			.clamp(true)
			(labelData.length);

		const forceNodes: any[] = pixelSpacePoints.map(d => {return {x: d[0], y: d[1] }});
		this._forceSimulation = d3.forceSimulation(forceNodes)
			.force('contraintX', alpha => 
			{
				for (let i = 0; i < forceNodes.length; i++)
				{
					 // make x position a hard constraint
					forceNodes[i].x = pixelSpacePoints[i][0];
				}
			})
			.force('repel', d3.forceCollide().radius(radius))
			.force('attractY', d3.forceY().y(d => 
				{
					return pixelSpacePoints[d.index][1];
				}))
			.on('tick', () => 
			{
				console.log('tick')
			});
		this.forceSimulation.stop();
		this.forceSimulation.tick(1000);


		const fontSize = d3.scaleLinear<number, number>()
			.domain([5,30])
			.range([12,7])
			.clamp(true)
			(labelData.length);
		
		const horizontalPad = 12;
		this.averageCurveLabelContainer.selectAll('text')
			.data(forceNodes)
			.join('text')
			.attr('transform', d => `translate(${d.x + horizontalPad}, ${d.y})`)
			.attr('alignment-baseline', 'central')
			.text((d,i) => labelData[i][0].replace('___', ' '))
			.attr('style', `font-size: ${fontSize}pt;`)
			.attr('stroke', (d, i) => GroupByWidget.getColor(labelData[pixelSpacePoints[i][2]][0].split('___'), this.colorLookup))
			.attr('fill', (d, i) => GroupByWidget.getColor(labelData[pixelSpacePoints[i][2]][0].split('___'), this.colorLookup));
			
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
	
	private drawLegend(): void
	{
		this.drawAverageLegend();
		this.drawFacetLegend();
	}

	private drawAverageLegend(): void
	{
		const lineWidth = 24;
		const textOffset = 4;
		const selectedTextWidth = 55; // approximate
		const betweenPad = 20;
		this.averageLegendSelect.append('line')
			.attr('x1', 0)
			.attr('x2', lineWidth)
			.attr('y1', 0)
			.attr('y2', 0)
			.attr('stroke-width', 2)
			.attr('stroke', 'black')
			.attr('opacity', 0.85);

		this.averageLegendSelect.append('circle')
			.attr('cx', lineWidth)
			.attr('cy', 0)
			.attr('r', 3)
			.attr('fill', 'black')
			.attr('opacity', 0.85);

		this.averageLegendSelect.append('text')
			.attr('alignment-baseline', 'middle')
			.attr('transform', `translate(${lineWidth + textOffset},0)`)
			.classed('smallText', true)
			.text('Selected');

		this.averageLegendSelect.append('line')
			.attr('x1', textOffset + selectedTextWidth + betweenPad + lineWidth)
			.attr('x2', textOffset + selectedTextWidth + betweenPad + 2 * lineWidth)
			.attr('y1', 0)
			.attr('y2', 0)
			.attr('stroke-width', 1)
			.attr('stroke', 'black')
			.attr('opacity', 0.8);

		this.averageLegendSelect.append('text')
			.attr('alignment-baseline', 'middle')
			.attr('transform', `translate(${2 * lineWidth + 2 * textOffset + selectedTextWidth + betweenPad},0)`)
			.classed('smallText', true)
			.text('All');
	}

	private drawFacetLegend(): void
	{
		const lineWidth = 24;
		const textOffset = 4;
		const selectedTextWidth = 55; // approximate
		const betweenPad = 20;
		this.facetLegendSelect.append('line')
			.attr('x1', 0)
			.attr('x2', lineWidth)
			.attr('y1', 0)
			.attr('y2', 0)
			.attr('stroke-width', 2)
			.attr('stroke', 'black')

		this.facetLegendSelect.append('text')
			.attr('alignment-baseline', 'middle')
			.attr('transform', `translate(${lineWidth + textOffset},0)`)
			.classed('smallText', true)
			.text('Selected');
	
		this.facetLegendSelect.append('rect')
			.attr('x', textOffset + selectedTextWidth + betweenPad + lineWidth)
			.attr('y', -lineWidth/2)
			.attr('width', lineWidth)
			.attr('height', lineWidth)
			.attr('stroke', 'none')
			.attr('fill', 'rgb(236, 236, 236)');

		this.facetLegendSelect.append('line')
			.attr('x1', textOffset + selectedTextWidth + betweenPad + lineWidth)
			.attr('x2', textOffset + selectedTextWidth + betweenPad + 2 * lineWidth)
			.attr('y1', -lineWidth/2)
			.attr('y2', -lineWidth/2)
			.attr('stroke-width', 1)
			.attr('stroke', 'black')
			.attr('opacity', 0.6);

		this.facetLegendSelect.append('text')
			.attr('alignment-baseline', 'middle')
			.attr('transform', `translate(${2 * lineWidth + 2 * textOffset + selectedTextWidth + betweenPad},0)`)
			.classed('smallText', true)
			.text('All');
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

			this.svgFacetSelect.attr('width', this.width);
			this.svgFacetSelect.attr('height', this.height);

			this.averageLegendSelect.attr('transform', `translate(${this.margin.left + this.vizWidth - 60}, ${this.margin.top + this.vizHeight + 30})`);
			this.facetLegendSelect.attr('transform', `translate(${this.margin.left + this.vizWidth - 60}, ${this.margin.top + this.vizHeight + 30})`);
		

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