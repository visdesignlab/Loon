export abstract class BaseComponent {
	
	constructor(container: Element)
	{
		this._container = container;
		// this._children = [];
		this.initProps();
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

	// private _children : BaseComponent[];
	// public get children() : BaseComponent[] {
	// 	return this._children;
	// }

	protected initProps(): void
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
		// for (let child of this.children)
		// {
		// 	child.Resize();
		// }
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