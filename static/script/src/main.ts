import * as d3 from 'd3';
import { CurveList } from '../src/DataModel/CurveList';
import { CurveListFactory } from '../src/DataModel/CurveListFactory';
import { App } from './App';

let metaContainer: HTMLElement = document.querySelector('#metaContainer');

let app: App<CurveList> = new App<CurveList>(metaContainer, CurveListFactory.CreateCurveListFromCSV, CurveListFactory.CreateCurveListFromCSVObject);
window.onresize = () => app.OnWindowResize();

d3.json('/static/layouts/defaultLayout.json').then(data =>
{
    app.InitializeLayout(data);
});
