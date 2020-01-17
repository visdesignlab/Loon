import * as d3 from 'd3';
import { CurveList } from '../src/DataModel/CurveList';
import { CurveListFactory } from '../src/DataModel/CurveListFactory';
import { App } from './App';

let metaContainer: HTMLElement = document.querySelector('#metaContainer');
// for (let child of metaContainer.children)
for (let i = 0; i < metaContainer.children.length; i++)
{
    let container = metaContainer.children[i] as HTMLElement;
    // d3.csv('../../../data/massOverTime-' + child.id + '.csv').then(data =>
    //     {
    //         let curveList: CurveList = CurveListFactory.CreateCurveListFromCSVObject(data);
    //         console.log(curveList);
    //         let line1: string = data.columns.join(',');
    //         let line2: string = Object.values(data[0]).join(',');
    //         child.innerHTML = line1 + '<br>' + line2;
    //     })

    // let container: HTMLElement = document.getElementById("appContainer") as HTMLElement;
    let app: App<CurveList> = new App<CurveList>(container, CurveListFactory.CreateCurveListFromCSV, CurveListFactory.CreateCurveListFromCSVObject);
    window.onresize = () => app.OnWindowResize();

    d3.json('/static/layouts/defaultLayout.json').then(data =>
    {
        app.InitializeLayout(data);
    });
}

