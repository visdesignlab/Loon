// onmessage = function(event)
// {
//     let blob = event.data[0];
//     let copyLeft = event.data[1];
//     let copyTop = event.data[2];
//     let copyWidth = event.data[3];
//     let copyHeight = event.data[4];
//     createImageBitmap(blob, copyLeft, copyTop, copyWidth, copyHeight)
//         .then((imageBitmap) => self.postMessage({ imageBitmap }, [imageBitmap]));
// }

onmessage = function(event)
{
    let promises = [];
    for (let [blob, copyLeft, copyTop, copyWidth, copyHeight] of event.data)
    {
        // let blob = event.data[0];
        // let copyLeft = event.data[1];
        // let copyTop = event.data[2];
        // let copyWidth = event.data[3];
        // let copyHeight = event.data[4];
        promises.push(createImageBitmap(blob, copyLeft, copyTop, copyWidth, copyHeight));
    }
    Promise.all(promises).then(data => self.postMessage(data));
}