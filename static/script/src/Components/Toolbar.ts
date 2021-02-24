
import {ToolbarElement} from '../devlib/DevLibTypes';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { BaseWidget } from './BaseWidget';
import { CurveList } from '../DataModel/CurveList';
import { DatasetSpec } from '../types';

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
				type: 'toggleButton',
				iconKeys: ['filter', 'filter'],
				callback: (state: boolean) => console.log('toggle', state),
				tooltips: ['View and modify data filters', 'close']
			},
			{
				type: 'toggleButton',
				iconKeys: ['th', 'th'],
				callback: (state: boolean) => console.log('toggle', state),
				tooltips: ['View and modify conditional filters', 'close']
			}
		]
	}

	protected init(): void
	{
		this._wrapperDiv = document.createElement("div");
		this.wrapperDiv.classList.add("wrapperDiv");

		this.container.appendChild(this.wrapperDiv);
		this.initToolbarElements();
		this.drawToolbarElements();
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