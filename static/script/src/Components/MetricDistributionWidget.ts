import * as d3 from 'd3';
import {HtmlSelection} from '../devlib/DevLibTypes';
import {DevlibTSUtil} from '../devlib/DevlibTSUtil';
import {BaseWidget} from './BaseWidget';
import {PointCollection} from '../DataModel/PointCollection';
import {CurveList} from '../DataModel/CurveList';
import {LayoutFramework} from '../LayoutFramework';
import {HistogramWidget} from './HistogramWidget';
import {ScatterPlotWidget} from './ScatterPlotWidget';
import {Frame, MetricDistributionSubComponentTypes, Direction, MetricDistributionCollectionLevel, DatasetSpec} from '../types';

interface boolWithIndex {
	value: boolean,
	index: [number, number],
}


export class MetricDistributionWidget extends BaseWidget<CurveList, DatasetSpec> {
	

	constructor(container: Element,
		metricDistributionCollectionLevel: MetricDistributionCollectionLevel,
		isClone: boolean = false)
	{
		super(container, false, metricDistributionCollectionLevel);
		this._isClone = isClone;
	}

    protected Clone(container: HTMLElement): BaseWidget<CurveList, DatasetSpec>
    {
        return new MetricDistributionWidget(container, this.metricDistributionCollectionLevel, true);
    }

	private _isClone : boolean;
	public get isClone() : boolean {
		return this._isClone;
	}

	private _wrapperContainer : HTMLDivElement;
	public get wrapperContainer() : HTMLDivElement {
		return this._wrapperContainer;
	}

	private _layoutFramework : LayoutFramework;
	public get layoutFramework() : LayoutFramework {
		return this._layoutFramework;
	}

	private _subComponentLookup : Map<HTMLElement, MetricDistributionSubComponentTypes>;
	public get subComponentLookup() : Map<HTMLElement, MetricDistributionSubComponentTypes> {
		return this._subComponentLookup;
	}

	private _titleContainerSelection : HtmlSelection;
	public get titleContainerSelection() : HtmlSelection {
		return this._titleContainerSelection;
	}

	private _basisSelectContainerSelection : HtmlSelection;
	public get basisSelectContainerSelection() : HtmlSelection {
		return this._basisSelectContainerSelection;
	}

	private _scatterPlotSelectContainerSelection : HtmlSelection;
	public get scatterPlotSelectContainerSelection() : HtmlSelection {
		return this._scatterPlotSelectContainerSelection;
	}

	private _yAxisMatrixSelect : HtmlSelection;
	public get yAxisMatrixSelect() : HtmlSelection {
		return this._yAxisMatrixSelect;
	}

	private _xAxisMatrixSelect : HtmlSelection;
	public get xAxisMatrixSelect() : HtmlSelection {
		return this._xAxisMatrixSelect;
	}

	private _distributionPlotContainerSelection : HtmlSelection;
	public get distributionPlotContainerSelection() : HtmlSelection {
		return this._distributionPlotContainerSelection;
	}

	private _scatterPlotContainerSelection : HtmlSelection;
	public get scatterPlotContainerSelection() : HtmlSelection {
		return this._scatterPlotContainerSelection;
	}

	private _collapseButtonSelect : HtmlSelection;
	public get collapseButtonSelect() : HtmlSelection {
		return this._collapseButtonSelect;
	}

	private _expandButtonSelect : HtmlSelection;
	public get expandButtonSelect() : HtmlSelection {
		return this._expandButtonSelect;
	}

	private _attributeToIndex : Map<string, number>;
	public get attributeToIndex() : Map<string, number> {
		return this._attributeToIndex;
	}

	private _basisSelectionBooleans : boolean[];
	public get basisSelectionBooleans() : boolean[] {
		return this._basisSelectionBooleans;
	}

	private _scatterplotSelectionBooleans : boolWithIndex[][];
	public get scatterplotSelectionBooleans() : boolWithIndex[][] {
		return this._scatterplotSelectionBooleans;
	}

	private _histogramWidgets : HistogramWidget[];
	public get histogramWidgets() : HistogramWidget[] {
		return this._histogramWidgets;
	}

	private _scatterPlotWidgets : ScatterPlotWidget[];
	public get scatterPlotWidgets() : ScatterPlotWidget[] {
		return this._scatterPlotWidgets;
	}

	private _pointCollection : PointCollection;
	public get pointCollection() : PointCollection {
		return this._pointCollection;
	}

	private _metricDistributionCollectionLevel : MetricDistributionCollectionLevel;
	public get metricDistributionCollectionLevel() : MetricDistributionCollectionLevel {
		return this._metricDistributionCollectionLevel;
	}
	
	private _includeExemplarTrackButton : boolean;
	public get includeExemplarTrackButton() : boolean {
		return this._includeExemplarTrackButton;
	}

	private _showingSelectionMatrix : boolean;
	public get showingSelectionMatrix() : boolean {
		return this._showingSelectionMatrix;
	}

	protected initProps(props?: any[]): void
	{
		super.initProps();
		this._metricDistributionCollectionLevel = props[0];
		this._showingSelectionMatrix = false;
	}

	protected init(): void
	{
		this._wrapperContainer = document.createElement("div");
		this.wrapperContainer.classList.add("frame", "dir-row", "wrapperContainer");
		this.container.appendChild(this.wrapperContainer);

		this._layoutFramework = new LayoutFramework(this.wrapperContainer, false);
		let layout: Frame<MetricDistributionSubComponentTypes> = {
			direction: Direction.row,
			wrap: true,
			overflowScroll: true,
			inside: [
				{
					direction: Direction.column,
					inside: MetricDistributionSubComponentTypes.Title,
					minSize: '100%',
					fraction: 0
				},
				{
					direction: Direction.column,
					minSize: '80px',
					maxSize: '80px',
					inside: MetricDistributionSubComponentTypes.BasisSelect
				},
				{
					direction: Direction.column,
					inside: MetricDistributionSubComponentTypes.ScatterplotSelect
				},
				{
					direction: Direction.column,
					inside: MetricDistributionSubComponentTypes.DistributionPlot
				},
				{
					direction: Direction.column,
					inside: MetricDistributionSubComponentTypes.Scatterplot
				}
			]
		};
		this._subComponentLookup = this.layoutFramework.InitializeLayout<MetricDistributionSubComponentTypes>(layout)
		this.initSubComponents();
	}

	private initSubComponents(): void
	{
		for (let [container, subComponent] of this.subComponentLookup)
		{
			switch (subComponent) {
				case MetricDistributionSubComponentTypes.Title:
					this._titleContainerSelection = this.initSubComponent(container, "titleContainer");
					let title: string;
					if (this.metricDistributionCollectionLevel == MetricDistributionCollectionLevel.Curve)
					{
						title = 'Track-Level Attributes';
					}
					else
					{
						title = 'Cell-Level Attributes';
					}
					this.titleContainerSelection
						.append('div')
						.attr('style', 'width: 32px'); // spacer div
					this.titleContainerSelection
						.append('span')
						.text(title)
						.classed('attributeTitle', true)
						.classed('mediumText', true);
					break;
				case MetricDistributionSubComponentTypes.BasisSelect:
					this._basisSelectContainerSelection = this.initSubComponent(container, "toggleButtonContainer");
					break;
				case MetricDistributionSubComponentTypes.ScatterplotSelect:
					let wrapper = d3.select(container).append('div')
						.classed("matrixWrapperContainer", true)
						.attr("id", "matrixWrapperContainer");

					this._yAxisMatrixSelect = this.initSubComponent(wrapper.node(), "yAxisMatrixContainer");
						
					let rightWrapper = wrapper.append('div')
						.classed("matrixRightWrapperContainer", true);

					this._scatterPlotSelectContainerSelection = this.initSubComponent(rightWrapper.node(), "matrixContainer");
					this._xAxisMatrixSelect = this.initSubComponent(rightWrapper.node(), "xAxisMatrixContainer");
					let collapseExpandList: HTMLElement[] = [
						this.basisSelectContainerSelection.node().parentElement,
						wrapper.node().parentElement
					];
					this.hideElements(collapseExpandList); // collapsed by default
					this.initExpandCollapseButton(collapseExpandList);
					break;
				case MetricDistributionSubComponentTypes.DistributionPlot:
					this._distributionPlotContainerSelection = this.initSubComponent(container, "distributionPlotContainer");
					this.distributionPlotContainerSelection.node().style.minWidth = '300px'; // this is hardcoded based on max width of histogram
					this.distributionPlotContainerSelection.node().style.maxWidth = '300px'; // this is hardcoded based on max width of histogram
					break;
				case MetricDistributionSubComponentTypes.Scatterplot:
					this._scatterPlotContainerSelection = this.initSubComponent(container, "scatterPlotOuterContainer");
					
					this._scatterPlotContainerSelection.node().style.minWidth = '300px'; // this is hardcoded based on max width of scatterplot
					this._scatterPlotContainerSelection.node().style.maxWidth = '300px'; // this is hardcoded based on max width of scatterplot
					break;
				default:
					break;
			}
		}
		this.resizeSubComponents();
	}

	private initSubComponent(container: HTMLElement, className: string): HtmlSelection
	{
		return d3.select(container)			
			.append("div")
			.classed(className, true)
			// .classed("overflow-scroll", true)
			.attr("id", className);
	}

	private hideElements(toHide: HTMLElement[]): void
	{
		for (let element of toHide)
		{
			element.classList.add("noDisp");
		}
	}

	private initExpandCollapseButton(toShow: HTMLElement[]): void
	{
		this._expandButtonSelect = this.titleContainerSelection.append('button')
			// .lower()
			.classed('basicIconButton', true)
			.classed('tab', true)
			.classed('noDisp', true)
			.attr('id', 'MetricDistributionWidget-expandButton')
			.attr("title", "Open distribution selection widget.")
			.on('click', () =>
			{
				if (this.showingSelectionMatrix)
				{
					for (let element of toShow)
					{
						element.classList.add('noDisp');
					}
					this.expandButtonSelect.classed('selected', false);
				}
				else
				{
					for (let element of toShow)
					{
						element.classList.remove('noDisp');
					}
					this.expandButtonSelect.classed('selected', true);
				}
				this._showingSelectionMatrix = !this.showingSelectionMatrix;
			});
		let icon = DevlibTSUtil.getFontAwesomeIcon('cog');
		this.expandButtonSelect.node().appendChild(icon);
	}

	public OnDataChange(): void
	{
		switch (this.metricDistributionCollectionLevel)
		{
			case MetricDistributionCollectionLevel.Point:
				this._pointCollection = this.data as PointCollection;
				this._includeExemplarTrackButton = false;
				break;
			case MetricDistributionCollectionLevel.Curve:
				this._pointCollection = this.data.curveCollection as PointCollection;
				this._includeExemplarTrackButton = true;
				break;
			default:
				this._pointCollection = null;
				this._includeExemplarTrackButton = false;
				throw new Error('MetricDistributionCollectionLevel not set.')
				break;
		}

		this._attributeToIndex = new Map<string, number>();
		for (let [index, attr] of this.pointCollection.attributeList.entries())
		{
			this.attributeToIndex.set(attr, index);
		}

		this.updateUIData();
		this.drawBasisSelect();
		this.drawScatterPlotSelectContainerSelection();
		this.drawMatrixAxis();
		this.expandButtonSelect.classed('noDisp', false);
		this.drawHistograms();
		this.drawScatterPlots(this.getScatterOptionsMatrix());
	}

	public OnBrushChange(): void
	{
		for (let hist of this.histogramWidgets)
		{
			hist.OnBrushChange();
		}

		for (let scatter of this.scatterPlotWidgets)
		{
			scatter.OnBrushChange();
		}
	}

	private updateUIData(): void
	{
		this._basisSelectionBooleans = [];
		// Todo - it would be nice if this was configurable.
		const defaultIncluded = new Set(['Mass (pg)', 'Time (h)', 'Mass_norm', 'Track Length', 'Avg. Mass (pg)', 'Growth Rate', 'Exponential Growth Constant']);

		const maxDefaultMatrixSize = 15
		this._scatterplotSelectionBooleans = [];
		for (let [rowIndex, attr1] of this.pointCollection.attributeList.entries())
		{
			this.basisSelectionBooleans.push(rowIndex < maxDefaultMatrixSize && defaultIncluded.has(attr1));
			let row: boolWithIndex[] = [];
			for (let [colIndex, attr2] of this.pointCollection.attributeList.entries())
			{
				row.push({
					value: attr1 === attr2,
					index: [rowIndex, colIndex]
					});
			}
			this.scatterplotSelectionBooleans.push(row);
		}
		this.drawBasisSelect();
	}

	private drawBasisSelect(): void
	{
		let thisWidget = this;
		let flatData = this.getScatterOptionsMatrix();
		this.basisSelectContainerSelection
			.selectAll("button")
			.data(this.pointCollection.attributeList)
			.join("button")
			.text(d => d)
			.attr('title', d => d)
			.classed("toggleButton", true)
			.classed("on", (d, i) => this.basisSelectionBooleans[i])
			.attr("id", d => "MetricDistributionWidget-varSelect-" + d)
			.on('click', function(d, i)
			{
				let buttonSelect = d3.select(this);
				let turnOn = !thisWidget.basisSelectionBooleans[i];
				buttonSelect.classed("on", turnOn);
				thisWidget.basisSelectionBooleans[i] = turnOn;
				thisWidget.drawScatterPlotSelectContainerSelection();
				thisWidget.drawMatrixAxis();
				thisWidget.updateHistograms();
				thisWidget.updateScatterPlots(flatData);
			});
	}

	private drawMatrixAxis(): void
	{
		const buttonWidth = 80;
		const buttonHeight = 18;
		let options = this.getCurrentOptions();
		this.yAxisMatrixSelect.selectAll("button")
			.data(options)
		  .join("button")
			.classed('axisButton', true)
			.classed('y', true)
			.attr("style", (d, i) => `
				width: ${buttonWidth}px;
				height: ${buttonHeight}px;`)
			.text(d => d)
			.attr('title', d => d)
			.on("click", (d) => {
				let rowIndex = this.attributeToIndex.get(d);
				let row: boolWithIndex[] = this.scatterplotSelectionBooleans[rowIndex];
				let allTrue = true;
				for (let cell of row)
				{
					if (this.basisSelectionBooleans[cell.index[1]])
					{
						if (!cell.value)
						{
							allTrue = false;
						}
						cell.value = true;
					}
				}
				if (allTrue)
				{
					for (let cell of row)
					{
						if (this.basisSelectionBooleans[cell.index[1]])
						{
							cell.value = false;
						}
					}
				}

				this.afterMultipleMatrixChanges();
			})
			.on("mouseenter", function(d)
			{
				d3.select(this).classed("hovered", true);
			})
			.on("mouseleave", function(d)
			{
				d3.select(this).classed("hovered", false);
			});

		// add triangle quick selects
		const triangleButtonSvg = this.yAxisMatrixSelect.selectAll('svg')
			.data([42])
			.join('svg')
			.attr('width', buttonWidth)
			.attr('height', buttonWidth)
			.classed('triangleQuickSelect', true)
			.raise();


		const trianglePad = 4;
		const triangleScale = d3.scaleLinear()
			.domain([0, 1])
			.range([trianglePad, buttonWidth - trianglePad])

		const gap = 0.05;
		const upperTrianglePoints: [number, number][] = [[gap, 0], [1, 0], [1, 1 - gap], [gap, 0]];
		const lowerTrianglePoints: [number, number][] = [[0, gap], [1 - gap, 1], [0, 1], [0, gap]];

		const line = d3.line<[number, number]>()
			.x(d => triangleScale(d[0]))
			.y(d => triangleScale(d[1]));

		triangleButtonSvg.selectAll('path')
			.data([upperTrianglePoints, lowerTrianglePoints])
			.join('path')
			.attr('d', d => line(d))
			.classed('triangleButton', true)
			.on('mouseenter', function(d) 
			{
				d3.select(this).classed('hover', true);
			})
			.on('mouseleave', function(d) 
			{
				d3.select(this).classed('hover', false);
			})
			.on('click', (d, i) => 
			{
				if (i == 0)
				{
					this.toggleUpperTriangle();
					this.afterMultipleMatrixChanges();
				}
				else
				{
					this.toggleLowerTriangle();
					this.afterMultipleMatrixChanges();
				}
			});

		const halfWidth = buttonWidth / 2; 
		const rotate = -90;
		const theta = Math.PI * rotate / 180;
		const xOffset = -0.5 * (buttonWidth + buttonWidth * Math.cos(-theta) + buttonHeight * Math.sin(-theta));
		const yOffset = 0.5 * (buttonWidth * Math.sin(-theta) + buttonHeight * Math.cos(-theta) - buttonHeight);

		let theta2 = 90 + rotate;
		theta2 = Math.PI * theta2 / 180;
		const horizontalPadding = 2;
		let stepSize = horizontalPadding + buttonHeight / Math.cos(theta2);


		this.xAxisMatrixSelect.selectAll("button")
			.data(options)
		  .join("button")
			.classed('axisButton', true)
			.classed('x', true)
			.attr("style", (d, i) => `
				width: ${buttonWidth}px;
				height: ${buttonHeight}px;
				transform: translate( ${stepSize * (i + 1) + xOffset}px, ${yOffset}px) rotate(${rotate}deg);`)
			.text(d => d)
			.attr('title', d => d)
			.on("click", (d) => {
				let colIndex = this.attributeToIndex.get(d);
				let allTrue = true;
				for (let row of this.scatterplotSelectionBooleans)
				{
					for (let cell of row)
					{
						let cellRowIndex = cell.index[0];
						let cellColIndex = cell.index[1];

						if (colIndex === cellColIndex && this.basisSelectionBooleans[cellRowIndex])
						{
							if (!cell.value)
							{
								allTrue = false;
							}
							cell.value = true;
						}
					}
				}

				if (allTrue)
				{
					for (let row of this.scatterplotSelectionBooleans)
					{
						for (let cell of row)
						{
							let cellRowIndex = cell.index[0];
							let cellColIndex = cell.index[1];

							if (colIndex === cellColIndex && this.basisSelectionBooleans[cellRowIndex])
							{
								cell.value = false;
							}
						}
					}
				}
				
				this.afterMultipleMatrixChanges();
			})
			.on("mouseenter", function(d)
			{
				d3.select(this).classed("hovered", true);
			})
			.on("mouseleave", function(d)
			{
				d3.select(this).classed("hovered", false);
			});
	}

	private toggleUpperTriangle(): void
	{
		this.toggleTriangle(true);
	}

	private toggleLowerTriangle(): void
	{
		this.toggleTriangle(false);
	}

	private toggleTriangle(upper: boolean): void
	{

		let allTrue = true;
		for (let i = 0; i < this.scatterplotSelectionBooleans.length; i++)
		{
			if (!this.basisSelectionBooleans[i])
			{
				continue;
			}
			let row: boolWithIndex[] = this.scatterplotSelectionBooleans[i];
			let low: number;
			let high: number;
			if (upper)
			{
				low = i + 1;
				high = row.length;
			}
			else
			{
				low = 0;
				high = i;
			}
			for (let j = low; j < high; j++)
			{
				if (!this.basisSelectionBooleans[j])
				{
					continue;
				}
				if (!row[j].value)
				{
					allTrue = false;
					break;
				}
			}
			if (!allTrue)
			{
				break;
			}
		}

		const newValue = !allTrue;
		for (let i = 0; i < this.scatterplotSelectionBooleans.length; i++)
		{
			if (!this.basisSelectionBooleans[i])
			{
				continue;
			}
			let row: boolWithIndex[] = this.scatterplotSelectionBooleans[i];
			let low: number;
			let high: number;
			if (upper)
			{
				low = i + 1;
				high = row.length;
			}
			else
			{
				low = 0;
				high = i;
			}
			for (let j = low; j < high; j++)
			{
				if (this.basisSelectionBooleans[j])
				{
					row[j].value = newValue;
				}
			}
		}
	}

	private getCurrentOptions(): string[]
	{
		return this.pointCollection.attributeList.filter((d, i) => this.basisSelectionBooleans[i]);
	}

	private afterMultipleMatrixChanges(): void
	{
		this.updateMatrixCellSelections();
		let flatData = this.getScatterOptionsMatrix()
		this.updateHistograms();
		this.updateScatterPlots(flatData);
	}

	private updateMatrixCellSelections(): void
	{
		this.scatterPlotSelectContainerSelection
			.selectAll("div")
			.data(this.scatterplotSelectionBooleans)
		  .join("div")
			.selectAll("button")
			.data(d => d)
		  .join("button")
		  	.classed("on", d=> d.value);
	}

	private drawScatterPlotSelectContainerSelection(): void
	{
		let thisWidget = this;
		let flatData = this.getScatterOptionsMatrix();
		this.scatterPlotSelectContainerSelection
			.selectAll("div")
			.data(this.scatterplotSelectionBooleans)
		  .join("div")
			.classed("rowContainer", true)
			.classed("noDisp", (d, i) => !thisWidget.basisSelectionBooleans[i] )
			.selectAll("button")
			.data(d => d)
		  .join("button")
		  	.classed("squareButton", true)
		  	.classed("on", d=> d.value)
		  	.classed("noDisp", (d, i) => !thisWidget.basisSelectionBooleans[i])
			.attr("id", d => "MetricDistributionWidget-scatterSelect-" + d.index[0] + "-" + d.index[1])
			.on("click", function(d, i)
			{
				let buttonSelect = d3.select(this);
				let turnOn = !d.value;
				buttonSelect.classed("on", turnOn);
				thisWidget.scatterplotSelectionBooleans[d.index[0]][i].value = turnOn;
				if (i === d.index[0])
				{
					thisWidget.updateHistograms();
				}
				else
				{
					thisWidget.updateScatterPlots(flatData);
				}
			})
			.on("mouseenter", function (d)
			{
				let [rowIdx, colIdx] = d.index;
				let buttonSelect = d3.select(this);
				buttonSelect.classed("hovered", true);
				let options = thisWidget.getCurrentOptions();
				let rowName = thisWidget.pointCollection.attributeList[rowIdx];
				let colName = thisWidget.pointCollection.attributeList[colIdx];
				thisWidget.yAxisMatrixSelect.selectAll("button")
					.data(options)
					.classed("hovered", d => d === rowName);

				thisWidget.xAxisMatrixSelect.selectAll("button")
					.data(options)
					.classed("hovered", d => d === colName);
			})
			.on("mouseleave", function (d)
			{
				let buttonSelect = d3.select(this);
				buttonSelect.classed("hovered", false);

				let options = thisWidget.getCurrentOptions();
				thisWidget.yAxisMatrixSelect.selectAll("button")
					.data(options)
					.classed("hovered", false);

				thisWidget.xAxisMatrixSelect.selectAll("button")
					.data(options)
					.classed("hovered", false);
			});
	}

	private drawHistograms(): void
	{
		let thisWidget = this;
		this._histogramWidgets = [];

		let parentElement = this.distributionPlotContainerSelection.node().parentElement;
		parentElement.classList.remove("noDisp");


		this.distributionPlotContainerSelection.html(null)
			.classed("noDisp", false)
			.selectAll("div")
			.data(this.pointCollection.attributeList)
		  .join("div")
			.classed("histogramContainer", true)
			.attr("id", d => "MetricDistributionWidget-histogramContainer-" + d)
			.each(function(d)
			{
				let container = this as HTMLDivElement;
				const canBrush = true;
				let newWidget = new HistogramWidget(container, d, canBrush, thisWidget.includeExemplarTrackButton);
				thisWidget.histogramWidgets.push(newWidget);
			});
		this.updateHistograms();
	}

	
	private updateHistograms(): void
	{
		let thisWidget = this;
		let allHidden = true;
		this.distributionPlotContainerSelection
			.selectAll(".histogramContainer")
			.data(this.pointCollection.attributeList)
			.classed("noDisp", (d, i) => 
			{
				let shouldHide = this.shouldHide(i);
				if (!shouldHide)
				{
					allHidden = false;
				}
				return shouldHide;
			})
			.each(function(d, i)
			{
				let container = this as HTMLDivElement;
				let histogramWidget = thisWidget.histogramWidgets[i];
				if (!thisWidget.shouldHide(i) && !histogramWidget.data)
				{
					histogramWidget.SetData(thisWidget.pointCollection)
				}
			});

		let parentElement = this.distributionPlotContainerSelection.node().parentElement;
		if (allHidden)
		{
			parentElement.classList.add("noDisp");
		}
		else
		{
			parentElement.classList.remove("noDisp");
		}
	}



	private getScatterOptionsMatrix(): boolWithIndex[]
	{
		let flatData = this.scatterplotSelectionBooleans.flat();
		flatData = flatData.filter(d => d.index[0] !== d.index[1]);
		return flatData;
	}

	private drawScatterPlots(flatData: boolWithIndex[]): void
	{
		this._scatterPlotWidgets = [];
		let thisWidget = this;

		let parentElement = this.scatterPlotContainerSelection.node().parentElement;
		parentElement.classList.remove("noDisp");

		this.scatterPlotContainerSelection.html(null)
			.selectAll("div")
			.data(flatData)
			.join("div")
			.classed("scatterPlotContainer", true)
			.each(function(d)
			{
				let container = this as HTMLDivElement;
				let xKey = thisWidget.pointCollection.attributeList[d.index[1]];
				let yKey = thisWidget.pointCollection.attributeList[d.index[0]];
				let newWidget = new ScatterPlotWidget(container, xKey, yKey);
				thisWidget.scatterPlotWidgets.push(newWidget);
			});
		this.updateScatterPlots(flatData);
	}

	private updateScatterPlots(flatData: boolWithIndex[]): void
	{
		let thisWidget = this;

		let allHidden = true;

		this.scatterPlotContainerSelection
			.selectAll(".scatterPlotContainer")
			.data(flatData)
			.classed("noDisp", (d) =>
			{
				let shouldHide = this.shouldHide(d);
				if (!shouldHide)
				{
					allHidden = false;
				}
				return shouldHide;
			})
			.each(function(d, i)
			{
				let scatterWidget = thisWidget.scatterPlotWidgets[i];
				if (!thisWidget.shouldHide(d) && !scatterWidget.data)
				{
					scatterWidget.SetData(thisWidget.pointCollection)
				}
			});
		let parentElement = this.scatterPlotContainerSelection.node().parentElement;
		if (allHidden)
		{
			parentElement.classList.add("noDisp");
		}
		else
		{
			parentElement.classList.remove("noDisp");
		}
	}

	private shouldHide(d: boolWithIndex | number): boolean
	{
		if (typeof d === "number")
		{
			if (!this.basisSelectionBooleans[d])
			{
				return true;
			}
			return !this.scatterplotSelectionBooleans[d][d].value;

		}
		if (!this.basisSelectionBooleans[d.index[0]] || !this.basisSelectionBooleans[d.index[1]])
		{
			return true;
		}
		return !d.value;
	}

	protected OnResize(): void
	{
		this.resizeSubComponents();
	}

	private resizeSubComponents(): void
	{
		// this.layoutFramework.container.chil
		// this.basisSelectContainerSelection.node().style.maxHeight = this.height + "px"
		// this.basisSelectContainerSelection.node().style.maxHeight = this.height + "px"
		// this.scatterPlotSelectContainerSelection.node().style.maxHeight = this.height + "px"
		// this.distributionPlotContainerSelection.node().style.maxHeight = this.height + "px"
		this.scatterPlotContainerSelection.node().style.maxHeight = this.height + "px"
	}

}