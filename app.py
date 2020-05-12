import os, io, math, random
from functools import wraps
from typing import Dict, Tuple, List, Union

# web framework
import flask
from flask.helpers import url_for
from flask import abort

# Google authentication
import google.oauth2.credentials
import googleapiclient.discovery
import google_auth_oauthlib.flow

# working with matlab (.mat) files, especially images
from scipy.io import loadmat
from PIL import Image
from PIL import ImageFilter
from PIL import ImageChops
import piexif
import numpy as np

# for saving structured exif data
import json

CLIENT_SECRETS_FILENAME = 'config/credentials.json'
REFRESH_TOKEN = 'TODO: dev token'
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
TEMP_FILES_FOLDER = 'tmp/'
app = flask.Flask(__name__)
app.secret_key = "TODO: replace dev key in production"

TOP_GOOGLE_DRIVE_FOLDER_ID = '1H07fdv5Aj3aGqOAAEbCmmouyC6OWAZln'

@app.route('/auth')
def auth():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(CLIENT_SECRETS_FILENAME, scopes=SCOPES)
    flow.redirect_uri = url_for('authCallback', _external=True)

    authUrl, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')

    flask.session['state'] = state
    return flask.redirect(authUrl)

def authRequired(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # flask.session.clear()
        if not credentialsValid():
            flask.session['nextUrl'] = flask.request.url
            return flask.redirect(url_for('auth'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/authCallback')
def authCallback():
    state = flask.session['state']
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(CLIENT_SECRETS_FILENAME, scopes=SCOPES, state=state)
    flow.redirect_uri = url_for('authCallback', _external=True)

    flow.fetch_token(authorization_response=flask.request.url)

    creds = flow.credentials
    # print("@authCallback, refresh_token: " + creds.refresh_token)
    # print("creds yo")
    # print(creds)
    # print('###################################')
    flask.session['credentials'] = {
        'token': creds.token,
        'refresh_token': REFRESH_TOKEN,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': creds.scopes
    }
    return flask.redirect(flask.session['nextUrl'])

@app.route('/')
@authRequired
def index():
    return flask.render_template('index.html')

@app.route('/<string:datasetId>')
@authRequired
def detailedView(datasetId: str):
    return flask.render_template('detailedView.html', datasetId=datasetId)

@app.route('/data/<string:datasetId>.json')
@authRequired
def getDatasetConfig(datasetId: str) -> str:
    cachePath = './static/cache/datasetList'
    filePath = cachePath + '/' + datasetId + ".json"
    if os.path.exists(filePath):
        return flask.redirect(filePath[1:]) # don't want '.' here

    return "{}"

@app.route('/data/datasetList.json')
@authRequired
def getDatasetList() -> str:
    cachePath = './static/cache/datasetList'
    filePath = cachePath + '/derived/combined.json'
    combineDatasetSpecsFromLocalFiles()
    if os.path.exists(filePath):
        return flask.redirect(filePath[1:]) # don't want '.' here

    return "{}"

@app.route('/data/datasetList_update.json')
@authRequired
def updateDataSpecList() -> str:
    credentials = google.oauth2.credentials.Credentials(**flask.session['credentials'])
    service: googleapiclient.discovery.Resource = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)
    query = "name = 'data_allFrames.mat'"
    responseFields = "nextPageToken, files(parents, size, modifiedTime)"
    results = service.files().list(q=query, fields=responseFields, pageSize=1000).execute()
    candidateFiles = results.get('files', [])
    skipCount = 0
    filenameSet = set()
    for index, candidateFile in enumerate(candidateFiles):
        print('Building: {}/{}'.format(index, len(candidateFiles)), end='\r')
        dataSpecObj = getDataSpecObj(service, candidateFile)
        if dataSpecObj == None:
            skipCount += 1
            continue
        filename = dataSpecObj['folder'].rstrip('/').replace('/', '__')
        if filename in filenameSet:
            # Google allows two file of the same name in a folder
            # I do not.
            continue
        filenameSet.add(filename)
        filename = './static/cache/datasetList/' + filename + '.json'
        if os.path.exists(filename):
            dataSpecFile = open(filename, 'r+')
            existingContent = dataSpecFile.read()
            if existingContent:
                existingObj = json.loads(existingContent)
                # TODO for now this overwrites everything, may want to make this smarter if we end up using more than this one time
                existingObj.update(dataSpecObj)
                dataSpecObj = existingObj
        else:
            dataSpecFile = open(filename, 'w')
        dataSpecFile.write(json.dumps(dataSpecObj))
    print('')
    print('done')
    resultStr = 'Total: {}; '.format(len(candidateFiles))
    resultStr += 'Skipped: {}; '.format(skipCount)
    resultStr += 'Unique Filenames: {}; '.format(len(filenameSet))
    resultStr += 'dupFilenames: {}'.format(len(candidateFiles) - skipCount - len(filenameSet))
    return resultStr

def getDataSpecObj(service, googleDriveFile) -> Union[Dict, None]:
    dataSpecObj = {}
    parentId = googleDriveFile['parents'][0]
    folderPathList = getFolderPathFromGoogleDrive(service, TOP_GOOGLE_DRIVE_FOLDER_ID, parentId)
    if len(folderPathList) == 0:
        return None
    dataSpecObj['googleDriveId'] = parentId
    dataSpecObj['folder'] = '/'.join(folderPathList) + '/'
    dataSpecObj['author'] = folderPathList[1]
    dataSpecObj['displayName'] = folderPathList[1] + '/.../' + folderPathList[-1]
    dataSpecObj['modifiedDate'] = googleDriveFile['modifiedTime'].split('T')[0]
    dataSpecObj['fileSize'] = googleDriveFile['size']
    return dataSpecObj

def getFolderPathFromGoogleDrive(service, topDir, bottomDir) -> List[str]:
    pathList = []
    currentDir = bottomDir
    while currentDir != topDir:
        currentDirFile = service.files().get(fileId=currentDir, fields='parents, name').execute()
        parentList = currentDirFile.get('parents', None)
        if parentList == None:
            return []
        pathList.append(currentDirFile['name'])
        currentDir = currentDirFile['parents'][0]
    pathList.append('Data')
    pathList.reverse()
    return pathList

def combineDatasetSpecsFromLocalFiles() -> None:
    basePath = './static/cache/datasetList/'
    fileContentList = []
    datasetSpecs = os.listdir(basePath)
    for spec in datasetSpecs:
        if spec.endswith(".json"):
           specFile = open(basePath + spec, 'r')
           fileContentList.append((specFile.read(), spec.split(',')[0]))
    combinedString = combineDatasetSpecs(fileContentList)
    out = open(basePath + 'derived/combined.json', 'w')
    out.write(combinedString)
    return

def combineDatasetSpecs(fileContentList: List[Tuple[str, str]]) -> str:
    totalDatset = {}
    authorSet = set()
    combinedList = []
    maxSize = 0
    for fileContent, filename in fileContentList:
        fileSpecObj = json.loads(fileContent)
        id = filename.split('.')[0]
        fileSpecObj['uniqueId'] = id
        fileSpecObj['vizLinkHtml'] = '<a href="/{}">Viz Link</a>'.format(id)
        driveUrl = 'https://drive.google.com/drive/u/1/folders/{}'.format(fileSpecObj['googleDriveId'])
        fileSpecObj['driveLinkHtml'] = '<a href="{}">Drive Link</a>'.format(driveUrl)
        combinedList.append(fileSpecObj)
        authorSet.add(fileSpecObj['author'])
        fileSpecObj['fileSize'] = int(fileSpecObj['fileSize']) / (1024 * 1024.0)
        maxSize = max(maxSize, fileSpecObj['fileSize'])
    totalDatset['authorList'] = list(authorSet)
    totalDatset['sizeRange'] = [0, maxSize]
    totalDatset['datasetList'] = combinedList
    return json.dumps(totalDatset, indent=4)

@app.route('/data/<string:folderId>/massOverTime.csv')
@authRequired
def getMassOverTimeCsv(folderId: str) -> str:
    cachePath = './static/cache/' + folderId
    filePath = cachePath + '/' + 'massOverTime.csv'
    if os.path.exists(filePath):
        return flask.redirect(filePath[1:]) # don't want '.' here

    # generate data
    data_allframes = getData_AllFrames(folderId)

    massOverTime = getMassOverTimeArray(folderId, data_allframes)
    timeArray = getTimeIndexArray(folderId, data_allframes)
    locationArray = getLocationArray(folderId, data_allframes)
    frameArray = getFrameArray(folderId, data_allframes)
    xShiftArray = getXShiftArray(folderId, data_allframes)
    yShiftArray = getYShiftArray(folderId, data_allframes)
    timeToIndex = {}
    for index, time in enumerate(timeArray):
        # weird [0] indexing here is a result of weird
        # array structure that has nested arrays at 
        # surprising places
        time = time[0]
        locId = locationArray[0][index]
        frameId = frameArray[index, 0]
        xShift = xShiftArray[index][0]
        yShift = yShiftArray[index][0]
        timeToIndex[time] = (locId, frameId, xShift, yShift)

    returnStr = 'X,Y,Mass,Time,id,Mean Value,Shape Factor,Location ID,Frame ID,xShift,yShift\n'
    for index, row in enumerate(massOverTime):
        time = row[3]
        locationId, frameId, xShift, yShift = timeToIndex[time]
        # this corrects the xShift/yShift problem.
        # row[0] += xShift
        # row[1] += yShift

        returnStr += ",".join(map(str, row))
        returnStr += ',' + str(locationId) + ',' + str(frameId)
        returnStr += ',' + str(xShift) + ',' + str(yShift)
        returnStr += '\n'

    # cache file
    if not os.path.exists(cachePath):
        os.mkdir(cachePath)
    cache = open(cachePath + '/' + 'massOverTime.csv', 'w')
    cache.write(returnStr)
    cache.close()
    return returnStr

def getData_AllFrames(folderId: str) -> Dict:
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat')

def getMassOverTimeArray(folderId: str, matlabDict = None):
    return getMatlabObjectFromKey(folderId, 'tracks',  matlabDict)
    
def getTimeIndexArray(folderId: str, matlabDict = None):
    return getMatlabObjectFromKey(folderId, 't_stored',  matlabDict)
    
def getLocationArray(folderId: str, matlabDict = None):
    return getMatlabObjectFromKey(folderId, 'Loc_stored',  matlabDict)
    
def getFrameArray(folderId: str, matlabDict = None):
    return getMatlabObjectFromKey(folderId, 'ii_stored',  matlabDict)
    
def getXShiftArray(folderId: str, matlabDict = None):
    return getMatlabObjectFromKey(folderId, 'xshift_store',  matlabDict)
  
def getYShiftArray(folderId: str, matlabDict = None):
    return getMatlabObjectFromKey(folderId, 'yshift_store',  matlabDict)

def getMatlabObjectFromKey(folderId: str, key: str, matlabDict = None):
    if matlabDict != None and key in matlabDict:
        return matlabDict[key]
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat', key)

@app.route('/data/<string:folderId>/img_<int:locationId>_metadata.json')
def getImageStackMetaData(folderId: str, locationId: int) -> str:
    labeledImageStack = getLabeledImageStackArray(folderId, locationId)
    metadata = getTiledImageMetaData(labeledImageStack)
    addFrameInformation(metadata, labeledImageStack)
    metaDataJson = json.dumps(metadata)
    return metaDataJson

@app.route('/data/<string:folderId>/img_<int:locationId>.png')
@authRequired
def getImageStack(folderId: str, locationId: int):
    imageStackArray = getImageStackArray(folderId, locationId)
    
    shape = np.shape(imageStackArray)
    print("image stack shape = " + str(shape))

    tiledImg, metaData = getTiledImage(imageStackArray, 'F')
    fileObject = getImageFileObject(tiledImg, metaData)

    fileObject = getTiledImageFileObject(imageStackArray, 'F')

    response = flask.send_file(fileObject, mimetype='image/png')
    response.headers['tiledImageMetaData'] = json.dumps(metaData)
    return response

@app.route('/data/<string:folderId>/imgWithOutline_<int:locationId>.png')
@authRequired
def getImageStackWithOutline(folderId: str, locationId: int):
    imageStackArray = getImageStackArray(folderId, locationId)
    labeledImageStackArray = getLabeledImageStackArray(folderId, locationId)
    labeledImageStackArray = labeledImageStackArray.astype(np.int32)

    imageStack, metaData1 = getTiledImage(imageStackArray, 'F')
    imageOutlineStack, metaData2 = getTiledImage(labeledImageStackArray, 'I', True, True)
    # metaData1 should equal metaData2

    combinedImg = ImageChops.add(imageStack, imageOutlineStack)
    fileObject = getImageFileObject(combinedImg, metaData1)

    response = flask.send_file(fileObject, mimetype='image/png')

    response.headers['tiledImageMetaData'] = json.dumps(metaData1)
    return response

def getImageStackArray(folderId: str, locationId: int):
    exampleDatasets = set(['1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96','1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX'])
    filenamePattern = 'data{}.mat'
    if (folderId in exampleDatasets):
        filenamePattern = 'Copy of data{}.mat'
    imageFilename = filenamePattern.format(locationId)
    return getMatlabObjectFromGoogleDrive(folderId, imageFilename, 'D_stored')

def getLabeledImageStackArray(folderId: str, locationId: int):
    exampleDatasets = set(['1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96','1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX'])
    filenamePattern = 'data{}.mat'
    if (folderId in exampleDatasets):
        filenamePattern = 'Copy of data{}.mat'
    imageFilename = filenamePattern.format(locationId)
    return getMatlabObjectFromGoogleDrive(folderId, imageFilename, 'L_stored')

def getTiledImageFileObject(imageStackArray, imageType: str, colorize = False, getOutline = False) -> io.BytesIO:
    tiledImg, metaData = getTiledImage(imageStackArray, imageType, colorize, getOutline)
    return getImageFileObject(tiledImg, metaData)

def getTiledImage(imageStackArray, imageType: str, colorize = False, getOutline = False) -> Tuple[any, Dict]:
    tiledImgMetaData = getTiledImageMetaData(imageStackArray)
    smallW = tiledImgMetaData['tileWidth']
    smallH = tiledImgMetaData['tileHeight']
    numberOfColumns = tiledImgMetaData['numberOfColumns']
    numImages = tiledImgMetaData['numberOfTiles']

    numImageH = math.ceil(numImages / float(numberOfColumns))

    (bigWidth, bigHeight) = (numberOfColumns * smallW, numImageH * smallH)    

    bigImageType = 'RGB'
    bigImg = Image.new(bigImageType, (bigWidth, bigHeight))

    for timeIndex in range(numImages):
        smallImg = imageStackArray[:, :, timeIndex]
        smallImg = Image.fromarray(smallImg, imageType)
        if colorize:
            firebrick = (178, 34, 34) # css named color
            smallImg = getColoredImage(smallImg, firebrick)
        x = timeIndex % numberOfColumns
        y = math.floor(timeIndex / numberOfColumns)
        top = y * smallH
        left = x * smallW
        bigImg.paste(smallImg, (left, top))

    if getOutline:
        bigImgEroded = bigImg.filter(ImageFilter.MinFilter(3))
        bigImg = ImageChops.difference(bigImg, bigImgEroded)

    return bigImg, tiledImgMetaData

def getTiledImageMetaData(imageStackArray) -> Dict:
    size = np.shape(imageStackArray)
    smallH, smallW, numImages = size
    numberOfColumns = 10
    tiledImgMetaData = {
        'tileWidth': smallW,
        'tileHeight': smallH,
        'numberOfColumns': numberOfColumns,
        'numberOfTiles': numImages
    }
    return tiledImgMetaData

def addFrameInformation(metadata, imageStackArray):
    numImages = metadata['numberOfTiles']
    frames = []
    for frameIndex in range(numImages):
        frameImg = imageStackArray[:, :, frameIndex]
        frameRegions = getFrameRegions(frameImg)
        frames.append(frameRegions)


    metadata['frames'] = frames
    return

def getFrameRegions(frameImg) -> Dict:
    height, width = np.shape(frameImg)
    regions = {} #<value, {'centroid': (x,y), 'pixels': dict>
    for y in range(height):
        for x in range(width):
            key = int(frameImg[y][x])
            if key == 0:
                continue
            position = str(x) + ':' + str(y)
            if key not in regions:
                regions[key] = {'pixels': {}}
            regions[key]['pixels'][position] = True
    addCentroids(regions)
    # removePixelArrays(regions)
    return regions

def addCentroids(regions: Dict) -> None:
    for key, value in regions.items():
        centroid = calculateCentroid(value['pixels'])
        regions[key]['centroid'] = centroid
    return

def calculateCentroid(positions: Dict[str, bool]) -> Tuple[float, float]:
    zippedPos = [[int(v) for v in key.split(':')] for key in positions.keys()]
    unzipped = zip(*zippedPos)
    averages = [sum(posList) / float(len(posList)) for posList in unzipped]
    return (averages[0], averages[1])

def removePixelArrays(regions: Dict) -> None:
    for key in regions:
        regions[key].pop('pixels')
    return


def getImageFileObject(img, tiledImgMetaData):
    metaDataString: str = json.dumps(tiledImgMetaData)
    exifDict = {}
    exifDict['Exif'] = {}
    exifDict['Exif'][piexif.ExifIFD.MakerNote] = bytes(metaDataString, 'utf-8')
    print('exif = ' + str(exifDict))

    fileObject = io.BytesIO()

    img.save(fileObject, "PNG", exif=piexif.dump(exifDict))
    fileObject.seek(0)

    return fileObject

def getColoredImage(labeledValueImg, nonZeroColor):
    outputImg = Image.new('RGB', labeledValueImg.size)
    coloredImgData = labeledValueImg.getdata()
    backColor = (0,0,0) # black
    outputImgData = [nonZeroColor if x != 0 else backColor for x in coloredImgData]
    outputImg.putdata(outputImgData)
    return outputImg

def getMatlabObjectFromGoogleDrive(folderId: str, filename: str, matlabKey: str = None):
    fileId, service = getFileId(folderId, filename)
    matlabDict = getMatlabDictFromGoogleFileId(fileId, service)
    if matlabKey != None:
        return matlabDict[matlabKey]
    return matlabDict

def getFileId(folderId: str, filename: str):
    credentials = google.oauth2.credentials.Credentials(**flask.session['credentials'])
    service: googleapiclient.discovery.Resource = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)
    
    query = "'" + folderId + "' in parents and name='" + filename + "'"
    responseFields = "nextPageToken, files(id, name)"
    
    results = service.files().list(q=query, fields=responseFields).execute()
    items = results.get('files', [])
    if len(items) == 0:
        abort(404)
    fileId = items[0]['id']
    return fileId, service

def credentialsValid() -> bool:
    if 'credentials' not in flask.session:
        return False
    credentials = google.oauth2.credentials.Credentials(**flask.session['credentials'])
    print('@credentialsValid')
    print(credentials)
    print(credentials.valid)
    print(credentials.expired)
    return credentials.valid and not credentials.expired

def getMatlabDictFromGoogleFileId(googleFileId: str, service: googleapiclient.discovery.Resource) -> dict:
    tempFilename = TEMP_FILES_FOLDER + 'temp.mat'
    f = open(tempFilename, 'wb')
    f.write(service.files().get_media(fileId=googleFileId).execute())
    f.close()
    return loadmat(tempFilename)


@app.errorhandler(404)
def page_not_found(error):
    return flask.redirect('/static/404.jpg')    

if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
    app.run('localhost', 8080, debug=True)