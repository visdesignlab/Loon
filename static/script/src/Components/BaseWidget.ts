import { BaseComponent } from './BaseComponent';
import { Margin } from '../devlib/DevLibTypes';
import  { DevlibTSUtil } from '../devlib/DevlibTSUtil';

export abstract class BaseWidget<DataType> extends BaseComponent {
	
	constructor(container: Element, canFacet: boolean = false, ...props: any[])
	{
		super(container, ...props);
		this._canFacet = canFacet;
		if (canFacet)
		{
			this.addFacetButton();
		}
	}

	private _data : DataType | null;
	public get data() : DataType | null {
		return this._data;
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
	
	private _facetButton : HTMLButtonElement;
	public get facetButton() : HTMLButtonElement {
		return this._facetButton;
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

	public SetData(data: DataType): void
	{
		this._data = data;
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


	private addFacetButton(): void
	{
		this._facetButton = DevlibTSUtil.getIconButton('layer-group');
		this.facetButton.classList.add('noDisp');
		this.facetButton.style.position = 'absolute';
		let right = this.container.getBoundingClientRect().right;
		// let buttonRect = this.facetButton.getBoundingClientRect();
		// this.facetButton.style.right = (window.innerWidth - right) + 'px';
		this.facetButton.style.right = '0px';
		this.container.appendChild(this.facetButton);
		this.container.addEventListener('mouseenter', () =>
		{
			DevlibTSUtil.show(this.facetButton);
		});

		this.container.addEventListener('mouseleave', () =>
		{
			DevlibTSUtil.hide(this.facetButton);
		});

	}
}