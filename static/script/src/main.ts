import * as d3 from 'd3';

let metaContainer: HTMLElement = document.querySelector('#metaContainer');
// for (let child of metaContainer.children)
for (let i = 0; i < metaContainer.children.length; i++)
{
    let child = metaContainer.children[i];
    d3.csv('../../../data/massOverTime-' + child.id + '.csv').then(data =>
        {
            console.log(data);
            let line1: string = data.columns.join(',');
            let line2: string = Object.values(data[0]).join(',');
            child.innerHTML = line1 + '<br>' + line2;
        })
}

