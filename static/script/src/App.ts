import * as d3 from 'd3';
import {BaseWidget} from './Components/BaseWidget';
import {BaseComponent} from './Components/BaseComponent';
import {Toolbar} from './Components/Toolbar';
import {Plot2dPathsWidget} from './Components/Plot2dPathsWidget';
// import {Console} from './Console';
// import {TableWidget} from './TableWidget';
import {MetricDistributionWidget} from './Components/MetricDistributionWidget';
import {ImageSelectionWidget} from './Components/ImageSelectionWidget';
import {ImageStackWidget} from './Components/ImageStackWidget'
// import {Overlay} from './Overlay';
import {LayoutFramework} from './LayoutFramework';
import {Frame, ComponentType, ComponentInitInfo, Arguments, AppData} from './types';
import {ButtonProps, DerivationFunction} from './devlib/DevLibTypes';
import {DataEvents} from './DataModel/DataEvents';
import { DetailedDistribution } from './Components/DetailedDistribution';
// import {LabelPosition} from './types';

export class App<DataType extends AppData> {
	
	constructor(container: HTMLElement,
				fromCsv: (data: string, derivedDataFunctions: [string[], DerivationFunction][], sourceKey: string, postfixKey: string) => DataType,
				fromCsvObject: (data: d3.DSVRowArray<string>, derivedDataFunctions: [string[], DerivationFunction][], sourceKey: string, postfixKey: string) => DataType,
				derivedDataFunctions: [string[], DerivationFunction][]) {
		this._container = container;
		this._componentList = [];
		this._layoutFramework = new LayoutFramework(container);
		this._dataFromCSV = fromCsv;
		this._dataFromCSVObject = fromCsvObject;
		this._derivationFunctions = derivedDataFunctions;
		document.addEventListener(DataEvents.brushChange, (e: Event) => {this.onBrushChange()});
		// this._overlay = new Overlay("overlayContainer");
	}

	
	private _data : DataType;
	public get data() : DataType {
		return this._data;
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

	private _componentContainers : Map<HTMLElement, ComponentInitInfo | ComponentType>;
	public get componentContainers() : Map<HTMLElement, ComponentInitInfo | ComponentType> {
		return this._componentContainers;
	}

	private _dataFromCSV : (data: string, derivedDataFunctions: [string[], DerivationFunction][], sourceKey: string, postfixKey: string) => DataType;
	public get dataFromCSV() : (data: string, derivedDataFunctions: [string[], DerivationFunction][], sourceKey: string, postfixKey: string) => DataType{
		return this._dataFromCSV;
	}

	private _dataFromCSVObject : (data: d3.DSVRowArray<string>, derivedDataFunctions: [string[], DerivationFunction][], sourceKey: string, postfixKey: string) => DataType;
	public get dataFromCSVObject() : (data: d3.DSVRowArray<string>, derivedDataFunctions: [string[], DerivationFunction][], sourceKey: string, postfixKey: string) => DataType{
		return this._dataFromCSVObject;
	}

	
	private _derivationFunctions : [string[], DerivationFunction][];
	public get derivationFunctions() : [string[], DerivationFunction][] {
		return this._derivationFunctions;
	}
	public set derivationFunctions(v : [string[], DerivationFunction][]) {
		this._derivationFunctions = v;
	}

	public InitializeLayout(frame: Frame<ComponentInitInfo | ComponentType>): void
	{
		// console.log(frame);

		this._componentContainers = this.layoutFramework.InitializeLayout(frame);
		for (let [container, componentInfo] of this.componentContainers)
		{
			this.InitializeComponent(componentInfo, container);
		}
	}

	private InitializeComponent(compontentInfo: ComponentInitInfo | ComponentType, container: HTMLElement): void
	{
		let newComponent: BaseComponent;
		let componentType: ComponentType;
		let initArgs: Arguments | null = null;
		if (typeof(compontentInfo) === "string")
		{
			componentType = compontentInfo;
		}
		else
		{
			componentType = compontentInfo.type;
			initArgs = compontentInfo.initArgs;
		}
		switch (componentType) {
			case ComponentType.Toolbar:
				let buttonList: ButtonProps[] = [
					{displayName: "Non Adherent", callback: () => this.fetchCsv('1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX/massOverTime.csv', '1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX') },
					{displayName: "Adherent", callback: () => this.fetchCsv('1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96/massOverTime.csv', '1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96') }
				];

				newComponent = new Toolbar(container, (data: string) => this.loadFromCsvString(data), buttonList);
				break;
			case ComponentType.Plot2dPathsWidget:
				let squareAspectRatio = true;
				if (typeof(initArgs.squareAspectRatio) !== 'undefined')
				{
					squareAspectRatio = initArgs.squareAspectRatio;
				}
				newComponent = new Plot2dPathsWidget(container, initArgs.xAxis, initArgs.yAxis, squareAspectRatio);
				break;
			case ComponentType.MetricDistributionWidget:
				newComponent = new MetricDistributionWidget(container, initArgs.metricDistributionCollectionLevel);
				break;
			case ComponentType.ImageSelectionWidget:
				newComponent = new ImageSelectionWidget(container);
				break;
			case ComponentType.DetailedDistribution:
				newComponent = new DetailedDistribution(container, initArgs.metricDistributionCollectionLevel, initArgs.attributeKey);
				break;
			default:
				console.error(`Cannot Initialize Component of type: ${componentType}`);
				break;
		}
		this.componentList.push(newComponent);
	}

	private loadFromCsvString(data: string): void
	{
		let newData: DataType = this.dataFromCSV(data, this.derivationFunctions, 'csvString', '');
		this.SetData(newData);
	}

	private async fetchCsv(filename: string, sourceKey: string, postfixKey: string = ''): Promise<void>
	{
		await d3.csv("../../../data/" + filename).then(data =>
		{
			// console.log(data);
			let newData: DataType = this.dataFromCSVObject(data, this.derivationFunctions, sourceKey, postfixKey);
			// console.log(newData);
			this.SetData(newData)
		});
		return;
	}

	public SetData(newData: DataType): void
	{
		console.log("App.SetData: ");
		console.log(newData);
		this._data = newData;
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

		this.data.OnBrushChange();
		for (let component of this.componentList)
		{
			if (component instanceof BaseWidget)
			{
				component.OnBrushChange();
			}
		}
	}

}