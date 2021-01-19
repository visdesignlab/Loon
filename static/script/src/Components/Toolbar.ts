import {BaseComponent} from './BaseComponent';
import {ToolbarElement} from '../devlib/DevLibTypes';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { range } from 'd3';

export class Toolbar extends BaseComponent {
	
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
				type: 'toggleButton',
				iconKeys: ['eye-slash', 'eye'],
				callback: (state: boolean) => console.log('toggle', state),
				tooltips: ['Only showing longer tracks, click to show all cells.', 'Showing all cells, click to show only long tracks.']
			},
			{
				type: 'optionSelect',
				iconKeys: ['align-justify', 'align-center', 'question', 'question-circle'],
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
								inExemplarMode: false
							}});
							break;
						case 2:
							modeChangeEvent = new CustomEvent('modeChange', {detail: {
								inCondensedMode: true,
								inExemplarMode: false
							}});
							break;
						case 3:
							modeChangeEvent = new CustomEvent('modeChange', {detail: {
								inCondensedMode: false,
								inExemplarMode: true
							}});
							break;
						default:
							break;
					}
					DevlibTSUtil.launchSpinner();
					await DevlibTSUtil.makeAsync(() => document.dispatchEvent(modeChangeEvent));
				},
				tooltips: ['Exemplar mode.', 'Expanded mode.', '', '']
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
}