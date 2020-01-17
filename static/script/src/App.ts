import * as d3 from 'd3';
import {BaseWidget} from './Components/BaseWidget';
import {BaseComponent} from './Components/BaseComponent';
import {Toolbar} from './Components/Toolbar';
import {Plot2dPathsWidget} from './Components/Plot2dPathsWidget';
// import {Console} from './Console';
// import {TableWidget} from './TableWidget';
// import {LevelOfDetailWidget} from './LevelOfDetailWidget';
import {MetricDistributionWidget} from './Components/MetricDistributionWidget';
// import {Overlay} from './Overlay';
import {LayoutFramework} from './LayoutFramework';
import {Frame, ComponentType} from './types';
import {ButtonProps} from './devlib/DevLibTypes';
import {DataEvents} from './DataModel/DataEvents';
// import {LabelPosition} from './types';

export class App<DataType> {
	
	constructor(container: HTMLElement, fromCsv: (data: string) => DataType, fromCsvObject: (data: d3.DSVRowArray<string>) => DataType) {
		this._container = container;
		this._componentList = [];
		this._layoutFramework = new LayoutFramework(container);
		this._dataFromCSV = fromCsv;
		this._dataFromCSVObject = fromCsvObject;
		document.addEventListener(DataEvents.brushChange, (e: Event) => {this.onBrushChange()});
		// this._overlay = new Overlay("overlayContainer");
	}

	private _container : HTMLElement;
	public get container() : HTMLElement {
		return this._container;
	}

	private _componentList : BaseComponent[];
	public get componentList() : BaseComponent[] {
		return this._componentList;
	}

	private _layoutFramework : LayoutFramework;
	public get layoutFramework() : LayoutFramework {
		return this._layoutFramework;
	}

	private _componentContainers : Map<HTMLElement, ComponentType>;
	public get componentContainers() : Map<HTMLElement, ComponentType> {
		return this._componentContainers;
	}

	private _dataFromCSV : (data: string) => DataType;
	public get dataFromCSV() : (data: string) => DataType{
		return this._dataFromCSV;
	}

	private _dataFromCSVObject : (data: d3.DSVRowArray<string>) => DataType;
	public get dataFromCSVObject() : (data: d3.DSVRowArray<string>) => DataType{
		return this._dataFromCSVObject;
	}

	// private _overlay : Overlay;
	// public get overlay() : Overlay {
	// 	return this._overlay;
	// }
	// public set overlay(v : Overlay) {
	// 	this._overlay = v;
	// }

	public InitializeLayout(frame: Frame<ComponentType>): void
	{
		// console.log(frame);

		this._componentContainers = this.layoutFramework.InitializeLayout(frame);
		for (let [container, componentType] of this.componentContainers)
		{
			this.InitializeComponent(componentType, container);
		}
	}

	private InitializeComponent(compontentType: ComponentType, container: HTMLElement): void
	{
		let newComponent: BaseComponent;
		switch (compontentType) {
			case ComponentType.Toolbar:
				let buttonList: ButtonProps[] = [
					// {displayName: "Firework Simulation", callback: () => this.fetchCsv('firework.csv')}
					// {displayName: "Klein Bottle", callback: () => this.fetchCsv('klein.csv')},
					// {displayName: "Tutorial", callback: async () => this.runStorySteps() },
					{displayName: "Non Adherent", callback: () => this.fetchCsv('1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX/massOverTime.csv') },
					{displayName: "Adherent", callback: () => this.fetchCsv('1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96/massOverTime.csv') }
				];

				newComponent = new Toolbar(container, (data: string) => this.loadFromCsvString(data), buttonList);
				break;
			case ComponentType.Plot2dPathsWidget:
				newComponent = new Plot2dPathsWidget(container, 'x', 'y');
				break;
			// case ComponentType.Console:
			// 	newComponent = new Console(container);
			// 	break;
			// case ComponentType.TableWidget:
			// 	newComponent = new TableWidget(container);
			// 	break;
			// case ComponentType.LevelOfDetailWidget:
			// 	newComponent = new LevelOfDetailWidget(container);
			// 	break;
			case ComponentType.MetricDistributionWidget:
				newComponent = new MetricDistributionWidget(container);
				break;
			default:
				console.error(`Cannot Initialize Component of type: ${compontentType}`);
				break;
		}
		this.componentList.push(newComponent);
	}

	private loadFromCsvString(data: string): void
	{
		let newData: DataType = this.dataFromCSV(data);
		this.SetData(newData);
	}

	private async fetchCsv(filename: string): Promise<void>
	{
		await d3.csv("../../../data/" + filename).then(data =>
		{
			// console.log(data);
			let newData: DataType = this.dataFromCSVObject(data);
			// console.log(newData);
			this.SetData(newData)
		});
		return;
	}

	public SetData(newData: DataType): void
	{
		console.log("App.SetData: ");
		console.log(newData);
		for (let component of this.componentList)
		{
			if (component instanceof BaseWidget)
			{
				component.SetData(newData);
			}
		}
	}

	public OnWindowResize(): void
	{
		for (let component of this.componentList)
		{
			component.Resize();
		}
	}

	private onBrushChange(): void
	{
		for (let component of this.componentList)
		{
			if (component instanceof BaseWidget)
			{
				component.OnBrushChange();
			}
		}
	}

}