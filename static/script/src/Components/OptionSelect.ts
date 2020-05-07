import * as d3 from 'd3';
import { ButtonProps, HtmlSelection } from '../devlib/DevLibTypes';

export class OptionSelect {
	
	constructor(htmlContainerId: string)
	{
		this._containerSelect = d3.select("#" + htmlContainerId);
	}

	private _data : ButtonProps[];
	public get data() : ButtonProps[] {
		return this._data;
	}

	private _containerSelect : HtmlSelection;
	public get containerSelect() : HtmlSelection {
		return this._containerSelect;
	}

	private clearSelectedButton(): void
	{
		this.containerSelect.selectAll(".selected")
			.classed("selected", false);
	}

	public onDataChange(data: ButtonProps[], defaultSelection?: number): void
	{
		this._data = data;
		console.log(data);
		this.containerSelect.html(null);

		if (this.data.length === 1)
		{
			this.containerSelect
				.append("h5")
				.classed("valueHeader", true)
				.text(this.data[0].displayName);
			return;
		}

		this.updateButtons(defaultSelection);
	}

	private updateButtons(defaultSelection?: number): void
	{
		let thisOptionSelect: OptionSelect = this;
		this.containerSelect
			.selectAll("button")
			.data(this.data)
			.join("button")
			.text(d => d.displayName)
			.classed("optionButton", true)
			.classed("selected", (d, i) => defaultSelection === i)
			.on("click", function(buttonProps: ButtonProps)
			{
				if ((this as HTMLElement).classList.contains("selected"))
				{
					return;
				}
				thisOptionSelect.clearSelectedButton();
				buttonProps.callback();
				d3.select(this).classed("selected", true);
			});
	}

	public addButton(buttonProps: ButtonProps, selectIndex?: number): void
	{
		this.data.push(buttonProps);
		this.updateButtons(selectIndex);
	}

	public removeButton(displayName: string, callDefaultCallback = true): void
	{
		let currentSelectedIndex = this.getCurrentSelectionIndex();
		if (!this.data)
		{
			return;
		}
		let removeIndex = this.data.findIndex((button: ButtonProps) => button.displayName === displayName);
		if (removeIndex === -1)
		{
			return;
		}
		this.data.splice(removeIndex);
		let selectionIndex: number;
		if (callDefaultCallback && currentSelectedIndex === removeIndex)
		{
			selectionIndex = 0;
			this.data[0].callback();
		}
		else
		{
			selectionIndex = currentSelectedIndex;
		}
		this.updateButtons(selectionIndex);
		return;
	}

	public replaceButton(oldButtonName: string, newButtonProps: ButtonProps): void
	{
		let currentIndex: number = this.getCurrentSelectionIndex();
		this.removeButton(oldButtonName, false);
		this.addButton(newButtonProps, currentIndex);
		if (currentIndex === this.data.length - 1)
		{
			this.data[currentIndex].callback();
		}
	}

	private getCurrentSelectionIndex(): number
	{
		let currentSelectedElement: Element = this.containerSelect.selectAll('.selected').node() as Element;
		let elementList: Element[] = Array(...this.containerSelect.node().children);
		let currentSelectedIndex: number = elementList.indexOf(currentSelectedElement)
		return currentSelectedIndex;
	}

}