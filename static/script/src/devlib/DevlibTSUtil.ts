export class DevlibTSUtil {

	public static async asyncSetTimeout(f: Function, milliDelay: number): Promise<any>
	{
		return  new Promise((resolve) =>
		{
			setTimeout(
				() =>
				{
					f();
					resolve();
				},
				milliDelay
			);
		});
	}

	public static async makeAsync(f: Function): Promise<any>
	{
		return DevlibTSUtil.asyncSetTimeout(f, 0);
	}

	public static getIconButton(iconKey: string, callback: (ev: MouseEvent) => void): HTMLButtonElement
	{
		let btn = document.createElement('button');
		btn.classList.add('basicIconButton');
		let icon = DevlibTSUtil.getFontAwesomeIcon(iconKey);
		btn.appendChild(icon);
		btn.onclick = callback;
		return btn;
	}

	public static getFontAwesomeIcon(iconKey: string): HTMLElement
	{
		// <i class="fas fa-{icon}"></i>
		let icon = document.createElement("i");
		icon.classList.add('fas');
		icon.classList.add('fa-' + iconKey);
		return icon;
	}

	public static show(element: Element): void
	{
		element.classList.remove('noDisp');
	}

	public static hide(element: Element): void
	{
		element.classList.add('noDisp');
	}

}