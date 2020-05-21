export abstract class BaseComponent {
	
	constructor(container: Element, ...props: any[])
	{
		this._container = container;
		this._componentIndex = BaseComponent._componentCount;
		BaseComponent._componentCount++;
		this.initProps(props);
		this.setWidthHeight();
		this.init();
	}

	private _container : Element;
	public get container() : Element {
		return this._container;
	}

	private _width : number;
	public get width() : number {
		return this._width;
	}

	private _height : number;
	public get height() : number {
		return this._height;
	}

	private _componentIndex : number;
	public get ComponentId() : string {
		return this.constructor.name + "_" + this._componentIndex;
	}	

	private static _componentCount: number = 0;

	protected initProps(props?: any[]): void
	{
		
	}

	protected init(): void
	{
		let notImplementDiv = document.createElement("div");
		notImplementDiv.textContent = `Class ${this.constructor.name} has not implement 'init' function`;
		notImplementDiv.classList.add("notImplementedWarning");
		this.container.innerHTML = null;
		this.container.appendChild(notImplementDiv);
	}

	public Resize(): void
	{
		this.setWidthHeight();
		this.OnResize();
	}

	protected setWidthHeight(): void
	{
		let rect = this.container.getBoundingClientRect();
		this._width = rect.width;
		this._height = rect.height;
	}

	protected OnResize(): void
	{
		this.container.innerHTML = null;
		let notImplementDiv = document.createElement("div");
		notImplementDiv.textContent = `Resized to: (${this.width}, ${this.height})
override ${this.constructor.name}.OnResizeDraw() to ensure content is resized correctly`;
		notImplementDiv.classList.add("notImplementedWarning");
		this.container.appendChild(notImplementDiv);
	}
}