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
	

	protected setMargin(): void
	{
		this._margin = {
			top: 8,
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

        this._mainGroupSelect = this.svgSelect.append("g")
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
    
    private showLabel(): void
    {
        this.xLabelTextSelect.classed('noDisp', false);
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

        this.updateScales();
        this.draw();
        this.showLabel();
    }
    
    private draw(): void
    {
        this.mainGroupSelect.selectAll('circle')
            .data<NDim>(this.pointCollection.Array)
          .join('circle')
            .attr('cx', d => this.scaleX(d.get(this.attributeKey)))
            .attr('cy', (d, i) => this.scaleY(this.randomNoiseList[i]))
            .classed('detailedPoint', true)
            .classed('noDisp', d => !d.inBrush || isNaN(d.get(this.attributeKey)));

            this.drawAxis();

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

    private updateScales(): void
    {
        let distributionMinMax = this.pointCollection.getMinMax(this.attributeKey);
        this._scaleX = d3.scaleLinear<number, number>()
                        .domain(distributionMinMax)
                        .range([0, this.vizWidth]);


        this._scaleY = d3.scaleLinear<number, number>()
                        .domain([0, 1]) // bounds of Math.random
                        .range([this.vizHeight, 0]);

    }



}