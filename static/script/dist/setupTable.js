fetch('/data/datasetList.json')
    .then(response => response.json())
    .then(data => 
    {
        console.log(data);
        const builder = LineUpJS.builder(data.datasetList);


        // manually define columns
        builder
            .column(LineUpJS.buildStringColumn('vizLinkHtml').label('Viz Link').width(100).html())
            .column(LineUpJS.buildStringColumn('displayName').label('Name').width(260))
            .column(LineUpJS.buildCategoricalColumn('author', data.authorList).width(100))
            .column(LineUpJS.buildStringColumn('folder').label('Folder Path').width(350))
            .column(LineUpJS.buildStringColumn('driveLinkHtml').label('Google Drive Link').width(120).html())
            .column(LineUpJS.buildNumberColumn('fileSize', data.sizeRange).label('size (mb)').width(120))
            .column(LineUpJS.buildDateColumn('modifiedDate').label('Last Modified Date').width(120).format("%b %d, %Y",'%Y-%d-%m'));

        const ranking = LineUpJS.buildRanking()
            .supportTypes()
            .allColumns()
            .groupBy('author')
            .sortBy('modifiedDate', 'desc');

        builder.ranking(ranking);

        const lineup = builder.buildTaggle(document.body); 
    }
)
