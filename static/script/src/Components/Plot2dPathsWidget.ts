import * as d3 from 'd3';
import {BaseWidget} from './BaseWidget';
import {CurveList} from '../DataModel/CurveList';
import {PointND} from '../DataModel/PointND';
import {Margin, SvgSelection, HtmlSelection} from '../devlib/DevLibTypes';
import {DevlibTSUtil} from '../devlib/DevlibTSUtil';

export class Plot2dPathsWidget extends BaseWidget<CurveList> {
	
	constructor(container: Element, xKey: string, yKey: string)
	{
		super(container);
		this._xKey = xKey;
		this._yKey = yKey;
	}

	private _svgSelect : SvgSelection;
	public get svgSelect() : SvgSelection {
		return this._svgSelect;
	}

	private _mainGroupSelect : SvgSelection;
	public get mainGroupSelect() : SvgSelection {
		return this._mainGroupSelect;
	}

	private _playControlsSelect : HtmlSelection;
	public get playControlsSelect() : HtmlSelection {
		return this._playControlsSelect;
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

	private _animationTime : number;
	public get animationTime() : number {
		return this._animationTime;
	}

	//  controls play/pause
	private _animating : boolean;
	public get animating() : boolean {
		return this._animating;
	}

	// true if the animation is full on stopped
	private _animationStopped : boolean;
	public get animationStopped() : boolean {
		return this._animationStopped;
	}

	private _shouldRepeat : boolean;
	public get shouldRepeat() : boolean {
		return this._shouldRepeat;
	}

	private _lastFrameTime : number | null;
	public get lastFrameTime() : number | null {
		return this._lastFrameTime;
	}

	private _timeBound : [number, number];
	public get timeBound() : [number, number] {
		return this._timeBound;
	}

	private _pauseTime : number;
	public get pauseTime() : number {
		return this._pauseTime;
	}

	private _looped : boolean;
	public get looped() : boolean {
		return this._looped;
	}

	protected init(): void
	{
		this._shouldRepeat = true;
		this._lastFrameTime = null;
		this._animationStopped = true;

		this._svgSelect = d3.select(this.container).append("svg")
		this._mainGroupSelect = this.svgSelect.append("g");
		this.mainGroupSelect
			.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

		this.svgSelect.attr("style", 'width: 100%; height: 100%;');

		this._playControlsSelect = d3.select(this.container).append("div")
			.classed("playControlsContainer", true)
			.classed("noDisp", true);

		let playIcon = DevlibTSUtil.getFontAwesomeIcon('play');
		this.playControlsSelect.append("button")
			.attr("title", "play")
			.attr("id", "playButton")
			.classed("playControlButton", true)
			.on("click", () =>
			{
				this.playAnimation();
			})
			.node().appendChild(playIcon);

		let pauseIcon = DevlibTSUtil.getFontAwesomeIcon('pause');
		this.playControlsSelect.append("button")
			.attr("title", "pause")
			.attr("id", "pauseButton")
			.classed("noDisp", true)
			.classed("playControlButton", true)
			.on("click", () =>
			{
				this.pauseAnimation();
			})
			.node().appendChild(pauseIcon);

		let stopIcon = DevlibTSUtil.getFontAwesomeIcon('stop');
		this.playControlsSelect.append("button")
			.attr("title", "stop")
			.classed("playControlButton", true)
			.on("click", () =>
			{
				this.stopAnimation();
			})
			.node().appendChild(stopIcon);

		console.log("should repeat = " + this.shouldRepeat);
		let repeatIcon = DevlibTSUtil.getFontAwesomeIcon('sync-alt') // repeat is only for pro fontawesome people
		this.playControlsSelect.append("button")
			.attr("title", "repeat")
			.attr("id", "repeatButton")
			.classed("playControlButton", true)
			.classed("on", this.shouldRepeat)
			.on("click", () =>
			{
				this._shouldRepeat = !this.shouldRepeat;
				d3.select('#repeatButton').classed("on", this.shouldRepeat);
			})
			.node().appendChild(repeatIcon);
	}

	public playAnimation(): void
	{
		if (!this.animating)
		{
			this._animating = true;
			if (this.animationTime >= this.timeBound[1])
			{
				this._animationTime = this.timeBound[0];
			}
			window.requestAnimationFrame((ts: number) => this.animationStep(ts));
		}
		d3.select('#playButton').classed("noDisp", true);
		d3.select('#pauseButton').classed("noDisp", false);
		this._animationStopped = false;
	}

	public pauseAnimationAtTime(time: number): void
	{
		this._pauseTime = time;
		this._looped = false;
	}

	public stopAnimation(): void
	{
		this.pauseAnimation();
		this.mainGroupSelect.selectAll("circle").remove();
		this._animationTime = this.timeBound[0];
		this._animationStopped = true;
	}

	public pauseAnimation(): void
	{
		this._animating = false;
		this._lastFrameTime = null;
		d3.select('#pauseButton').classed("noDisp", true);
		d3.select('#playButton').classed("noDisp", false);
	}



	public OnDataChange(): void
	{
		this._timeBound = this.data.minMaxMap.get(this.data.inputKey);
		this.stopAnimation();
		this.updateScales();
		this.updatePaths();
		// this.playControlsSelect.classed("noDisp", false);
	}

	private updateScales(): void
	{
		// this code keeps the data aspect ratio square and keeps it centered and as large
		// as possible in it's container
		let containerRatio = this.vizHeight / this.vizWidth;
		let [minX, maxX] = this.data.minMaxMap.get(this.xKey);
		let [minY, maxY] = this.data.minMaxMap.get(this.yKey);
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

	private animationStep(timestep: number): void
	{
		if (!this.animating)
		{
			return;
		}
		if (this.lastFrameTime === null)
		{
			this._lastFrameTime = timestep;
		}
		let elapsedTime = timestep - this.lastFrameTime;
		this._lastFrameTime = timestep;
		this._animationTime += (elapsedTime / 1000);

		if (this.animationTime > this.timeBound[1])
		{
			if (this.shouldRepeat)
			{
				let over = this.animationTime - this.timeBound[1];
				this._animationTime = this.timeBound[0] + over;
				if (this.pauseTime)
				{
					this._looped = true;
				}
			}
			else
			{
				this._animationTime = this.timeBound[1];
				this.pauseAnimation();
			}
		}

		if (this.looped && this.animationTime > this.pauseTime)
		{
			this._animationTime = this.pauseTime;
			this._pauseTime = null;
			this._looped = false;
			this.pauseAnimation();
		}

		this.updateAnimationDots();

		if (this.animating)
		{
			window.requestAnimationFrame((ts: number) => this.animationStep(ts));
		}
	}

	private updateAnimationDots(): void
	{
		if (this.animationStopped)
		{
			return;
		}
		let pointList: PointND[] = this.data.getPointsAtInput(this.animationTime);

		this.mainGroupSelect.selectAll("circle")
			.data(pointList)
		  .join("circle")
			.attr("cx", d => this.scaleX(d.get(this.xKey)))
			.attr("cy", d => this.scaleY(d.get(this.yKey)))
			.attr("r", 4)
			.classed('animationDot', true)
			.classed('inBrush', d => d.inBrush);
	}

	protected OnResize(): void
	{
		// this.setVizWidthHeight();
		if (this.data)
		{
			this.updateScales();
			this.updatePaths();
			this.updateAnimationDots();
		}
	}

	public OnBrushChange(): void
	{
		this.updatePaths();
		this.updateAnimationDots();
	}

}