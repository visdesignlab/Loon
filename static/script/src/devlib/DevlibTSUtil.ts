import { image } from "d3";

export class DevlibTSUtil {

	public static async asyncSetTimeout(f: Function, milliDelay: number): Promise<any>
	{
		return new Promise((resolve) =>
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

	public static getIconButton(iconKey: string, callback: (ev: MouseEvent) => void, text?: string): HTMLButtonElement
	{
		let btn = document.createElement('button');
		btn.classList.add('basicIconButton');
		let icon = DevlibTSUtil.getFontAwesomeIcon(iconKey);
		if (text)
		{
			btn.append(text);
			btn.classList.add('withText');
		}
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
	public static launchSpinner(): void
	{
		const outerId = 'loadingSpinnerContainer';
		if (!DevlibTSUtil.spinnerInDom())
		{
			let outer = document.createElement('div');
			outer.classList.add('spinnerOuter');
			outer.id = outerId;
			
			let imgDiv = document.createElement('div');
			imgDiv.classList.add('spinnerWrapper');

			let inner = document.createElement('img');
			inner.classList.add('spinner');
			inner.src = '/spinner.gif';
			imgDiv.appendChild(inner);
			outer.appendChild(imgDiv);
			
			let attribution = document.createElement('a');
			attribution.classList.add('attributionLink');
			attribution.href = 'https://loading.io/asset/442473';
			attribution.innerText = "icon 'Double Ring' from loading.io";
			
			outer.appendChild(attribution);
			document.body.appendChild(outer);
		}
		if (!DevlibTSUtil.spinnerSpinning())
		{
			DevlibTSUtil.show(document.getElementById(outerId));
		}
	}

	public static stopSpinner(): void
	{
		let spinner = document.getElementById('loadingSpinnerContainer');
		if (spinner)
		{
			DevlibTSUtil.hide(spinner);
		}
	}

	public static spinnerInDom(): boolean
	{
		return document.getElementById('loadingSpinnerContainer') !== null
	}

	public static spinnerSpinning(): boolean
	{
		let outer = document.getElementById('loadingSpinnerContainer');
		if (outer && !outer.classList.contains('noDisp'))
		{
			return true;
		}
		return false;
	}

}