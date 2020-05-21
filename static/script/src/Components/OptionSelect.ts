import * as d3 from 'd3';
import { ButtonProps, HtmlSelection } from '../devlib/DevLibTypes';

enum OptionMode {
	ButtonList,
	Dropdown
}

export class OptionSelect {
	
	constructor(htmlContainerId: string, label?: string)
	{
		this._containerSelect = d3.select("#" + htmlContainerId);
		this._label = label;
		this._uniqueId = 'OptionSelectDropdown_' + OptionSelect._instanceCount++;
	}

	private _data : ButtonProps[];
	public get data() : ButtonProps[] {
		return this._data;
	}

	private _containerSelect : HtmlSelection;
	public get containerSelect() : HtmlSelection {
		return this._containerSelect;
	}

	private _label : string;
	public get label() : string {
		return this._label;
	}

	private _mode : OptionMode;
	public get mode() : OptionMode {
		return this._mode;
	}

	private _uniqueId : string;
	public get uniqueId() : string {
		return this._uniqueId;
	}
	
	private static _instanceCount: number = 0;

	private clearSelectedButton(): void
	{
		this.containerSelect.selectAll(".on")
			.classed("on", false);
	}

	public onDataChange(data: ButtonProps[], defaultSelection?: number): void
	{
		this._data = data;
		console.log(data);
		this.containerSelect.html(null);

		if (this.data.length === 1)
		{
			if (this.label)
			{
				this.containerSelect
					.append('span')
					.classed('optionSelectLabel', true)
					.text(this.label);
			}
	

			this.containerSelect
				.append("span")
				.classed("valueHeader", true)
				.text(this.data[0].displayName);
			return;
		}

		this.updateButtons(defaultSelection);
	}

	private updateButtons(defaultSelection?: number): void
	{
		if (this.data.length < 4)
		{
			this.drawQuickSelectButtons(defaultSelection);
		}
		else
		{
			this.drawDropDownButtons(defaultSelection);
		}
	}

	private drawQuickSelectButtons(defaultSelection?: number): void
	{
		this._mode = OptionMode.ButtonList;
		let thisOptionSelect: OptionSelect = this;
		this.containerSelect.html(null);

		if (this.label)
		{
			this.containerSelect
				.append('span')
				.classed('optionSelectLabel', true)
				.text(this.label);
		}

		this.containerSelect
			.selectAll("button")
			.data(this.data)
			.join("button")
			.text(d => d.displayName)
			.classed("toggleButton", true)
			.classed("on", (d, i) => defaultSelection === i)
			.on("click", function(buttonProps: ButtonProps)
			{
				if ((this as HTMLElement).classList.contains("on"))
				{
					return;
				}
				thisOptionSelect.clearSelectedButton();
				buttonProps.callback();
				d3.select(this).classed("on", true);
			});
	}

	private drawDropDownButtons(defaultSelection?: number): void
	{
		this._mode = OptionMode.Dropdown;
		this.containerSelect.html(null);

		if (this.label)
		{
			this.containerSelect.append('label')
				.text(this.label)
				.classed('optionSelectLabel', true)
				.attr('for', this.uniqueId);
		}
		
		this.containerSelect
			.append('select')
			.attr('id', this.uniqueId) 
			.classed('optionSelectSelect', true)
			.on('change', () =>
			{
				let optionSelect = this.containerSelect.select('#' + this.uniqueId)
				let newIndex: number = +optionSelect.property('value');
				this.data[newIndex].callback();
			})
			.selectAll('option')
			.data(this.data)
			.join('option')
			.attr('value', (d, i) => i)
			.property('selected', (d, i) => defaultSelection === i)
			.text(d => d.displayName);
	}
	
	public addButton(buttonProps: ButtonProps, selectIndex?: number): void
	{
		this.data.push(buttonProps);
		this.updateButtons(selectIndex);
	}

	public removeButton(displayName: string, callDefaultCallback = true): void
	{
		let currentSelectedIndex = this.GetCurrentSelectionIndex();
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
		let currentIndex: number = this.GetCurrentSelectionIndex();
		this.removeButton(oldButtonName, false);
		this.addButton(newButtonProps, currentIndex);
		if (currentIndex === this.data.length - 1)
		{
			this.data[currentIndex].callback();
		}
	}

	public GetCurrentSelectionIndex(): number
	{
		let currentSelectedIndex: number = -1;
		if (this.mode === OptionMode.ButtonList)
		{
			let currentSelectedElement: Element = this.containerSelect.selectAll('.on').node() as Element;
			let elementList: Element[] = this.containerSelect.selectAll('button').nodes() as Element[];
			currentSelectedIndex = elementList.indexOf(currentSelectedElement)
		}
		else
		{
			currentSelectedIndex = +this.containerSelect.select('#' + this.uniqueId).property('value');
		}
		return currentSelectedIndex;
	}

}