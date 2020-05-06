import * as d3 from 'd3';
import { PointCollection } from '../DataModel/PointCollection';
import { BaseWidget } from './BaseWidget';
import { MetricDistributionCollectionLevel } from '../types';
import { SvgSelection, NDim } from '../devlib/DevLibTypes';
import { CurveList } from '../DataModel/CurveList';


export class DetailedDistribution extends BaseWidget<CurveList> {


    constructor(container: Element, metricDistributionCollectionLevel: MetricDistributionCollectionLevel, attributeKey: string)
    {
        super(container);
        this._metricDistributionCollectionLevel = metricDistributionCollectionLevel;
        this._attributeKey = attributeKey;
        this.setLabel();
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
    public set pointCollection(v : PointCollection) {
        this._pointCollection = v;
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

    private _boxplotContainerSelect : SvgSelection;
    public get boxplotContainerSelect() : SvgSelection {
        return this._boxplotContainerSelect;
    }    

	private _brushGroupSelect : SvgSelection;
	public get brushGroupSelect() : SvgSelection {
		return this._brushGroupSelect;
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
    
    private _median : number;
    public get median() : number {
        return this._median;
    }

    private _quartileRange : [number, number];
    public get quartileRange() : [number, number] {
        return this._quartileRange;
    }

    private _whiskerRange : [number, number];
    public get whiskerRange() : [number, number] {
        return this._whiskerRange;
    }
    
    
    private _scatterplotPadding : number;
    public get scatterplotPadding() : number {
        return this._scatterplotPadding;
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

        this._scatterplotPadding = 8;
        this._mainGroupSelect = this.svgSelect.append("g")
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.scatterplotPadding})`);

        this._boxplotContainerSelect = this.svgSelect.append('g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        this._brushGroupSelect = this.svgSelect.append("g")
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
			.classed("brushContainer", true);

        this._axisPadding = 4;
        this._xAxisGroupSelect = this.svgSelect.append('g')
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.vizHeight + this.axisPadding})`)
            .classed("labelColor", true);
        }

    private setLabel(): void
	{	
		const bufferForAxis = 32 + this.axisPadding;
		this._xLabelTextSelect = this.svgSelect.append('text')
			.attr('transform', `translate(${this.margin.left + this.vizWidth / 2}, ${this.margin.top + this.vizHeight + bufferForAxis})`)
			.classed('axisLabel', true)
            .classed('labelColor', true)
            .classed('noDisp', true)
			.text(this.attributeKey);
    }

    public OnDataChange(): void
    {
        switch (this.metricDistributionCollectionLevel)
        {
            case MetricDistributionCollectionLevel.Point:
                this._pointCollection = this.data as PointCollection;
                break;
            case MetricDistributionCollectionLevel.Curve:
                this._pointCollection = this.data.curveCollection as PointCollection;
                break;
            default:
                throw new Error("DetailedDistribution needs a valid MetricDistributionCollectionLevel");
                this._pointCollection = null;
                break;
        }

        this._randomNoiseList = [];
        for (let i = 0; i < this.pointCollection.length; i++)
        {
            this.randomNoiseList.push(Math.random());
        }
        this.updateBoxplotStats();
        this.updateScales();
        this.draw();
        this.showLabel();
    }

    private updateBoxplotStats(): void
    {
        let validNumbers: number[] = this.pointCollection.Array
                            .map(d => d.get(this.attributeKey)) // get actual value
                            .filter(d => !isNaN(d)) // filter out NaN values.
                            .sort(); // d3.quantile requires it to be sorted. This could technically be done faster without sorting.

        this._median = d3.median(validNumbers);
        let lowQuartile = d3.quantile(validNumbers, 0.25);
        let highQuartile = d3.quantile(validNumbers, 0.75);
        this._quartileRange = [lowQuartile, highQuartile];
        
        let interQuartileRange = highQuartile - lowQuartile;
        let lowWhisker  = lowQuartile  - 1.5 * interQuartileRange;
        let highWhisker = highQuartile + 1.5 * interQuartileRange;
        this._whiskerRange = [lowWhisker, highWhisker];
    }

    private updateScales(): void
    {
        let distributionMinMax = this.pointCollection.getMinMax(this.attributeKey);
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

        this.drawBoxplot();       
        this.drawAxis();
    }


    private showLabel(): void
    {
        this.xLabelTextSelect.classed('noDisp', false);
    }

    private drawBoxplot(): void
    {
        // IQR Box
        this.boxplotContainerSelect.selectAll('rect')
            .data<[number, number]>([this.quartileRange])
          .join('rect')
            .attr('x', d => this.scaleX(d[0]))
            .attr('y', 0)
            .attr('width', d => this.scaleX(d[1]) - this.scaleX(d[0]))
            .attr('height', this.vizHeight)
            .classed('IQR-Box', true);

        // Median
        this.boxplotContainerSelect.selectAll('.boxplotMedianLine')
            .data<number>([this.median])
          .join('line')
            .attr('x1', d => this.scaleX(d))
            .attr('y1', 0)
            .attr('x2', d => this.scaleX(d))
            .attr('y2', this.vizHeight)
            .classed('boxplotMedianLine', true);

        // Horizontal whisker lines
        const vertMiddle = this.vizHeight / 2;
        this.boxplotContainerSelect.selectAll('.boxplotWhiskers')
            .data<[number, number]>([[this.whiskerRange[0], this.quartileRange[0]], [this.whiskerRange[1], this.quartileRange[1]]])
          .join('line')
            .attr('x1', d => this.scaleX(d[0]))
            .attr('y1', vertMiddle)
            .attr('x2', d => this.scaleX(d[1]))
            .attr('y2', vertMiddle)
            .classed('boxplotWhiskers', true);

        // vertical whisker endpoints
        const relativeSize = 0.66; // height of whisker endpoints compared to box height
        const padSize = this.vizHeight * (1 - relativeSize) / 2;
        this.boxplotContainerSelect.selectAll('.boxplotWhiskerEnds')
            .data<number>(this.whiskerRange)
          .join('line')
            .attr('x1', d => this.scaleX(d))
            .attr('y1', padSize)
            .attr('x2', d => this.scaleX(d))
            .attr('y2', this.vizHeight - padSize)
            .classed('boxplotWhiskerEnds', true);
        }

	private drawAxis(): void
	{
		this.xAxisGroupSelect
			.call(d3.axisBottom(this.scaleX));
	}

    public OnResize(): void
    {
        this.updateScales();
        this.draw();
    }

    public OnBrushChange(): void
    {
        this.draw();
    }

}