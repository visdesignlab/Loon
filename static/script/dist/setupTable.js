fetch('/data/datasetList.json')
    .then(response => response.json())
    .then(data => 
    {
        // console.log(data);
        const builder = LineUpJS.builder(data.datasetList);

        // manually define columns
        builder
            .column(LineUpJS.buildStringColumn('vizLinkHtml').label('Viz Link').width(100).html())
            .column(LineUpJS.buildStringColumn('displayName').label('Name').width(260))
            .column(LineUpJS.buildCategoricalColumn('author', data.authorList).color('green').width(100))
            .column(LineUpJS.buildStringColumn('driveLinkHtml').label('Google Drive Link').width(100).html());

        const lineup = builder.buildTaggle(document.body); 
    }
)
