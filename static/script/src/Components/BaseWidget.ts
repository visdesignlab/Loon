import {BaseComponent} from './BaseComponent';
import {Margin} from '../devlib/DevLibTypes';

export abstract class BaseWidget<DataType> extends BaseComponent {
	
	constructor(container: Element)
	{
		super(container);
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

	protected initProps(): void
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
		// for (let child of this.children)
		// {
		// 	if (child instanceof BaseWidget)
		// 	{
		// 		child.SetData(data);
		// 	}
		// }
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
}