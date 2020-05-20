import { BaseComponent } from './BaseComponent';
import { Margin } from '../devlib/DevLibTypes';
import  { DevlibTSUtil } from '../devlib/DevlibTSUtil';
import { AppData, DatasetSpec } from '../types';

export abstract class BaseWidget<DataType extends AppData<DataSpecType>, DataSpecType> extends BaseComponent {
	
	constructor(container: Element, canFacet: boolean = false, ...props: any[])
	{
		super(container, ...props);
		this._canFacet = canFacet;
		if (canFacet)
		{
			this.addFacetButton();
		}
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
			this.container.removeChild(this.facetButton);
			this.container.removeEventListener("mouseenter", this.onMoueEnter());
			this.container.removeEventListener("mouseleave", this.onMouseLeave());
		}
		this._canFacet = v;
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

	private addFacetButton(): void
	{
		this._facetButton = DevlibTSUtil.getIconButton('layer-group', () =>
		{
			this.drawFacetContent();
		});
		this.facetButton.classList.add('noDisp');
		this.facetButton.style.position = 'absolute';
		this.facetButton.style.right = '0px';
		this.container.appendChild(this.facetButton);
		this.container.addEventListener('mouseenter', this.onMoueEnter());

		this.container.addEventListener('mouseleave', this.onMouseLeave());
	}

	private onMoueEnter(): () => void
	{
		return () => DevlibTSUtil.show(this.facetButton);
	}

	private onMouseLeave(): () => void
	{
		return () => DevlibTSUtil.hide(this.facetButton);
	}

	private drawFacetContent(): void
	{
		this.largePopup.innerHTML = null;
		
		DevlibTSUtil.show(this.largePopupOuter);
		this.drawGroupBySelection()

		this.drawFacetedData(0);
	}

	private drawGroupBySelection(): void
	{
		let groupByContainer = document.createElement('div');
		groupByContainer.classList.add('groupByContainer');


		this.largePopup.appendChild(groupByContainer);
	}

	protected drawFacetedData(facetOptionIndex: number): void
	{
		this.drawFacetedDataDefault(facetOptionIndex);
	}

	protected drawFacetedDataDefault(facetOptionIndex: number, width: string = '500px', height: string = '250px'): void
	{
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

			this.largePopup.appendChild(outerContainer);
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