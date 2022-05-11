import * as d3 from 'd3';
import { CurveList } from '../src/DataModel/CurveList';
import { CurveListFactory } from '../src/DataModel/CurveListFactory';
import { DerivedTrackValueFunctions } from '../src/DataModel/DerivedTrackValueFunctions';
import { DerivedPointValueFunctions } from '../src/DataModel/DerivedPointValueFunctions';
import { App } from './App';

let metaContainer: HTMLElement = document.querySelector('#metaContainer');

let derivedTrackDataFunctions = DerivedTrackValueFunctions.GetFunctionList();
let derivedPointDataFunctions = DerivedPointValueFunctions.GetFunctionList();
let app: App<CurveList> = new App<CurveList>(
    metaContainer,
    CurveListFactory.CreateCurveListFromPbObject,
    derivedTrackDataFunctions,
    derivedPointDataFunctions
);
window.onresize = () => app.OnWindowResize();

console.log('main 0');
d3.json('/static/layouts/defaultLayout.json').then(async (data: any) => {
    console.log('main 1');
    await app.InitDataStore();
    console.log('main 2');
    app.InitializeLayout(data);
    console.log('main 3');
    const datasetId: string = metaContainer.dataset.dataset;
    app.LoadDataset(datasetId);
    console.log('main 4');
});
