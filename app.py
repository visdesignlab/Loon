from io import BytesIO
import os, io, math, random
from functools import wraps
from typing import Dict, Tuple, List, Union
import array

# web framework
import flask
from flask.helpers import url_for
from flask import abort

# Google authentication
import google.oauth2.credentials
import googleapiclient.discovery
from googleapiclient.http import MediaIoBaseDownload
import google_auth_oauthlib.flow

# working with matlab (.mat) files, especially images
import h5py
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
    # combineDatasetSpecsFromLocalFiles()
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
        if dataSpecObj is None:
            skipCount += 1
            continue
        filename = dataSpecObj['folder'].rstrip('/').replace('/', '__')
        if filename in filenameSet:
            # Google allows two file of the same name in a folder.
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
        if parentList is None:
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



def isCached(folderId: str, filename: str) -> bool:
    return os.path.exists(cachePath(folderId, filename))

def cachePath(folderId: str, filename: str) -> str:
    cachePath = './static/cache/' + folderId
    return cachePath + '/' + filename

def getCached(folderId: str, filename: str): # -> flask.Response:
    filePath = cachePath(folderId, filename)
    return flask.redirect(filePath[1:]) # don't want '.' here

def cache(folderId: str, filename: str, data, isBinary = False) -> None:
    folderPath = './static/cache/' + folderId

    # cache file
    if not os.path.exists(folderPath):
        os.mkdir(folderPath)
    mode = 'w'
    if isBinary:
        mode += 'b'
    cache = open(folderPath + '/' + filename, mode)
    cache.write(data)
    cache.close()
    return

@app.route('/data/<string:folderId>/massOverTime.csv')
@authRequired
def getMassOverTimeCsv(folderId: str): # -> flask.Response:
    filename = 'massOverTime.csv'
    if isCached(folderId, filename):
        return getCached(folderId, filename)

    # generate data
    data_allframes = getData_AllFrames(folderId)
    colHeaders = getColTracksHeader(folderId, data_allframes)
    if colHeaders is None:
        colHeaderString = 'X,Y,Mass (pg),Time (h),id,Mean Value,Shape Factor,Location ID,Frame ID,xShift,yShift,segmentLabel'
        timeIndex = 3
        idIndex = 4
    else:
        colHeaders = [x[0] for x in colHeaders[0]]
        timeIndex = colHeaders.index('Time (h)')
        idIndex = colHeaders.index('id')
        colHeaderString = ','.join(colHeaders)

    massOverTime = getMassOverTimeArray(folderId, data_allframes)

    if massOverTime is None:
        raise Exception('Cannot find massOverTime')

    locIncluded =  colHeaders is not None and 'Location ID' in colHeaders
    frameIncluded = colHeaders is not None and 'Frame ID' in colHeaders
    xShiftIncluded = colHeaders is not None and 'xShift' in colHeaders
    yShiftIncluded = colHeaders is not None and 'yShift' in colHeaders
    segLabelIncluded = colHeaders is not None and 'segmentLabel' in colHeaders
    allIncluded = locIncluded and frameIncluded and xShiftIncluded and yShiftIncluded and segLabelIncluded

    if not allIncluded:
        timeArray = getTimeIndexArray(folderId, data_allframes)
        if timeArray is None:
            raise Exception('Cannot find timeArray')

    if not locIncluded:
        locationArray = getLocationArray(folderId, data_allframes)
        if colHeaders is not None:
            colHeaderString += ',' + 'Location ID'
    if not frameIncluded:
        frameArray = getFrameArray(folderId, data_allframes)
        if colHeaders is not None:
            colHeaderString += ',' + 'Frame ID'
    if not xShiftIncluded:
        xShiftArray = getXShiftArray(folderId, data_allframes)
        if colHeaders is not None:
            colHeaderString += ',' + 'xShift'
    if not yShiftIncluded:
        yShiftArray = getYShiftArray(folderId, data_allframes)
        if colHeaders is not None:
            colHeaderString += ',' + 'yShift'
    if not segLabelIncluded and colHeaders is not None:
        colHeaderString += ',' + 'segmentLabel'
    
    if not allIncluded:
        timeToIndex = {}
        uniqueLocationList = set()
        for index, time in enumerate(timeArray):
            # weird [0] indexing here is a result of weird
            # array structure that has nested arrays at 
            # surprising places
            time = time[0]
            if not locIncluded:
                locId = locationArray[0][index]
                uniqueLocationList.add(locId)
            else:
                locId = None
                uniqueLocationList.add(locationArray[0][index])

            if not frameIncluded:
                frameId = frameArray[index, 0]
            else:
                frameId = None

            if not xShiftIncluded:
                xShift = xShiftArray[index][0]
            else:
                xShift = None

            if not yShiftIncluded:
                yShift = yShiftArray[index][0]
            else:
                yShift = yShift = None
            timeToIndex[time] = (locId, frameId, xShift, yShift)

    if not segLabelIncluded:
        # todo - update for new data structure, and make sure uniqueLocationList is created
        uniqueLocationList = list(uniqueLocationList)
        uniqueLocationList.sort()
        labelLookup = buildLabelLookup(folderId, massOverTime, timeToIndex, uniqueLocationList)

    returnStr = colHeaderString + '\n'
    for index, row in enumerate(massOverTime):
        returnStr += ','.join(map(str, row))
        if not allIncluded:
            time = row[timeIndex]
            if not (locIncluded and frameIncluded and xShiftIncluded and yShiftIncluded):
                locationId, frameId, xShift, yShift = timeToIndex[time]
            # this corrects the xShift/yShift problem.
            # row[0] += xShift
            # row[1] += yShift
            if not segLabelIncluded:
                cellId = row[idIndex]
                label = labelLookup.get(cellId, {}).get(frameId, -1)
            if not locIncluded:
                returnStr += ',' + str(locationId)
            if not frameIncluded:
                returnStr += ',' + str(frameId)
            if not xShiftIncluded:
                returnStr += ',' + str(xShift)
            if not yShiftIncluded:
                returnStr += ',' + str(yShift)
            if not segLabelIncluded:
                returnStr += ',' + str(label)
        returnStr += '\n'

    cache(folderId, 'massOverTime.csv', returnStr)
    return returnStr

def buildLabelLookup(folderId: str, massOverTime: Dict, timeToIndex: Dict, locationArray: List) -> Dict:
    labelLookup = {}
    for locId in locationArray:
        print('####===--> build label lookup, LOCATION ID = ' + str(locId))
        imageLabelStack = getLabeledImageStackArray(folderId, locId, True)
        if imageLabelStack is None:
            continue

        imgCenters = {}
        smallH, smallW, numImages = np.shape(imageLabelStack)
        for frame in range(numImages):
            frameId = frame + 1
            imgCenters[frameId] = calculateCenters(imageLabelStack[:, :, frame])
        
        for index,row in enumerate(massOverTime):
            endChar = '\r'
            if index == len(massOverTime) - 1:
                endChar = '\n'
            print('row: {} of {}'.format(index + 1, len(massOverTime)), end=endChar)
            x = row[0]
            y = row[1]
            time = row[3]
            cellId = row[4]
            cellLocId, cellFrameId, xShift, yShift = timeToIndex[time]
            if cellLocId != locId:
                continue
            currentImgCenters = imgCenters[cellFrameId]
            cellPos = (x + xShift, y + yShift)
            # print('(cellId, frameId) = ' + str(cellId) + ', ' + str(cellFrameId))
            closestLabel = getClosestLabel(currentImgCenters, cellPos)
            cellDict = labelLookup.get(cellId, {})
            cellDict[cellFrameId] = closestLabel
            labelLookup[cellId] = cellDict
            
        # print('imageLabelStack: ' + str(imageLabelStack))
        # print()

    return labelLookup

def calculateCenters(imgArray) -> List[Tuple[float, float, int]]:
    h, w = np.shape(imgArray)
    labelLookup = {}
    for x in range(w):
        for y in range(h):
            label = imgArray[y][x]
            if label == 0:
                continue
            
            xSum, ySum, count = labelLookup.get(label, (0,0,0))
            # add one to get bottom right of pixel.
            # (It looks like this is closer to what they compute for x,y)
            xSum += (x + 1)
            ySum += (y + 1)
            count += 1
            labelLookup[label] = (xSum, ySum, count)
    
    centerList = []
    for label, (xSum, ySum, count) in labelLookup.items():
        xAvg = xSum / float(count)
        yAvg = ySum / float(count)
        centerList.append((xAvg, yAvg, label))
    return centerList

def getClosestLabel(imgCenters: List[Tuple[float, float, int]], cellPos: Tuple[float, float]) -> int:
    closestDistSoFar = math.inf
    bestLabelSoFar = -1
    cellX, cellY = cellPos
    for x, y, label in imgCenters:
        thisDist = (x - cellX)**2 + (y - cellY)**2
        # skip square root - this adds compute and doesn't change order
        if thisDist < closestDistSoFar:
            closestDistSoFar = thisDist
            bestLabelSoFar = label


    if closestDistSoFar > 0:
        if closestDistSoFar > 1:
            print()
            print('~~~ Warning, larger dist ~~~')
            print('dist: ' + str(math.sqrt(closestDistSoFar)))
            print()
    return bestLabelSoFar

def getData_AllFrames(folderId: str) -> Union[Dict, None]:
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat')

def getColTracksHeader(folderId: str, matlabDict = None):
    return getMatlabObjectFromKey(folderId, 'tracksColHeaders',  matlabDict)

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

def getMatlabObjectFromKey(folderId: str, key: str, matlabDict: Union[dict, h5py.File] = None):
    if matlabDict != None:
        return getNormalizedMatlabObjectFromKey(matlabDict, key)
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat', key)

def getMatlabObjectFromGoogleDrive(folderId: str, filename: str, matlabKey: str = None, doNotAbort = False):
    fileId, service = getFileId(folderId, filename, doNotAbort)
    if fileId is None:
        return None
    matlabDict = getMatlabDictFromGoogleFileId(fileId, service)

    if matlabKey != None:
        return getNormalizedMatlabObjectFromKey(matlabDict, matlabKey)
    return matlabDict

def getNormalizedMatlabObjectFromKey(matlabDict: Union[dict, h5py.File], key: str):
    if key not in matlabDict:
        return None
    if type(matlabDict) == dict:
        return matlabDict[key]
    # else it is an h5py file, which has to be transposed
    # (https://www.mathworks.com/matlabcentral/answers/308303-why-does-matlab-transpose-hdf5-data)
    return np.array(matlabDict[key]).T

@app.route('/data/<string:folderId>/img_<int:locationId>_labels.dat')
def getImageStackMetaData(folderId: str, locationId: int) -> str:
    labeledImageStackArray = getLabeledImageStackArray(folderId, locationId, True)

    S = 1
    labeledImageStackArray = downSample(labeledImageStackArray, S)

    if labeledImageStackArray is None:
        fileObject = io.BytesIO()
        vals = array.array('B', [])
        vals.tofile(fileObject)
        fileObject.seek(0)
        response = flask.send_file(fileObject, mimetype='application/octet-stream')
        # response.headers['tiledImageMetaData'] = json.dumps(metaData)
        return response

    labeledImageStackArray = labeledImageStackArray.astype(np.int32)
    metaData = getTiledImageMetaData(labeledImageStackArray, S)

    fileObject = io.BytesIO()
    flatList = []
    for t in range(metaData['numberOfTiles']):
        for y in range(metaData['tileHeight']):
            for x in range(metaData['tileWidth']):
                flatList.append(int(labeledImageStackArray[y, x, t]))
    vals = array.array('B', flatList)

    vals.tofile(fileObject)

    fileObject.seek(0)

    response = flask.send_file(fileObject, mimetype='application/octet-stream')

    response.headers['tiledImageMetaData'] = json.dumps(metaData)
    return response

@app.route('/data/<string:folderId>/imageMetaData.json')
@authRequired
def getImageStackMetaDataJson(folderId: str):
    innerFolderId, _ = getFileId(folderId, '.vizMetaData',True)
    if innerFolderId is None:
        return
    fileId, service = getFileId(innerFolderId, 'imageMetaData.json', True)
    if fileId is None:
        return
    f = getFileFromGoogleDrive(fileId, service)
    f.seek(0)
    return flask.send_file(f, mimetype='application/json')

@app.route('/data/<string:folderId>/img_<int:locationId>_<int:bundleIndex>.jpg')
@authRequired
def getImageStackBundle(folderId: str, locationId: int, bundleIndex: int):
    innerFolderId, _ = getFileId(folderId, 'data{}'.format(locationId), True)
    if innerFolderId is None:
        return
    fileId, service = getFileId(innerFolderId, 'D{}.jpg'.format(bundleIndex),)
    if fileId is None:
        return
    f = getFileFromGoogleDrive(fileId, service)
    f.seek(0)
    return flask.send_file(f, mimetype='image/jpeg')

@app.route('/data/<string:folderId>/label_<int:locationId>_<int:bundleIndex>.pb')
@authRequired
def getImageLabelBundle(folderId: str, locationId: int, bundleIndex: int):
    innerFolderId, _ = getFileId(folderId, 'data{}'.format(locationId), True)
    if innerFolderId is None:
        return
    fileId, service = getFileId(innerFolderId, 'L{}.pb'.format(bundleIndex),)
    if fileId is None:
        return
    f = getFileFromGoogleDrive(fileId, service)
    f.seek(0)
    return flask.send_file(f, mimetype='application/octet-stream')

@app.route('/data/<string:folderId>/img_<int:locationId>.png')
@authRequired
def getImageStack(folderId: str, locationId: int):
    imageStackArray = getImageStackArray(folderId, locationId)
    S = 1
    imageStackArray = downSample(imageStackArray, S)
    shape = np.shape(imageStackArray)
    print("image stack shape = " + str(shape))

    tiledImg, metaData = getTiledImage(imageStackArray, 'F', False, False, S)
    fileObject = getImageFileObject(tiledImg, metaData)

    response = flask.send_file(fileObject, mimetype='image/png')
    response.headers['tiledImageMetaData'] = json.dumps(metaData)
    return response

def downSample(imageStackArray, factor = 3):
    return imageStackArray[::factor,::factor,:]

def getImageStackArray(folderId: str, locationId: int):
    exampleDatasets = set(['1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96','1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX'])
    filenamePattern = 'data{}.mat'
    if (folderId in exampleDatasets):
        filenamePattern = 'Copy of data{}.mat'
    imageFilename = filenamePattern.format(locationId)
    # this is more for faster development
    cachePath = './static/cache/' + folderId
    filePath = cachePath + '/' + imageFilename
    if os.path.exists(filePath):
        return loadmat(filePath)['D_stored']
    return getMatlabObjectFromGoogleDrive(folderId, imageFilename, 'D_stored')

def getLabeledImageStackArray(folderId: str, locationId: int, doNotAbort = False):
    exampleDatasets = set(['1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96','1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX'])
    filenamePattern = 'data{}.mat'
    if (folderId in exampleDatasets):
        filenamePattern = 'Copy of data{}.mat'
    imageFilename = filenamePattern.format(locationId)
    # this is more for faster development
    cachePath = './static/cache/' + folderId
    filePath = cachePath + '/' + imageFilename
    if os.path.exists(filePath):
        return loadmat(filePath)['L_stored']
    return getMatlabObjectFromGoogleDrive(folderId, imageFilename, 'L_stored', doNotAbort)

def getTiledImageFileObject(imageStackArray, imageType: str, colorize = False, getOutline = False) -> io.BytesIO:
    tiledImg, metaData = getTiledImage(imageStackArray, imageType, colorize, getOutline)
    return getImageFileObject(tiledImg, metaData)

def getTiledImage(imageStackArray, imageType: str, colorize = False, getOutline = False, scaleFactor = 1) -> Tuple[any, Dict]:
    tiledImgMetaData = getTiledImageMetaData(imageStackArray, scaleFactor)
    smallW = tiledImgMetaData['tileWidth']
    smallH = tiledImgMetaData['tileHeight']
    numberOfColumns = tiledImgMetaData['numberOfColumns']
    numImages = tiledImgMetaData['numberOfTiles']

    numImageH = math.ceil(numImages / float(numberOfColumns))

    (bigWidth, bigHeight) = (numberOfColumns * smallW, numImageH * smallH)    

    if imageType == 'F':
        bigImageType = 'RGB'
    else:
        bigImageType = imageType
    # bigImageType = 'RGBA'
    bigImg = Image.new(bigImageType, (bigWidth, bigHeight))

    for timeIndex in range(numImages):
        smallImg = imageStackArray[:, :, timeIndex]
        smallImg = Image.fromarray(smallImg, imageType)
        if colorize:
            firebrick = (178, 34, 34, 255) # css named color
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

def getTiledImageMetaData(imageStackArray, scaleFactor) -> Dict:
    size = np.shape(imageStackArray)
    smallH, smallW, numImages = size
    numberOfColumns = 10
    tiledImgMetaData = {
        'tileWidth': smallW,
        'tileHeight': smallH,
        'numberOfColumns': numberOfColumns,
        'numberOfTiles': numImages,
        'scaleFactor': scaleFactor
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
    outputImg = Image.new('RGBA', labeledValueImg.size)
    coloredImgData = labeledValueImg.getdata()
    backColor = (0,255,0,0) # black
    outputImgData = [nonZeroColor if x != 0 else backColor for x in coloredImgData]
    outputImg.putdata(outputImgData)
    return outputImg

def getFileId(folderId: str, filename: str, doNotAbort = False) -> Tuple[str, googleapiclient.discovery.Resource]:
    credentials = google.oauth2.credentials.Credentials(**flask.session['credentials'])
    service: googleapiclient.discovery.Resource = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)
    
    query = "'" + folderId + "' in parents and name='" + filename + "'"
    responseFields = "nextPageToken, files(id, name)"
    
    results = service.files().list(q=query, fields=responseFields).execute()
    items = results.get('files', [])
    if len(items) == 0:
        if doNotAbort:
            return None, None
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

def getMatlabDictFromGoogleFileId(googleFileId: str, service: googleapiclient.discovery.Resource) -> Union[dict, h5py.File]:
    f = getFileFromGoogleDrive(googleFileId, service)

    matlabObject = openAnyMatlabFile(f)
    return matlabObject

def getFileFromGoogleDrive(googleFileId: str, service: googleapiclient.discovery.Resource) -> BytesIO:
    f = io.BytesIO()
    request = service.files().get_media(fileId=googleFileId)

    downloader = MediaIoBaseDownload(f, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
        print( "Download {} %".format(int(status.progress() * 100)), end='\r')

    return f

def openAnyMatlabFile(bytesIO) -> Union[dict, h5py.File]:
    try:
        outputDict = h5py.File(bytesIO, 'r')
    except:
        tempFilename = TEMP_FILES_FOLDER + 'temp.mat'
        tmpFile = open(tempFilename, 'wb')
        tmpFile.write(bytesIO.getvalue())
        tmpFile.close()
        outputDict = loadmat(tempFilename)
    return outputDict

@app.errorhandler(404)
def page_not_found(error):
    return flask.redirect('/static/404.jpg')    

if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
    app.run('localhost', 8080, debug=True)