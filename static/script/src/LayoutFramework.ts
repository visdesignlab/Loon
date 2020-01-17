import {Frame, Direction} from './types';

export class LayoutFramework {
	
	constructor(container: HTMLElement)
	{
		this._container = container;
	}

	private _container : HTMLElement;
	public get container() : HTMLElement {
		return this._container;
	}

	public InitializeLayout<ContentType>(frame: Frame<ContentType>): Map<HTMLElement, ContentType>
	{
		let elementToComponentType = new Map<HTMLElement, ContentType>();
		this.addFrame<ContentType>(this.container, frame, elementToComponentType);
		return elementToComponentType;
	}

	private addFrame<ContentType>(container: HTMLElement, frame: Frame<ContentType>, lookup: Map<Element, ContentType>): void
	{
		container.classList.add("frame");
		let dirClass: string;
		let dirPostFix: string;
		if (frame.direction === Direction.column)
		{
			dirClass = "dir-col";
			dirPostFix = "width";
		}
		else if (frame.direction === Direction.row)
		{
			dirClass = "dir-row";
			dirPostFix = "height";
		}
		container.classList.add(dirClass);
		let inlineStyle: string = "";
		if (typeof frame.minSize !== "undefined")
		{
			inlineStyle += `min-${dirPostFix}: ${frame.minSize}px; `;
		}
		if (typeof frame.maxSize !== "undefined")
		{
			inlineStyle += `max-${dirPostFix}: ${frame.maxSize}px; `;			
		}

		if (typeof frame.fraction === "undefined")
		{
			frame.fraction = 1;
		}
		inlineStyle += `flex-grow: ${frame.fraction}; `;			

		container.setAttribute("style", inlineStyle);

		if (frame.inside instanceof Array)
		{
			for (let childFrame of frame.inside)
			{
				let childContainer: HTMLElement = document.createElement("div");
				container.appendChild(childContainer);
				this.addFrame(childContainer, childFrame, lookup);
			}
		}
		else
		{
			lookup.set(container, frame.inside);
		}
	}
}