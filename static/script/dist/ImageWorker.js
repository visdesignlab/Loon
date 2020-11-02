onmessage = function(event)
{
    let promises = [];
    for (let [blob, copyLeft, copyTop, copyWidth, copyHeight] of event.data)
    {
        promises.push(createImageBitmap(blob, copyLeft, copyTop, copyWidth, copyHeight));
    }
    Promise.all(promises).then(data => self.postMessage(data));
}