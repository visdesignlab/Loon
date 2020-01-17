import {BaseComponent} from './BaseComponent';
// import { UploadFileButton } from './UploadFileButton';
import {ButtonProps} from '../devlib/DevLibTypes';

export class Toolbar extends BaseComponent{
	
	constructor(container: Element, fileLoadCallback: (data: string) => any, buttonPropList: ButtonProps[])
	{
		super(container);
		this._callback = fileLoadCallback;
		this._buttonList = buttonPropList;
		this.initExampleButtons();
	}

	// private _uploadFileButton : UploadFileButton;
	// public get uploadFileButton() : UploadFileButton {
	// 	return this._uploadFileButton;
	// }

	private _uploadFileButtonWrapper : HTMLDivElement;
	public get uploadFileButtonWrapper() : HTMLDivElement {
		return this._uploadFileButtonWrapper;
	}

	private _callback : (data: string) => any;
	public get callback() : (data: string) => any {
		return this._callback;
	}

	private _buttonList : ButtonProps[];
	public get buttonList() : ButtonProps[] {
		return this._buttonList;
	}

	private _wrapperDiv : HTMLDivElement;
	public get wrapperDiv() : HTMLDivElement {
		return this._wrapperDiv;
	}

	protected init(): void
	{
		this._wrapperDiv = document.createElement("div");
		this.wrapperDiv.classList.add("wrapperDiv");

		this._uploadFileButtonWrapper = document.createElement("div");
		this.wrapperDiv.appendChild(this.uploadFileButtonWrapper);
		// this._uploadFileButton = new UploadFileButton(this.uploadFileButtonWrapper, (data: string, filename: string) => {this.fileLoadCallback(data, filename)})
		this.container.appendChild(this.wrapperDiv);
	}

	private initExampleButtons(): void
	{
		let textWrapper = document.createElement("div");
		textWrapper.classList.add("exampleHeaderOuter");
		textWrapper.textContent = "Examples: ";
		this.wrapperDiv.appendChild(textWrapper);

		for (let buttonProp of this.buttonList)
		{
			let button: HTMLButtonElement = document.createElement("button");
			button.classList.add("exampleButton");
			button.classList.add("devlibButton");
			button.textContent = buttonProp.displayName;
			button.id = "toolbarButton-" + buttonProp.displayName;
			button.onclick = (ev: Event) => 
			{
				// this.uploadFileButton.ResetValue();
				buttonProp.callback();
			}
			this.wrapperDiv.appendChild(button);
		}

	}


	protected OnResize(): void
	{
		// do nothing
	}

	private fileLoadCallback(data: string, filename: string): void
	{
		this._callback(data);
	}

	private fileFetchCallback(): void
	{

	}
}