import * as d3 from 'd3';
import {HtmlSelection, SvgSelection, ToolbarElement} from '../devlib/DevLibTypes';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { BaseWidget } from './BaseWidget';
import { CurveList } from '../DataModel/CurveList';
import { dataFilter, DatasetSpec, valueFilter } from '../types';
import { DataEvents } from '../DataModel/DataEvents';
import { isThisTypeNode } from 'typescript';

export class Toolbar extends BaseWidget<CurveList, DatasetSpec> {
	
	constructor(container: Element)
	{
		super(container);
	}

	private _uploadFileButtonWrapper : HTMLDivElement;
	public get uploadFileButtonWrapper() : HTMLDivElement {
		return this._uploadFileButtonWrapper;
	}
	
	private _toolbarElements : ToolbarElement[];
	public get toolbarElements() : ToolbarElement[] {
		return this._toolbarElements;
	}

	private _wrapperDiv : HTMLDivElement;
	public get wrapperDiv() : HTMLDivElement {
		return this._wrapperDiv;
	}

	private _modalPopupDiv : HTMLDivElement;
	public get modalPopupDiv() : HTMLDivElement {
		return this._modalPopupDiv;
	}
	
	private _yKey : string;
	public get yKey() : string {
		return this._yKey;
	}

	private _tempConditionFilterState : Map<string, Map<string, boolean>>;
	public get tempConditionFilterState() : Map<string, Map<string, boolean>> {
		return this._tempConditionFilterState;
	}

	private _miniCellSelect : SvgSelection;
	public get miniCellSelect() : SvgSelection {
		return this._miniCellSelect;
	}

	private initToolbarElements(): void
	{
		this._toolbarElements = [
			{
				type: 'single',
				iconKey: 'home',
				callback: () => location.href = '/overview',
				tooltip: 'Return to overview screen'
			},
			{
				type: 'optionSelect',
				iconKeys: ['bars', 'stream', 'clone'],
				defaultIndex: 0,
				callback: async (state: number) => {
					let modeChangeEvent: CustomEvent;
					switch (state)
					{
						case 0:
							modeChangeEvent = new CustomEvent('modeChange', {detail: {
								inCondensedMode: true,
								inExemplarMode: true
							}});
							break;
						case 1:
							modeChangeEvent = new CustomEvent('modeChange', {detail: {
								inCondensedMode: false,
								inExemplarMode: true
							}});
							break;
						case 2:
							modeChangeEvent = new CustomEvent('modeChange', {detail: {
								inCondensedMode: false,
								inExemplarMode: false
							}});
							break;
						default:
							break;
					}
					DevlibTSUtil.launchSpinner();
					await DevlibTSUtil.makeAsync(() => document.dispatchEvent(modeChangeEvent));
				},
				tooltips: ['Condensed Mode', 'Expanded Mode', 'Frame Mode']
			},
			{
				type: 'popupButton',
				iconKey: 'filter',
				callback: (state: boolean) => this.onDataFilterClick(state),
				tooltip: 'View and modify data filters'
			},
			{
				type: 'popupButton',
				iconKey: 'th',
				callback: (state: boolean) => this.onConditionFilterClick(state),
				tooltip: 'View and modify conditional filters'
			}
		]
	}

	protected init(): void
	{
		this._wrapperDiv = document.createElement("div");
		this.wrapperDiv.classList.add("wrapperDiv");
		this.container.appendChild(this.wrapperDiv);
		this._yKey = 'Mass_norm';
		this._tempConditionFilterState = new Map<string, Map<string, boolean>>();

		this.initToolbarElements();
		this.drawToolbarElements();
		this.initModalPopup();

		document.addEventListener('averageCurveKeyChange', (e: CustomEvent) => 
		{
			this._yKey = e.detail.yKey;
		});
	}

	private drawToolbarElements(): void
	{
		for (let toolbarElement of this.toolbarElements)
		{
			if (toolbarElement.type === 'single')
			{
				let button = DevlibTSUtil.getIconButton(toolbarElement.iconKey, toolbarElement.callback);
				button.classList.add('big');
				this.wrapperDiv.append(button);
			}
			else if (toolbarElement.type === 'popupButton')
			{
				let buttonTrue = DevlibTSUtil.getIconButton(toolbarElement.iconKey, null);
				buttonTrue.classList.add('big');
				this.wrapperDiv.append(buttonTrue);

				let buttonFalse = DevlibTSUtil.getIconButton(toolbarElement.iconKey, null);
				buttonFalse.classList.add('big');
				this.wrapperDiv.append(buttonFalse);
				DevlibTSUtil.hide(buttonFalse);

				buttonTrue.onclick = () =>
				{
					DevlibTSUtil.hide(buttonTrue);
					DevlibTSUtil.show(buttonFalse);
					toolbarElement.callback(true);
					DevlibTSUtil.show(this.modalPopupDiv);
				}

				buttonFalse.onclick = () =>
				{
					DevlibTSUtil.show(buttonTrue);
					DevlibTSUtil.hide(buttonFalse);
					DevlibTSUtil.hide(this.modalPopupDiv);
					toolbarElement.callback(false);
				}

			}
			else if (toolbarElement.type === 'toggleButton')
			{
				let buttonTrue = DevlibTSUtil.getIconButton(toolbarElement.iconKeys[0], null);
				buttonTrue.classList.add('big');
				this.wrapperDiv.append(buttonTrue);

				let buttonFalse = DevlibTSUtil.getIconButton(toolbarElement.iconKeys[1], null);
				buttonFalse.classList.add('big');
				this.wrapperDiv.append(buttonFalse);
				DevlibTSUtil.hide(buttonFalse);

				buttonTrue.onclick = () =>
				{
					DevlibTSUtil.hide(buttonTrue);
					DevlibTSUtil.show(buttonFalse);
					toolbarElement.callback(true);
				}

				buttonFalse.onclick = () =>
				{
					DevlibTSUtil.show(buttonTrue);
					DevlibTSUtil.hide(buttonFalse);
					toolbarElement.callback(false);
				}

			}
			else if (toolbarElement.type === 'optionSelect')
			{
				let grouperDiv = document.createElement('div');
				grouperDiv.classList.add('optionSelectGrouperDiv');
				let buttonList: HTMLButtonElement[] = [];
				for (let i = 0; i < toolbarElement.iconKeys.length; i++)
				{
					let iconKey = toolbarElement.iconKeys[i];
					let button = DevlibTSUtil.getIconButton(iconKey, null);
					button.classList.add('big');
					if (i === toolbarElement.defaultIndex)
					{
						button.classList.add('selected');
					}
					buttonList.push(button);
					grouperDiv.append(button);
				}

				const removeSelected = () => {
					for (let button of buttonList)
					{
						button.classList.remove('selected');
					}
				}
				for (let i = 0; i < buttonList.length; i++)
				{
					let button = buttonList[i];
					button.onclick = () =>
					{
						removeSelected();
						button.classList.add('selected');
						toolbarElement.callback(i);
					}
				}
				document.addEventListener('changeModeSelect', (e: CustomEvent) => 
				{
					removeSelected();
					buttonList[e.detail].classList.add('selected');
				});
				this.wrapperDiv.append(grouperDiv);
			}
		}
	}

	private initModalPopup(): void
	{
		this._modalPopupDiv = document.createElement("div");
		this.modalPopupDiv.classList.add("toolbarPopup");
		DevlibTSUtil.hide(this.modalPopupDiv);
		this.container.appendChild(this.modalPopupDiv);
	}

	private onDataFilterClick(show: boolean): void
	{
		this.modalPopupDiv.innerHTML = null;
		if (!show)
		{
			return;
		}

		let outer = d3.select(this.modalPopupDiv);
		
		outer.node().style.flexDirection = 'row';
		outer.node().style.alignItems = 'flex-start';

		const selectionDiv = outer.append('div');
		const convertDiv = outer.append('div');
		const filterDiv = outer.append('div');
			
		this.displayFilters(
			selectionDiv,
			'Current Selection',
			'The currently highlighted selection contains data that meet all of the following conditions.',
			this.data.GetAllFilters());


		let buttonElement = DevlibTSUtil.getIconButton('long-arrow-alt-right', () => this.triggerSelectionToFilterEvent(), 'Convert ');

		convertDiv.attr('style', 'align-self: center;').node().appendChild(buttonElement);

		this.displayFilters(
			filterDiv,
			'Current Filters',
			'Only show tracks that meet all of the following conditions.',
			this.fullData.GetAllFilters());
	}

	private displayFilters(
		containerSelect: HtmlSelection,
		title: string,
		description: string,
		filterList: dataFilter[]): void
	{
		containerSelect.classed('filterDisplayContainer', true)
		  .append('div')
			.text(title)
			.classed('largeText', true)
		  .append('div')
			.text(description)
			.classed('smallText', true);
		  
		let filterSelection = containerSelect.append('ul').classed('mediumText', true).selectAll('li')
			.data(filterList)
			.join('li');

		filterSelection.filter(d => d.type === 'cell')
			.html(d => 
			{
				let f = d.filter as valueFilter;
				let low = f.bound[0].toPrecision(5);
				let high = f.bound[1].toPrecision(5);
				return `Cell instances where <b>${f.key}</b> is in range [${low}, ${high}]`;
			});


		filterSelection.filter(d => d.type === 'track')
			.html(d =>
			{
				let f = d.filter as valueFilter;
				let low = f.bound[0].toPrecision(5);
				let high = f.bound[1].toPrecision(5);
				return `Tracks with <b>${f.key}</b> in range [${low}, ${high}]`
			});

		filterSelection.filter(d => d.type === 'curve')
			.html(d => {
				let f1 = (d.filter as [valueFilter, valueFilter])[0];
				let low1 = f1.bound[0].toPrecision(5);
				let high1 = f1.bound[1].toPrecision(5);

				let f2 = (d.filter as [valueFilter, valueFilter])[1];
				let low2 = f2.bound[0].toPrecision(5);
				let high2 = f2.bound[1].toPrecision(5);

				let displayString: string = 'Tracks where ';
				displayString += `<b>${f1.key}</b> is in range [${low1}, ${high1}] and `;
				displayString += `<b>${f2.key}</b> is in range [${low2}, ${high2}]`;
				displayString += ' at least once.';
				return displayString;
			});

		filterSelection.append('button')
			.classed('basicIconButton', true)
			.on('click', d =>
			{
				if (d.type === 'curve')
				{
					this.fullData.removeCurveBrush(d.filterKey);
				}
				else if (d.type === 'track')
				{
					this.fullData.curveCollection.removeBrush(d.filterKey);
				}
				else if (d.type === 'cell')
				{
					this.fullData.removeBrush(d.filterKey);
				}
				document.dispatchEvent(new CustomEvent(DataEvents.applyNewFilter));
				this.onDataFilterClick(true);
			})
			.html('<i class="fas fa-minus"></i>');
	}

	private triggerSelectionToFilterEvent(): void
	{
		document.dispatchEvent(new CustomEvent(DataEvents.selectionToFilter));
		this.onDataFilterClick(true);
	}

	private onConditionFilterClick(show: boolean): void
	{
		this.modalPopupDiv.innerHTML = null;
		if (!show)
		{
			return;
		}
		// copy
		this.tempConditionFilterState.clear();
		for (let [key, value] of this.dataSuperset.conditionFilterState.entries())
		{
			this.tempConditionFilterState.set(key, new Map(value));
		}

		let outer = d3.select(this.modalPopupDiv);
		
		outer.node().style.flexDirection = 'column';
		outer.node().style.alignItems = 'center';

		const margin = {
			top: 20,
			left: 120,
			right: 40,
			bottom: 86
		}

		const miniSize = 64;
		const miniPadding = 8;

		outer.append('div')
			.classed('largeText', true)
			.text('Filter by Condition');

		const defaultFacets = this.data.defaultFacets;
		const defaultAxisTicks = this.fullData.defaultFacetAxisTicks;

		const wCount = defaultAxisTicks.xAxisTicks.length;
		const vizWidth = wCount * miniSize + (wCount - 1) * miniPadding;

		const lCount = defaultAxisTicks.yAxisTicks.length;
		const vizHeight = lCount * miniSize + (lCount - 1) * miniPadding;

		const svgSelect = outer.append('svg')
			.attr('width', vizWidth + margin.left + margin.right)
			.attr('height', vizHeight + margin.top + margin.bottom);

		this.addApplyButton(outer);

		let vizSelect = svgSelect.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`)

		let rowSelect = vizSelect.selectAll('g')
			.data(defaultAxisTicks.yAxisTicks)
			.join('g')
			.classed('row', true)
			.attr('transform', (_, i) => `translate(0, ${i * (miniSize + miniPadding)})`);

		this._miniCellSelect = rowSelect.selectAll('g')
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
		
		this.miniCellSelect.append('rect')
			.attr('width', miniSize)
			.attr('height', miniSize)
			.classed('miniBox', true);
		
		let frameExtent = this.data.getMinMax('Frame ID');
		const scaleX = d3.scaleLinear()
			.domain(frameExtent)
			.range([0, miniSize]);
		
		let minMass = Infinity;
		let maxMass = -Infinity;
		for (let map of defaultFacets.values())
		{
			for (let data of map.values())
			{
				let dataPoints = data.getAverageCurve(this.yKey, true);
				let thisMin = d3.min(data.getAverageCurve(this.yKey), d => d[1]);
				if (this.data.brushApplied && dataPoints.length > 0)
				{
					thisMin = Math.min(thisMin, d3.min(dataPoints, d => d[1]));
				}
				minMass = Math.min(thisMin, minMass);

				let thisMax = d3.max(data.getAverageCurve(this.yKey), d => d[1]);
				if (this.data.brushApplied && dataPoints.length > 0)
				{
					thisMax = Math.max(thisMax, d3.max(dataPoints, d => d[1]));
				}
				maxMass = Math.max(thisMax, maxMass);
			}
		}

		const scaleY = d3.scaleLinear()
			.domain([minMass, maxMass])
			.range([miniSize, 0]);

        let lineAvg = d3.line<[number, number]>()
            .x(d => scaleX(d[0]))
            .y(d => scaleY(d[1]));
					
		this.miniCellSelect.append('path')
			.classed('miniExemplarCurve', true)
			.attr('d', d => 
			{
				let [drugLabel, concLabel] = d;
				if (!defaultFacets.has(drugLabel))
				{
					return ''; // empty when no data
				}
				let row = defaultFacets.get(drugLabel);
				if (!row.has(concLabel))
				{
					return '';
				}
				let data: CurveList = row.get(concLabel)
				let avergeGrowthLine = data.getAverageCurve(this.yKey);
				if (avergeGrowthLine.length === 0)
				{
					return '';
				}
				return lineAvg(avergeGrowthLine);
			});

		if (this.data.brushApplied)
		{
			this.miniCellSelect.append('path')
				.classed('miniExemplarCurve', true)
				.classed('selection', true)
				.attr('d', d => 
				{
					let [drugLabel, concLabel] = d;
					if (!defaultFacets.has(drugLabel))
					{
						return ''; // empty when no data
					}
					let row = defaultFacets.get(drugLabel);
					if (!row.has(concLabel))
					{
						return '';
					}
					let data: CurveList = row.get(concLabel)
					let avergeGrowthLine = data.getAverageCurve(this.yKey, true);
					if (avergeGrowthLine.length === 0)
					{
						return '';
					}
					return lineAvg(avergeGrowthLine);
				});
		}

		let yAxisSelect = svgSelect.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);
		
		const maxLabelWidth = 70;
		const labelPadding = 8;

		const mainLabelSize = 20;

		yAxisSelect.selectAll('text')
			.data([defaultAxisTicks.axisLabels[0]])
		  .join('text')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.attr('transform', `translate(${-maxLabelWidth - labelPadding - mainLabelSize}, ${vizHeight/2}) rotate(-90)`)
			.classed('mediumText', true)
			.text(d => d)

		yAxisSelect.selectAll('foreignObject')
			.data(defaultAxisTicks.yAxisTicks)
		  .join('foreignObject')
			.attr('width', maxLabelWidth)
			.attr('height', miniSize)
			.attr('transform', (d, i) => `translate(${-maxLabelWidth - labelPadding}, ${i * (miniSize + miniPadding)})`)
		  .append('xhtml:div')
			.attr('style', `height: ${miniSize}px;`)
			.classed('y', true)
			.classed('axisButtonContainer', true)
		  .append('button')
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
			.text(d => d);
		
		const maxLabelHeight = 36;

		let xAxisSelect = svgSelect.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top + vizHeight})`);
		
		xAxisSelect.selectAll('text')
			.data([defaultAxisTicks.axisLabels[1]])
		  .join('text')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.attr('transform', `translate(${vizWidth / 2}, ${maxLabelHeight + 2 * labelPadding})`)
			.classed('mediumText', true)
			.text(d => d)

		xAxisSelect.selectAll('foreignObject')
			.data(defaultAxisTicks.xAxisTicks)
		  .join('foreignObject')
			.attr('width', miniSize)
			.attr('height', maxLabelHeight)
			.attr('transform', (d, i) => `translate(${i * (miniSize + miniPadding)}, ${labelPadding})`)
		  .append('xhtml:div')
			.classed('x', true)
			.classed('axisButtonContainer', true)
		  .append('button')
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
			.text(d => d);
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

	private addApplyButton(container: HtmlSelection): void
	{	
		let buttonSelect = container
			.append('div')
				.attr('style', 'display: flex; flex-direction: column; align-items: flex-end; width: 100%')
			.append('button')
			.attr('id', 'conditionFilterApplyButton')
			.text('Apply Filter')
			.classed('devlibButton', true)
			.classed('devlibButton', true)
			.attr('style', 'padding: 8px')
			.on('click', () =>
			{
				this.copyTempConditionsToModel();
				DevlibTSUtil.hide(buttonSelect.node());
				document.dispatchEvent(new CustomEvent(DataEvents.applyNewFilter));
				this.onConditionFilterClick(true);
			});
		DevlibTSUtil.hide(buttonSelect.node());
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

	protected OnResize(): void
	{
		// do nothing
	}

	protected OnDataChange(): void
	{
		// not relevant for this class
	}

	protected Clone(container: HTMLElement): BaseWidget<CurveList, DatasetSpec>
	{
		// not relevant for this class
		return null;
	}

}