import * as d3 from 'd3';
import { load } from "protobufjs";
import { CurveList } from '../src/DataModel/CurveList';
import { CurveListFactory } from '../src/DataModel/CurveListFactory';
import { DerivedTrackValueFunctions } from '../src/DataModel/DerivedTrackValueFunctions';
import { DerivedPointValueFunctions } from '../src/DataModel/DerivedPointValueFunctions';
import { App } from './App';
import { DatasetSpec } from './types';

let metaContainer: HTMLElement = document.querySelector('#metaContainer');

let derivedTrackDataFunctions = DerivedTrackValueFunctions.GetFunctionList();
let derivedPointDataFunctions = DerivedPointValueFunctions.GetFunctionList();
let app: App<CurveList, DatasetSpec> = new App<CurveList, DatasetSpec>(metaContainer, CurveListFactory.CreateCurveListFromCSVObject, derivedTrackDataFunctions, derivedPointDataFunctions);
window.onresize = () => app.OnWindowResize();


d3.json('/static/layouts/defaultLayout.json').then(async (data: any) =>
{
    app.InitializeLayout(data);
    const datasetId: string = metaContainer.dataset.dataset;
    await app.InitDataStore();
    app.LoadDataset(datasetId);
});
