import * as d3 from 'd3';
import {BaseWidget} from './Components/BaseWidget';
import {BaseComponent} from './Components/BaseComponent';
import {Toolbar} from './Components/Toolbar';
import {Plot2dPathsWidget} from './Components/Plot2dPathsWidget';
import {MetricDistributionWidget} from './Components/MetricDistributionWidget';
import {ImageSelectionWidget} from './Components/ImageSelectionWidget';
import {LayoutFramework} from './LayoutFramework';
import {Frame, ComponentType, ComponentInitInfo, Arguments, AppData, PbCurveList, DatasetSpec} from './types';
import {CurveDerivationFunction} from './devlib/DevLibTypes';
import {DataEvents} from './DataModel/DataEvents';
import { DetailedDistributionWidget } from './Components/DetailedDistributionWidget';
import { DevlibTSUtil } from './devlib/DevlibTSUtil';
import { openDB, IDBPDatabase } from 'idb';
import { load } from "protobufjs";
import { ImageStackDataRequest } from './DataModel/ImageStackDataRequest';

export class App<DataType extends AppData<DatasetSpec>> {
	
	constructor(container: HTMLElement,
				fromPbObject: (
					data: PbCurveList,
					derivedTrackDataFunctions: CurveDerivationFunction[],
					derivedPointDataFunctions: CurveDerivationFunction[],
					dataSpec: DatasetSpec
					) => DataType,
				derivedTrackDataFunctions: CurveDerivationFunction[],
				derivedPointDataFunctions: CurveDerivationFunction[]) {
		this._container = container;
		this._componentList = [];
		this._layoutFramework = new LayoutFramework(container);
		this._dataFromPbObject = fromPbObject;

		this._trackDerivationFunctions = derivedTrackDataFunctions;
		this._pointDerivationFunctions = derivedPointDataFunctions;
		document.addEventListener(DataEvents.brushChange, (e: Event) => {this.onBrushChange()});
		document.addEventListener(DataEvents.selectionToFilter, (e: Event) => {this.onSelectionToFilter()});
		document.addEventListener(DataEvents.applyNewFilter, (e: Event) => {this.onApplyNewFilter()});
	}

	
	private _data : DataType;
	public get data() : DataType {
		return this._data;
	}

	private _filteredData : DataType;
	public get filteredData() : DataType {
		return this._filteredData;
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

	private _dataFromPbObject : (data: PbCurveList, derivedTrackDataFunctions: CurveDerivationFunction[], derivedPointDataFunctions: CurveDerivationFunction[], dataSpec: DatasetSpec) => DataType;
	public get dataFromPbObject() : (data: PbCurveList, derivedTrackDataFunctions: CurveDerivationFunction[], derivedPointDataFunctions: CurveDerivationFunction[], dataSpec: DatasetSpec) => DataType{
		return this._dataFromPbObject;
	}

	private _trackDerivationFunctions : CurveDerivationFunction[];
	public get trackDerivationFunctions() : CurveDerivationFunction[] {
		return this._trackDerivationFunctions;
	}

	private _pointDerivationFunctions : CurveDerivationFunction[];
	public get pointDerivationFunctions() : CurveDerivationFunction[] {
		return this._pointDerivationFunctions;
	}

	private _dataStore : IDBPDatabase<unknown>;
	public get dataStore() : IDBPDatabase<unknown> {
		return this._dataStore;
	}
	
	private _imageStackDataRequest : ImageStackDataRequest;
	public get imageStackDataRequest() : ImageStackDataRequest {
		return this._imageStackDataRequest;
	}	

	public async InitDataStore(): Promise<void>
	{
		const dataStore = await openDB('loon-db', undefined, {
			upgrade(db, _oldVersion, _newVersion, _transaction)
			{
				if (!db.objectStoreNames.contains('tracks'))
				{
					db.createObjectStore('tracks');
				}
				if (!db.objectStoreNames.contains('images'))
				{
					db.createObjectStore('images');
				}
			}
		});
		this._dataStore = dataStore;
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
				newComponent = new ImageSelectionWidget(container, initArgs.samplingStrat);
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
		await d3.json("../../../data/" + filename).then(async (data: any) =>
		{
			this.fetchPb(`${data.googleDriveId}/massOverTime.pb`, data, data.googleDriveId);
		});
	}

	private fetchPb(filename: string, dataSpec: DatasetSpec, key: string): void
	{
		load('/static/protoDefs/PbCurveList.proto', async (err, root) =>
		{
			if (err)
			{
				throw err;
			}
			let CurveListMessage = root.lookupType("pbCurveList.PbCurveList");

			let buffer;
			if (this.dataStore)
			{
				let store = this.dataStore.transaction('tracks', 'readonly').objectStore('tracks');
				buffer = await store.get(key);
			}
			if (!buffer || Array.isArray(buffer))
			{
				// cached pb data is an arraybuffer (Array.isArray is false)
				// cached csv data is an array - we want to replace this.
				buffer = await d3.buffer('../../../data/' + filename);
				await this.dataStore.put<any>('tracks', buffer, key);
				// I could store the message object directly. The tradeoff is maybe (untested) slightly faster unboxing, but it does take up more space.
			}
			
			// initialize here to request data sooner
			this._imageStackDataRequest = new ImageStackDataRequest(dataSpec.googleDriveId);
			for (let component of this.componentList)
			{
				if (component instanceof ImageSelectionWidget)
				{
					component.imageStackDataRequest = this.imageStackDataRequest;
				}
			}

			// Decode an Uint8Array (browser) or Buffer (node) to a message
			let message: PbCurveList = CurveListMessage.decode(new Uint8Array(buffer)) as any;
			this.initData(message, dataSpec);
		});
	}

	private initData(data: PbCurveList, dataSpec: DatasetSpec): void
	{
		let allData: DataType = this.dataFromPbObject(data, this.trackDerivationFunctions, this.pointDerivationFunctions, dataSpec);
		allData.ApplyDefaultFilters();
		allData.ApplyNewFilter();
		let filteredData = allData.CreateFilteredCurveList() as DataType;

		// remove inBrush attributes set on tracks based on conditions filters
		// this is needed to get the appropriate filtered data in the condition
		// curve matrix widget.
		allData.OnBrushChange();
		this.SetData(filteredData, allData);
	}

	public SetData(filteredData: DataType, allData: DataType): void
	{
		console.log("App.SetData: ");
		console.log(allData);
		this._filteredData = filteredData;
		this._data = allData;
		for (let component of this.componentList)
		{
			if (component instanceof BaseWidget)
			{
					component.SetData(filteredData, allData);
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
		this.filteredData.OnBrushChange();
		for (let component of this.componentList)
		{
			if (component instanceof BaseWidget)
			{
				component.OnBrushChange();
			}
		}
	}

	private onSelectionToFilter(): void
	{
		this.data.ConsumeFilters(this.filteredData);
		let filteredData = this.filteredData.CreateFilteredCurveList() as DataType;
		this.SetData(filteredData, this.data);
	}

	private onApplyNewFilter(): void
	{
		this.data.ApplyNewFilter();
		let filteredData = this.data.CreateFilteredCurveList() as DataType;
		
		// remove inBrush attributes set on tracks based on conditions filters
		// this is needed to get the appropriate filtered data in the condition
		// curve matrix widget.
		this.data.OnBrushChange();

		this.SetData(filteredData, this.data);
	}

}