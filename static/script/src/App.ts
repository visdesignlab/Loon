import * as d3 from 'd3';
import {BaseWidget} from './Components/BaseWidget';
import {BaseComponent} from './Components/BaseComponent';
import {Toolbar} from './Components/Toolbar';
import {Plot2dPathsWidget} from './Components/Plot2dPathsWidget';
import {MetricDistributionWidget} from './Components/MetricDistributionWidget';
import {ImageSelectionWidget} from './Components/ImageSelectionWidget';
import {LayoutFramework} from './LayoutFramework';
import {Frame, ComponentType, ComponentInitInfo, Arguments, AppData} from './types';
import {KeyedTrackDerivationFunction, KeyedPointDerivationFunction} from './devlib/DevLibTypes';
import {DataEvents} from './DataModel/DataEvents';
import { DetailedDistributionWidget } from './Components/DetailedDistributionWidget';
import { DevlibTSUtil } from './devlib/DevlibTSUtil';

export class App<DataType extends AppData<DataSpecType>, DataSpecType> {
	
	constructor(container: HTMLElement,
				fromCsvObject: (
					data: d3.DSVRowArray<string>,
					derivedTrackDataFunctions: KeyedTrackDerivationFunction[],
					derivedPointDataFunctions: KeyedPointDerivationFunction[],
					dataSpec: DataSpecType
					) => DataType,
				derivedTrackDataFunctions: KeyedTrackDerivationFunction[],
				derivedPointDataFunctions: KeyedPointDerivationFunction[]) {
		this._container = container;
		this._componentList = [];
		this._layoutFramework = new LayoutFramework(container);
		this._dataFromCSVObject = fromCsvObject;
		this._trackDerivationFunctions = derivedTrackDataFunctions;
		this._pointDerivationFunctions = derivedPointDataFunctions;
		document.addEventListener(DataEvents.brushChange, (e: Event) => {this.onBrushChange()});
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

	private _dataFromCSVObject : (data: d3.DSVRowArray<string>, derivedTrackDataFunctions: KeyedTrackDerivationFunction[], derivedPointDataFunctions: KeyedPointDerivationFunction[], dataSpec: DataSpecType) => DataType;
	public get dataFromCSVObject() : (data: d3.DSVRowArray<string>, derivedTrackDataFunctions: KeyedTrackDerivationFunction[], derivedPointDataFunctions: KeyedPointDerivationFunction[], dataSpec: DataSpecType) => DataType{
		return this._dataFromCSVObject;
	}

	
	private _trackDerivationFunctions : KeyedTrackDerivationFunction[];
	public get trackDerivationFunctions() : KeyedTrackDerivationFunction[] {
		return this._trackDerivationFunctions;
	}

	private _pointDerivationFunctions : KeyedPointDerivationFunction[];
	public get pointDerivationFunctions() : KeyedPointDerivationFunction[] {
		return this._pointDerivationFunctions;
	}

	public InitializeLayout(frame: Frame<ComponentInitInfo | ComponentType>): void
	{
		// console.log(frame);
		this._componentContainers = this.layoutFramework.InitializeLayout(frame);
		DevlibTSUtil.launchSpinner();
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
			case ComponentType.Plot2dPathsWidget:
				let squareAspectRatio = true;
				if (typeof(initArgs.squareAspectRatio) !== 'undefined')
				{
					squareAspectRatio = initArgs.squareAspectRatio;
				}
				const defaultOption = 0;
				newComponent = new Plot2dPathsWidget(container, initArgs.quickPickOptions, defaultOption, squareAspectRatio);
				break;
			case ComponentType.MetricDistributionWidget:
				newComponent = new MetricDistributionWidget(container, initArgs.metricDistributionCollectionLevel);
				break;
			case ComponentType.ImageSelectionWidget:
				newComponent = new ImageSelectionWidget(container);
				break;
			case ComponentType.DetailedDistribution:
				newComponent = new DetailedDistributionWidget(container, initArgs.metricDistributionCollectionLevel, initArgs.attributeKey);
				break;
			case ComponentType.Toolbar:
				newComponent = new Toolbar(container);
				break;
			default:
				console.error(`Cannot Initialize Component of type: ${componentType}`);
				break;
		}
		this.componentList.push(newComponent);
	}

	public LoadDataset(datasetId: string): void
	{
		this.fetchJson(`${datasetId}.json`);
	}
	
	private async fetchJson(filename: string): Promise<void>
	{
		await d3.json("../../../data/" + filename).then((data: any) =>
		{
			this.fetchCsv(`${data.googleDriveId}/massOverTime.csv`, data);
		});
	}

	private async fetchCsv(filename: string, dataSpec: DataSpecType): Promise<void>
	{
		await d3.csv("../../../data/" + filename).then(data =>
		{
			// console.log(data);
			let newData: DataType = this.dataFromCSVObject(data, this.trackDerivationFunctions, this.pointDerivationFunctions, dataSpec);
			// console.log(newData);
			this.SetData(newData);
		});
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