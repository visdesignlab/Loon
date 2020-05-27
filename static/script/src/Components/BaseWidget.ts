import { BaseComponent } from './BaseComponent';
import { Margin, ButtonProps } from '../devlib/DevLibTypes';
import  { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { AppData, DatasetSpec } from '../types';
import { OptionSelect } from './OptionSelect';

export abstract class BaseWidget<DataType extends AppData<DataSpecType>, DataSpecType> extends BaseComponent {
	
	constructor(container: Element, canFacet: boolean = false, ...props: any[])
	{
		super(container, ...props);
		this._canFacet = canFacet;
		if (canFacet)
		{
			this.addFacetButton();
		}
		this.initButtonListContainer();		
		this._dataSuperset = null;
	}

	private _data : DataType | null;
	public get data() : DataType | null {
		return this._data;
	}

	private _dataSuperset : DataType | null;
	public get dataSuperset() : DataType | null {
		return this._dataSuperset;
	}

	public get fullData() : DataType | null {
		if (this._dataSuperset)
		{
			return this.dataSuperset;
		}
		return this.data;
	}
	

	protected _margin : Margin;
	public get margin() : Margin {
		return this._margin;
	}

	private _vizWidth : number;
	public get vizWidth() : number {
		return this._vizWidth;
	}

	private _vizHeight : number;
	public get vizHeight() : number {
		return this._vizHeight;
	}

	private _canFacet : boolean;
	public get canFacet() : boolean {
		return this._canFacet;
	}

	public set canFacet(v: boolean) {
		if (!v)
		{
			this.removeFacetButton();
		}
		this._canFacet = v;
	}
	
	private _buttonList : HTMLButtonElement[];
	public get buttonList() : HTMLButtonElement[] {
		if (!this._buttonList)
		{
			this._buttonList = [];
		}
		return this._buttonList;
	}
	
	private _buttonListContainer : HTMLDivElement;
	public get buttonListContainer() : HTMLDivElement {
		return this._buttonListContainer;
	}

	private _facetButton : HTMLButtonElement;
	public get facetButton() : HTMLButtonElement {
		return this._facetButton;
	}
	
	private _largePopupOuter : HTMLDivElement;
	public get largePopupOuter() : HTMLDivElement {
		if (this._largePopupOuter)
		{
			return this._largePopupOuter;
		}
		let largePopupOuter = document.getElementById('largePopupContainerOuter');
		if (largePopupOuter)
		{
			this._largePopupOuter = largePopupOuter as HTMLDivElement;
			return this._largePopupOuter;
		}
		this.initLargePopup();
		return this._largePopupOuter;
	}

	private _largePopup : HTMLDivElement;
	public get largePopup() : HTMLDivElement {
		if (this._largePopup)
		{
			return this._largePopup;
		}
		let largePopup = document.getElementById('largePopupContainer');
		if (largePopup)
		{
			this._largePopup = largePopup as HTMLDivElement;
			return this._largePopup;
		}
		this.initLargePopup();
		return this._largePopup;
	}
	
	private _largePopupContent : HTMLDivElement;
	public get largePopupContent() : HTMLDivElement {
		return this._largePopupContent;
	}	

	protected initProps(props?: any[]): void
	{
		this.setMargin();
	}

	protected setMargin(): void
	{
		this._margin = {
			top: 20,
			right: 20,
			bottom: 20,
			left: 20
		}
	}

	public SetData(data: DataType, dataSuperset?: DataType): void
	{
		this._data = data;
		if (dataSuperset)
		{
			this._dataSuperset = dataSuperset;
		}
		let facetOptions = data.GetFacetOptions();
		if (facetOptions.length === 0)
		{
			this.canFacet = false;
		}
		this.OnDataChange();
	}

	public OnBrushChange(): void
	{
		console.log('base: OnBrushChange');
	}

	protected setWidthHeight(): void
	{
		super.setWidthHeight();
		this._vizWidth = this.width - this.margin.left - this.margin.right;
		this._vizHeight = this.height - this.margin.top - this.margin.bottom;
	}

	protected abstract OnDataChange(): void

	protected abstract Clone(container: HTMLElement): BaseWidget<DataType, DataSpecType>

	private initButtonListContainer(): void
	{
		this._buttonListContainer = document.createElement('div');
		this.buttonListContainer.classList.add('noDisp');
		let style = this.buttonListContainer.style;

		style.position = 'absolute';
		style.right = '0px';
		style.top = '0px';		
		style.pointerEvents = 'none';
		style.display = 'flex';
		style.flexDirection = 'row-reverse';

		// this.buttonListContainer.style.background = 'firebrick';
		this.container.addEventListener('mouseenter', this.onMouseEnter());

		this.container.addEventListener('mouseleave', this.onMouseLeave());
		this.container.appendChild(this.buttonListContainer);
		
		for (let button of this.buttonList)
		{
			this.buttonListContainer.appendChild(button);
		}
	}

	private addFacetButton(): void
	{
		this._facetButton = this.AddButton('layer-group', () =>
		{
			this.drawFacetContent();
		});
	}

	public AddButton(iconKey: string, callback: (ev: MouseEvent) => void): HTMLButtonElement
	{
		let button = DevlibTSUtil.getIconButton(iconKey, callback);
		button.style.pointerEvents = 'all';
		this.buttonList.unshift(button);
		return button;
	}

	private removeFacetButton(): void
	{
		if (this.facetButton)
		{	
			this.buttonListContainer.removeChild(this.facetButton);
		}
	}

	private onMouseEnter(): () => void
	{
		return () => DevlibTSUtil.show(this.buttonListContainer);
	}

	private onMouseLeave(): () => void
	{
		return () => DevlibTSUtil.hide(this.buttonListContainer);
	}

	private drawFacetContent(): void
	{
		this.largePopup.innerHTML = null;

		
		DevlibTSUtil.show(this.largePopupOuter);
		this.drawGroupBySelection();
		let contentContainer = document.createElement('div');
		contentContainer.classList.add('largePopupContent');
		this.largePopup.appendChild(contentContainer);
		this._largePopupContent = contentContainer;
		this.drawFacetedData(0);
	}

	private drawGroupBySelection(): void
	{
		let groupByContainer = document.createElement('div');
		groupByContainer.classList.add('groupByContainer');
		groupByContainer.id = "largePopupGroupByContainer";
		this.largePopup.appendChild(groupByContainer);
		let optionSelect = new OptionSelect("largePopupGroupByContainer", "Group by");
		let buttonPropsList: ButtonProps[] = [];
		let facetOptions = this.data.GetFacetOptions();
		for (let i = 0; i < facetOptions.length; i++)
		{
			let facetOption = facetOptions[i];
			let buttonProps: ButtonProps = {
				displayName: facetOption.name,
				callback: () => this.drawFacetedData(i)
			 }
			 buttonPropsList.push(buttonProps);
		}
		optionSelect.onDataChange(buttonPropsList, 0);

	}

	protected drawFacetedData(facetOptionIndex: number): void
	{
		this.drawFacetedDataDefault(facetOptionIndex);
	}

	protected drawFacetedDataDefault(facetOptionIndex: number, width: string = '500px', height: string = '250px'): void
	{
		this.largePopupContent.innerHTML = null;
		let facetOption = this.data.GetFacetOptions()[facetOptionIndex];
		for (let facet of facetOption.GetFacets())
		{
			let outerContainer = document.createElement('div');
				outerContainer.classList.add('outerFacetContainer');
				outerContainer.style.width = width;
				outerContainer.style.height = height;

				let titleContainer = document.createElement('div');
					titleContainer.classList.add('facetTitle')
					titleContainer.innerText = facet.name;

			outerContainer.appendChild(titleContainer);

				let newContainer = document.createElement('div');
					newContainer.classList.add('facetContainer');
		
			outerContainer.appendChild(newContainer);

			this.largePopupContent.appendChild(outerContainer);
			this.initSubWidget(newContainer, facet.name, facet.data);
		}
	}

	private initSubWidget(newContainer: HTMLElement, name: string, data: DataType): void
	{
		let subWidget = this.Clone(newContainer);
		subWidget.canFacet = false;
		subWidget.SetData(data, this.data);
	}

	private initLargePopup(): void
	{
		let largePopupOuter = document.createElement('div');
		largePopupOuter.id = "largePopupContainerOuter";
		largePopupOuter.classList.add('largePopupContainerOuter');
		largePopupOuter.addEventListener('click', () =>
		{
			DevlibTSUtil.hide(this.largePopupOuter);
		});

		let largePopup = document.createElement('div');
		largePopup.id = 'largePopupContainer';
		largePopup.classList.add('largePopupContainer');
		largePopup.addEventListener('click', (ev: Event) => 
		{
			ev.stopPropagation();
		});
		this._largePopup = largePopup;
		largePopupOuter.appendChild(largePopup);

		DevlibTSUtil.hide(largePopupOuter);
		document.body.appendChild(largePopupOuter);
		this._largePopupOuter = largePopupOuter as HTMLDivElement;
	}
}