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


//test.

load("/static/temp/RLE.proto", async function(err, root) {
    if (err)
    {
        throw err;
    }
    // Obtain a message type
    let ImageLabelsMessage = root.lookupType("imageLabels.ImageLabels");
    let buffer = await d3.buffer('/static/temp/L0.pb');
    // Decode an Uint8Array (browser) or Buffer (node) to a message
    var message = ImageLabelsMessage.decode(new Uint8Array(buffer));
    console.log('protobuf message:')
    console.log(message);
});
//end test

d3.json('/static/layouts/defaultLayout.json').then(data =>
{
    app.InitializeLayout(data);
    const datasetId: string = metaContainer.dataset.dataset;
    app.LoadDataset(datasetId);
});
