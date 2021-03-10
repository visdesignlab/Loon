import {Frame, Direction} from './types';

export class LayoutFramework {
	
	constructor(container: HTMLElement, includeBorders: boolean = true)
	{
		this._container = container;
		this._includeBorders = includeBorders;
	}

	private _container : HTMLElement;
	public get container() : HTMLElement {
		return this._container;
	}

	private _includeBorders : boolean;
	public get includeBorders() : boolean {
		return this._includeBorders;
	}	

	public InitializeLayout<ContentType>(frame: Frame<ContentType>): Map<HTMLElement, ContentType>
	{
		let elementToComponentType = new Map<HTMLElement, ContentType>();
		this.addFrame<ContentType>(this.container, frame, elementToComponentType, true);
		return elementToComponentType;
	}

	private addFrame<ContentType>(container: HTMLElement, frame: Frame<ContentType>, lookup: Map<Element, ContentType>, skipThisBorder: boolean): void
	{
		container.classList.add("frame");
		if (this.includeBorders && !skipThisBorder)
		{
			container.classList.add('with-border');
		}
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

		if (frame.wrap)
		{
			inlineStyle += 'flex-wrap: wrap; ';
		}

		if (frame.overflowScroll)
		{
			inlineStyle += 'overflow: auto; ';
		}

		if (typeof frame.fraction === "undefined")
		{
			frame.fraction = 1;
		}
		inlineStyle += `flex-grow: ${frame.fraction}; `;			

		container.setAttribute("style", inlineStyle);

		if (frame.inside instanceof Array)
		{
			let lastChildFrame = frame.inside[frame.inside.length - 1];
			for (let childFrame of frame.inside)
			{
				let childContainer: HTMLElement = document.createElement("div");
				container.appendChild(childContainer);
				let isLastChild = childFrame === lastChildFrame;
				this.addFrame(childContainer, childFrame, lookup, isLastChild);
			}
		}
		else
		{
			lookup.set(container, frame.inside);
		}
	}
}