import * as d3 from 'd3';
import { PointCollection } from '../DataModel/PointCollection';
import { BaseWidget } from './BaseWidget';
import { MetricDistributionCollectionLevel, DatasetSpec } from '../types';
import { SvgSelection, NDim, HtmlSelection } from '../devlib/DevLibTypes';
import { CurveList } from '../DataModel/CurveList';

interface BoxplotStats {
    median: number,
    quartileRange: [number, number],
    whiskerRange: [number, number]
}

export class DetailedDistributionWidget extends BaseWidget<CurveList, DatasetSpec> {


    constructor(container: Element, metricDistributionCollectionLevel: MetricDistributionCollectionLevel, attributeKey: string)
    {
        super(container, true);
        this._metricDistributionCollectionLevel = metricDistributionCollectionLevel;
        this._attributeKey = attributeKey;
        this.setLabel();
    }

    protected Clone(container: HTMLElement): BaseWidget<CurveList, DatasetSpec>
    {
        let clone = new DetailedDistributionWidget(container, this.metricDistributionCollectionLevel, this.attributeKey);
        return clone;
    }

    private _metricDistributionCollectionLevel : MetricDistributionCollectionLevel;
    public get metricDistributionCollectionLevel() : MetricDistributionCollectionLevel {
        return this._metricDistributionCollectionLevel;
    }
    
    private _attributeKey : string;
    public get attributeKey() : string {
        return this._attributeKey;
    }

    private _pointCollection : PointCollection;
    public get pointCollection() : PointCollection {
        return this._pointCollection;
    }

    private _fullPointCollection : PointCollection;
    public get fullPointCollection() : PointCollection {
        return this._fullPointCollection;
    }

    private _randomNoiseList : number[];
    public get randomNoiseList() : number[] {
        return this._randomNoiseList;
    }    

    private _scaleX : d3.ScaleLinear<number, number>;
    public get scaleX() : d3.ScaleLinear<number, number> {
        return this._scaleX;
    }

    private _scaleY : d3.ScaleLinear<number, number>;
    public get scaleY() : d3.ScaleLinear<number, number> {
        return this._scaleY;
    }

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

    private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
    }

    private _totalBoxplotContainerSelect : SvgSelection;
    public get totalBoxplotContainerSelect() : SvgSelection {
        return this._totalBoxplotContainerSelect;
    }  

    private _filteredBoxplotContainerSelect : SvgSelection;
    public get filteredBoxplotContainerSelect() : SvgSelection {
        return this._filteredBoxplotContainerSelect;
    }    

	private _brushGroupSelect : SvgSelection;
	public get brushGroupSelect() : SvgSelection {
		return this._brushGroupSelect;
    }
    
    private _boxplotStatsPopupSelect : HtmlSelection;
    public get boxplotStatsPopupSelect() : HtmlSelection {
        return this._boxplotStatsPopupSelect;
    }
    public set boxplotStatsPopupSelect(v : HtmlSelection) {
        this._boxplotStatsPopupSelect = v;
    }
    

	private _axisPadding :  number;
	public get axisPadding() :  number {
		return this._axisPadding;
	}

	private _xAxisGroupSelect : SvgSelection;
	public get xAxisGroupSelect() : SvgSelection {
		return this._xAxisGroupSelect;
	}

	private _xLabelTextSelect : SvgSelection;
	public get xLabelTextSelect() : SvgSelection {
		return this._xLabelTextSelect;
	}

	private _brush : d3.BrushBehavior<any>;
	public get brush() : d3.BrushBehavior<any> {
		return this._brush;
    }
    
    private _totalBoxplotStats : BoxplotStats;
    public get totalBoxplotStats() : BoxplotStats {
        return this._totalBoxplotStats;
    }

    private _filteredBoxplotStats : BoxplotStats;
    public get filteredBoxplotStats() : BoxplotStats {
        return this._filteredBoxplotStats;
    }
    
    private _scatterplotPadding : number;
    public get scatterplotPadding() : number {
        return this._scatterplotPadding;
    }

    private _betweenBoxplotPadding : number;
    public get betweenBoxplotPadding() : number {
        return this._betweenBoxplotPadding;
    }

	protected setMargin(): void
	{
		this._margin = {
			top: 6,
			right: 8,
			bottom: 56,
			left: 8
		}
	}

    public init(): void
    {
        this._svgSelect = d3.select(this.container).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this._boxplotStatsPopupSelect = d3.select(this.container).append('div')
            .classed('boxplotStatsPopup', true);

        this.hideBoxplotStatsPopup();

        this._scatterplotPadding = 8;
        this._mainGroupSelect = this.svgSelect.append("g")
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.scatterplotPadding})`);
            
        this._totalBoxplotContainerSelect = this.svgSelect.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this._filteredBoxplotContainerSelect = this.svgSelect.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
            
        this._brushGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.classed("brushContainer", true);
            
        this._axisPadding = 4;
        this._xAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight + this.axisPadding})`)
            .classed("labelColor", true);

        this._betweenBoxplotPadding = 4;
    }

    private setLabel(): void
	{	
		this._xLabelTextSelect = this.svgSelect.append('text')
			.classed('axisLabel', true)
            .classed('labelColor', true)
            .classed('noDisp', true)
            .text(this.attributeKey);
        this.positionLabels();
    }

    private positionLabels(): void
    {
		let bufferForAxis = 32 + this.axisPadding;;
		this.xLabelTextSelect
			.attr('transform', `translate(${this.margin.left + this.vizWidth / 2}, ${this.margin.top + this.vizHeight + bufferForAxis})`);
    }



    public OnDataChange(): void
    {
        switch (this.metricDistributionCollectionLevel)
        {
            case MetricDistributionCollectionLevel.Point:
                this._pointCollection = this.data as PointCollection;
                this._fullPointCollection = this.fullData as PointCollection;
                break;
            case MetricDistributionCollectionLevel.Curve:
                this._pointCollection = this.data.curveCollection as PointCollection;
                this._fullPointCollection = this.fullData.curveCollection as PointCollection;
                break;
            default:
                throw new Error("DetailedDistribution needs a valid MetricDistributionCollectionLevel");
                this._pointCollection = null;
                this._fullPointCollection = null;
                break;
        }

        this._randomNoiseList = [];
        for (let i = 0; i < this.pointCollection.length; i++)
        {
            this.randomNoiseList.push(Math.random());
        }
        this.updateTotalBoxplotStats();
        this.updateScales();
        this.draw();
        this.showLabel();
    }

    private updateTotalBoxplotStats(): void
    {
        let validNumbers: number[] = this.pointCollection.Array
                            .map(d => d.get(this.attributeKey)) // get actual value
                            .filter(d => !isNaN(d)) // filter out NaN values.
                            .sort((a, b) => a - b); // d3.quantile requires it to be sorted. This could technically be done faster without sorting.

        this._totalBoxplotStats = DetailedDistributionWidget.calculateBoxplotStats(validNumbers);
    }

    private updateFilteredBoxplotStats(): void
    {
        let validBrushedNumbers: number[] = this.pointCollection.Array
            .filter(d => d.inBrush)
            .map(d => d.get(this.attributeKey)) // get actual value
            .filter(d => !isNaN(d)) // filter out NaN values.
            .sort((a, b) => a - b); // d3.quantile requires it to be sorted. This could technically be done faster without sorting.

        this._filteredBoxplotStats = DetailedDistributionWidget.calculateBoxplotStats(validBrushedNumbers);
    }

    private static calculateBoxplotStats(numbers: number[]): BoxplotStats
    {
        const median = d3.median(numbers);
        let lowQuartile = d3.quantile(numbers, 0.25);
        let highQuartile = d3.quantile(numbers, 0.75);
        const quartileRange: [number, number] = [lowQuartile, highQuartile];
        
        let interQuartileRange = highQuartile - lowQuartile;
        let lowWhisker  = lowQuartile  - 1.5 * interQuartileRange;
        let highWhisker = highQuartile + 1.5 * interQuartileRange;
        const whiskerRange: [number, number] = [lowWhisker, highWhisker];

        let boxplotStats: BoxplotStats = {
            median: median,
            quartileRange: quartileRange,
            whiskerRange: whiskerRange
        }
        return boxplotStats;

    }

    private updateScales(): void
    {
        let distributionMinMax = this.fullPointCollection.getMinMax(this.attributeKey);
        this._scaleX = d3.scaleLinear<number, number>()
                        .domain(distributionMinMax)
                        .range([0, this.vizWidth]);


        this._scaleY = d3.scaleLinear<number, number>()
                        .domain([0, 1]) // bounds of Math.random
                        .range([this.vizHeight - 2 * this.scatterplotPadding, 0]);
    }

    private draw(): void
    {

        // it's probably faster to filter out all the NaNs once than noDisp them all. There might be as many as 50% NaNs
        let validPoints = this.pointCollection.Array.filter(d => !isNaN(d.get(this.attributeKey)));

        // draw jittered scatterplot
        this.mainGroupSelect.selectAll('circle')
            .data<NDim>(validPoints)
          .join('circle')
            .attr('cx', d => this.scaleX(d.get(this.attributeKey)))
            .attr('cy', (d, i) => this.scaleY(this.randomNoiseList[i]))
            .classed('detailedPoint', true)
            .classed('noDisp', d => !d.inBrush);

        if (this.data.brushApplied)
        {
            const smallBoxplotHeight = (this.vizHeight - this.betweenBoxplotPadding) / 2;
            this.drawBoxplot(this.totalBoxplotContainerSelect, this.totalBoxplotStats, 0, smallBoxplotHeight);       
            this.drawBoxplot(this.filteredBoxplotContainerSelect, this.filteredBoxplotStats, smallBoxplotHeight + this.betweenBoxplotPadding, smallBoxplotHeight)
            this.filteredBoxplotContainerSelect.classed('noDisp', false);
        }
        else
        {
            this.drawBoxplot(this.totalBoxplotContainerSelect, this.totalBoxplotStats, 0, this.vizHeight);       
            this.filteredBoxplotContainerSelect.classed('noDisp', true);
        }

        this.drawAxis();
        this.positionLabels();
    }

	protected drawFacetedData(facetOptionIndex: number): void
	{
		super.drawFacetedDataDefault(facetOptionIndex, "100%", "150px");
	}

    private showLabel(): void
    {
        this.xLabelTextSelect.classed('noDisp', false);
    }

    private drawBoxplot(containerSelect: SvgSelection, boxplotStats: BoxplotStats, top: number, height: number): void
    {
        // Median
        containerSelect.selectAll('.boxplotMedianLine')
            .data<number>([boxplotStats.median])
          .join('line')
            .attr('x1', d => this.scaleX(d))
            .attr('y1', top)
            .attr('x2', d => this.scaleX(d))
            .attr('y2', top + height)
            .classed('boxplotMedianLine', true);

        // IQR Box
        containerSelect.selectAll('rect')
            .data<[number, number]>([boxplotStats.quartileRange])
          .join('rect')
            .classed('IQR-Box', true)
            .attr('x', d => this.scaleX(d[0]))
            .attr('y', top)
            .attr('width', d => this.scaleX(d[1]) - this.scaleX(d[0]))
            .attr('height', height)
            .on('mouseover', () =>
            {
                this.showBoxplotStatsPopup(boxplotStats, containerSelect);
            })
            .on('mouseout', () => 
            {
                this.hideBoxplotStatsPopup()
            })

        // Horizontal whisker lines
        const vertMiddle = top + (height / 2);
        containerSelect.selectAll('.boxplotWhiskers')
            .data<[number, number]>([
                [boxplotStats.whiskerRange[0], boxplotStats.quartileRange[0]],
                [boxplotStats.whiskerRange[1], boxplotStats.quartileRange[1]]])
          .join('line')
            .attr('x1', d => this.scaleX(d[0]))
            .attr('y1', vertMiddle)
            .attr('x2', d => this.scaleX(d[1]))
            .attr('y2', vertMiddle)
            .classed('boxplotWhiskers', true);

        // vertical whisker endpoints
        const relativeSize = 0.66; // height of whisker endpoints compared to box height
        const padSize = height * (1 - relativeSize) / 2;
        containerSelect.selectAll('.boxplotWhiskerEnds')
            .data<number>(boxplotStats.whiskerRange)
          .join('line')
            .attr('x1', d => this.scaleX(d))
            .attr('y1', top + padSize)
            .attr('x2', d => this.scaleX(d))
            .attr('y2', top + height - padSize)
            .classed('boxplotWhiskerEnds', true);
    }

    private showBoxplotStatsPopup(boxplotStats: BoxplotStats, boxplotContainer: SvgSelection): void
    {
        this.boxplotStatsPopupSelect.html(null);
        const boundRect = boxplotContainer.node().getBoundingClientRect();

        this.boxplotStatsPopupSelect
            .attr('style', `left: ${(boundRect.left + boundRect.right) / 2}px; top:${boundRect.bottom}px`);

        this.boxplotStatsPopupSelect.append('div')
            .attr('id', 'boxplotStatsPopup-q1')
            .text('Q1: ' + boxplotStats.quartileRange[0].toFixed(4));

        this.boxplotStatsPopupSelect.append('div')
            .attr('id', 'boxplotStatsPopup-median')
            .text('Median: ' + boxplotStats.median.toFixed(4));

        this.boxplotStatsPopupSelect.append('div')
            .attr('id', 'boxplotStatsPopup-q3')
            .text('Q3: ' + boxplotStats.quartileRange[1].toFixed(4));

        this.boxplotStatsPopupSelect.classed('noDisp', false);
    }

    private hideBoxplotStatsPopup(): void
    {
        this.boxplotStatsPopupSelect.classed('noDisp', true);
    }

	private drawAxis(): void
	{
        this.xAxisGroupSelect
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight + this.axisPadding})`)
			.call(d3.axisBottom(this.scaleX));
	}

    public OnResize(): void
    {
        this.updateScales();
        this.draw();
    }

    public OnBrushChange(): void
    {
        this.updateFilteredBoxplotStats();
        this.draw();
    }

}