import * as d3 from 'd3';
import {HtmlSelection, SvgSelection, ToolbarElement, ToolbarOptionSelect} from '../devlib/DevLibTypes';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { BaseWidget } from './BaseWidget';
import { CurveList } from '../DataModel/CurveList';
import { dataFilter, DatasetSpec, valueFilter } from '../types';
import { DataEvents } from '../DataModel/DataEvents';
import { IDBPDatabase, openDB } from 'idb';

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

	private _modalBooleans : boolean[];
	public get modalBooleans() : boolean[] {
		return this._modalBooleans;
	}

	private _yKey : string;
	public get yKey() : string {
		return this._yKey;
	}
	
	private _dataStore : IDBPDatabase<unknown>;
	public get dataStore() : IDBPDatabase<unknown> {
		return this._dataStore;
	}

	private initToolbarElements(): void
	{
		this._toolbarElements = [
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
				iconKey: 'home',
				callback: (state: {shown: boolean, index: number}) => this.onHouseClick(state),
				tooltip: 'Return to overview screen'
			},
			{
				type: 'popupButton',
				iconKey: 'filter',
				callback: (state: {shown: boolean, index: number}) => this.onDataFilterClick(state),
				tooltip: 'View and modify data filters'
			},
			{
				type: 'popupButton',
				iconKey: 'trash',
				callback: (state: {shown: boolean, index: number}) => this.onGarbageClick(state),
				tooltip: 'Delete cached data'
			},
			{
				type: 'toggleButton',
				iconKeys: ['bacon', 'chart-line'],
				callback: (state: boolean) => this.onBaconClick(state),
				tooltips: ['', ''] // todo - fill this in if tooltips actually get consumed ever.
			}
		]
	}

	protected init(): void
	{
		this._wrapperDiv = document.createElement("div");
		this.wrapperDiv.classList.add("wrapperDiv");
		this.container.appendChild(this.wrapperDiv);
		this._yKey = 'Mass_norm';
		this._modalBooleans = [];

		this.initToolbarElements();
		this.drawToolbarElements();
		this.initModalPopup();

		document.addEventListener('averageCurveKeyChange', (e: CustomEvent) => 
		{
			this._yKey = e.detail.yKey;
		});
        openDB('loon-db').then(dataStore => this._dataStore = dataStore);
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
				const thisIndex = this.modalBooleans.length;
				this.modalBooleans.push(false);

				let button = DevlibTSUtil.getIconButton(toolbarElement.iconKey, null);
				button.classList.add('big');
				this.wrapperDiv.append(button);
				button.onclick = () => this.toggleModalButton(thisIndex, toolbarElement)
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


	private toggleModalButton(buttonIndex: number, toolbarElement?: ToolbarElement): void
	{

		if (buttonIndex !== -1 && this.modalBooleans[buttonIndex])
		{
			this.modalBooleans[buttonIndex] = false;
		}
		else
		{
			for (let i = 0; i < this.modalBooleans.length; i++)
			{
				this.modalBooleans[i] = false;
			}
			if (buttonIndex !== -1)
			{
				this.modalBooleans[buttonIndex] = true;
			}
		}

		const show = this.modalBooleans[buttonIndex]
		if (toolbarElement)
		{
			toolbarElement.callback({shown: show, index: buttonIndex});
		}
		if (show)
		{
			DevlibTSUtil.show(this.modalPopupDiv);
		}
		else
		{
			DevlibTSUtil.hide(this.modalPopupDiv);
		}
	}

	private initModalPopup(): void
	{
		this._modalPopupDiv = document.createElement("div");
		this.modalPopupDiv.classList.add("toolbarPopup");
		DevlibTSUtil.hide(this.modalPopupDiv);
		this.container.appendChild(this.modalPopupDiv);
	}

	private getOffsetFromIndex(index: number): number
	{
		let button = this.wrapperDiv.querySelectorAll(':scope > .basicIconButton')[index];
		return button.getBoundingClientRect().top;
	}

	private onDataFilterClick(state: {shown: boolean, index: number}): void
	{
		this.modalPopupDiv.innerHTML = null;
		if (!state.shown)
		{
			return;
		}

		let outer = d3.select(this.modalPopupDiv);
		outer.classed('narrow', false);

		outer.node().style.flexDirection = 'row';
		outer.node().style.alignItems = 'flex-start';
		outer.node().style.top = this.getOffsetFromIndex(state.index) + 'px';

		const selectionDiv = outer.append('div');
		const convertDiv = outer.append('div');
		const filterDiv = outer.append('div');
			
		this.displayFilters(
			selectionDiv,
			'Current Selection',
			'The currently highlighted selection contains data that meet all of the following conditions.',
			this.data.GetAllFilters(),
			false,
			state.index);


		let buttonElement = DevlibTSUtil.getIconButton('long-arrow-alt-right', () => this.triggerSelectionToFilterEvent(state.index), 'Convert ');

		convertDiv.attr('style', 'align-self: center;').node().appendChild(buttonElement);

		this.displayFilters(
			filterDiv,
			'Current Filters',
			'Only show tracks that meet all of the following conditions.',
			this.fullData.GetAllFilters(),
			true,
			state.index);
	}

	private displayFilters(
		containerSelect: HtmlSelection,
		title: string,
		description: string,
		filterList: dataFilter[],
		isFilter: boolean,
		index: number): void
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
				if (isFilter)
				{
					return `Tracks where <b>${f.key}</b> is in range [${low}, ${high}] at least once.`;
				}
				else
				{
					return `Cell instances where <b>${f.key}</b> is in range [${low}, ${high}]`;
				}
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
		
		if (isFilter)
		{
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
					this.onDataFilterClick({shown: true, index: index});
				})
				.html('<i class="fas fa-minus"></i>');
		}

	}

	private triggerSelectionToFilterEvent(index: number): void
	{
		document.dispatchEvent(new CustomEvent(DataEvents.selectionToFilter));
		this.onDataFilterClick({shown: true, index: index});
	}

	private onHouseClick(state: {shown: boolean, index: number}): void
	{
		this.modalPopupDiv.innerHTML = null;
		if (!state.shown)
		{
			return;
		}
		let outer = d3.select(this.modalPopupDiv);
		outer.classed('narrow', true);

		outer.node().style.flexDirection = 'column';
		outer.node().style.alignItems = 'center';
		outer.node().style.top = this.getOffsetFromIndex(state.index) + 'px';

		outer.append('div')
			.classed('largeText', true)
			.text('Return to overview page?')

		let buttonDiv = outer.append('div')
			.attr('style', 'display: flex; flex-direction: row');

		buttonDiv.append('button')
			.classed('devlibButton', true)
			.text('Navigate Home')
			.on('click', () => location.href = '/overview');

		buttonDiv.append('button')
			.classed('devlibButton', true)
			.text('Stay Here')
			.on('click', () => this.toggleModalButton(state.index));
	}

	private onGarbageClick(state: {shown: boolean, index: number}): void
	{
		this.modalPopupDiv.innerHTML = null;
		if (!state.shown)
		{
			return;
		}
		let outer = d3.select(this.modalPopupDiv);

		outer.classed('narrow', true);

		outer.node().style.flexDirection = 'column';
		outer.node().style.alignItems = 'center';
		
		outer.node().style.top = this.getOffsetFromIndex(state.index) + 'px';

		outer.append('div')
			.classed('largeText', true)
			.text('Delete Cache?')
		
		outer.append('div')
			.classed('mediumText', true)
			.text('Delete cache if your data has been updated since the last cache time. Otherwise, leave the cache as is to improve loading times.')

		outer.append('button')
			.classed('devlibButton', true)
			.text('Delete Cache')
			.on('click', () => this.clearIDBCache());
	}

	private async clearIDBCache(): Promise<void>
	{
		if (this.dataStore)
		{
			const key = this.data.Specification.googleDriveId;
			this.dataStore.delete('tracks', key);
			let keys = await this.dataStore.getAllKeys('images');
			for (let imgKey of keys)
			{
				if (imgKey.toString().includes(key))
				{
					this.dataStore.delete('images', imgKey)
				}
			}
		}
		this.toggleModalButton(-1);
	}
	
	private onBaconClick(state: boolean): void
	{
		const smoothCurveEvent = new CustomEvent('smoothCurveChange', {detail: state});
		document.dispatchEvent(smoothCurveEvent);
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