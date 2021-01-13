import {BaseComponent} from './BaseComponent';
// import { UploadFileButton } from './UploadFileButton';
import {ToolbarElement} from '../devlib/DevLibTypes';
import { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { range } from 'd3';

export class Toolbar extends BaseComponent {
	
	constructor(container: Element)
	{
		super(container);
		// this._callback = fileLoadCallback;
		// this._buttonList = buttonPropList;
		// this.initExampleButtons();
	}

	// private _uploadFileButton : UploadFileButton;
	// public get uploadFileButton() : UploadFileButton {
	// 	return this._uploadFileButton;
	// }

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
				callback: () => console.log('home'),
				tooltip: 'Return to overview screen'
			},
			{
				type: 'toggleButton',
				iconKeys: ['eye', 'eye-slash'],
				callback: (state: boolean) => console.log('toggle', state),
				tooltips: ['Showing all cells, click to show only long tracks.', 'Only showing longer tracks, click to show all cells.']
			},
			{
				type: 'optionSelect',
				iconKeys: ['align-justify', 'align-center', 'question', 'question-circle'],
				defaultIndex: 0,
				callback: (state: number) => console.log('option', state),
				tooltips: ['Exemplar mode.', 'Expanded mode.', '', '']
			}
		]
	}

	protected init(): void
	{
		this._wrapperDiv = document.createElement("div");
		this.wrapperDiv.classList.add("wrapperDiv");

		// this._uploadFileButtonWrapper = document.createElement("div");
		// this.wrapperDiv.appendChild(this.uploadFileButtonWrapper);
		// this._uploadFileButton = new UploadFileButton(this.uploadFileButtonWrapper, (data: string, filename: string) => {this.fileLoadCallback(data, filename)})
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
				this.wrapperDiv.append(grouperDiv);
			}
		}
	}

	// private initExampleButtons(): void
	// {
	// 	let textWrapper = document.createElement("div");
	// 	textWrapper.classList.add("exampleHeaderOuter");
	// 	textWrapper.textContent = "Examples: ";
	// 	this.wrapperDiv.appendChild(textWrapper);

	// 	for (let buttonProp of this.buttonList)
	// 	{
	// 		let button: HTMLButtonElement = document.createElement("button");
	// 		button.classList.add("exampleButton");
	// 		button.classList.add("devlibButton");
	// 		button.textContent = buttonProp.displayName;
	// 		button.id = "toolbarButton-" + buttonProp.displayName;
	// 		button.onclick = (ev: Event) => 
	// 		{
	// 			// this.uploadFileButton.ResetValue();
	// 			buttonProp.callback();
	// 		}
	// 		this.wrapperDiv.appendChild(button);
	// 	}

	// }


	protected OnResize(): void
	{
		// do nothing
	}

	// private fileLoadCallback(data: string, filename: string): void
	// {
	// 	this._callback(data);
	// }

	private fileFetchCallback(): void
	{

	}
}