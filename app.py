from io import BytesIO
import os, io
from functools import wraps
from typing import Dict, Tuple, List, Union, Set
from datetime import datetime

import settings

# web framework
import flask
from flask.helpers import url_for
from flask import abort

# Google authentication
import google.oauth2.credentials
import googleapiclient.discovery
from googleapiclient.http import MediaIoBaseDownload
import google_auth_oauthlib.flow

# various json manipulation
import json

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
app = flask.Flask(__name__)
app.secret_key = settings.FLASK_SECRET_KEY

@app.route('/auth')
def auth():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(settings.CLIENT_SECRETS_FILENAME, scopes=SCOPES)
    flow.redirect_uri = url_for('authCallback', _external=True)

    authUrl, state = flow.authorization_url(access_type='offline', include_granted_scopes='true', prompt='consent')

    flask.session['state'] = state
    return flask.redirect(authUrl)

def authRequired(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # flask.session.clear()
        print('@authRequired')
        flask.session['allowAccessToAll'] = shouldAllowAccessToAll(kwargs)
        if not credentialsValid() and not flask.session['allowAccessToAll']:
            print('credentials')
            flask.session['nextUrl'] = flask.request.url
            return flask.redirect(url_for('auth'))
        return f(*args, **kwargs)
    return decorated_function

def shouldAllowAccessToAll(args) -> bool:
    if 'folderId' in args and args['folderId'] == settings.DEMO_ID:
        return True
    if 'datasetId' in args and args['datasetId'] == settings.DEMO_NAME:
        return True
    return False

@app.route('/authCallback')
def authCallback():
    state = flask.session['state']
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(settings.CLIENT_SECRETS_FILENAME, scopes=SCOPES, state=state)
    flow.redirect_uri = url_for('authCallback', _external=True)

    flow.fetch_token(authorization_response=flask.request.url)

    creds = flow.credentials
    flask.session['credentials'] = {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': creds.scopes
    }
    return flask.redirect(flask.session['nextUrl'])

@app.route('/')
def index():
    return flask.render_template('index.html', deploy=settings.FLASK_ENV == 'production')

@app.route('/overview')
@authRequired
def overview():
    return flask.render_template('overview.html', deploy=settings.FLASK_ENV == 'production')

@app.route('/detailedView/<string:datasetId>')
@authRequired
def detailedView(datasetId: str):
    return flask.render_template('detailedView.html', datasetId=datasetId, deploy=settings.FLASK_ENV == 'production')

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
    if os.path.exists(filePath):
        return flask.redirect(filePath[1:]) # don't want '.' here
    return "{}"

@app.route('/data/update_dataset_list')
@authRequired
def updateDataSpecList() -> str:
    credentials = google.oauth2.credentials.Credentials(**flask.session['credentials'])
    service: googleapiclient.discovery.Resource = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)
    query = "name = '.vizMetaData'"
    responseFields = "nextPageToken, files(id, parents, modifiedTime, owners)"
    results = service.files().list(q=query, fields=responseFields, pageSize=1000).execute()
    candidateFiles = results.get('files', [])
    print('Number of .vizMetaDataFolders:', len(candidateFiles))
    skipCount = 0
    filenameSet = set()
    textLines = []
    for index, candidateFile in enumerate(candidateFiles):
        print('Building: {}/{}'.format(index+1, len(candidateFiles)))
        folderId = candidateFile['id']
        print('\t' + candidateFile['id'])
        dataSpecObj, msg = getDataSpecObj(service, candidateFile)
        print('dataSpecObj', dataSpecObj)
        if dataSpecObj is None:
            textLines.append('FAIL (' + msg + ') - ' + folderId)
            skipCount += 1
            continue
        filename = dataSpecObj['uniqueId']
        if filename in filenameSet:
            textLines.append('FAIL (duplicate filename[' + filename + ']) - ' + folderId)
            # Google allows two file of the same name in a folder.
            # I do not.
            continue
        textLines.append('PASS - ' + folderId)
        filenameSet.add(filename)
        filename = './static/cache/datasetList/' + filename + '.json'
        print('open file:', filename)
        dataSpecFile = open(filename, 'w')
        writeToFile = json.dumps(dataSpecObj)
        print('write to file', writeToFile)
        dataSpecFile.write(writeToFile)
        dataSpecFile.close()
    print('')
    print('done')
    summaryText = 'Total: {}; '.format(len(candidateFiles))
    summaryText += 'Passed: {}; '.format(len(candidateFiles) - skipCount)
    summaryText += 'Failed: {}; '.format(skipCount)
    # resultStr += 'Unique Filenames: {}; '.format(len(filenameSet))
    # resultStr += 'dupFilenames: {}'.format(len(candidateFiles) - skipCount - len(filenameSet))
    combineDatasetSpecsFromLocalFiles()
    return flask.render_template('update_dataset_list.html', textLines=textLines, summaryText=summaryText, deploy=settings.FLASK_ENV == 'production')


def getDataSpecObj(service, googleDriveFile) -> Tuple[Union[Dict, None], str]:
    folderId = googleDriveFile['id']
    metaDataFileId, _ = getFileId(folderId, 'experimentMetaData.json', True)
    if metaDataFileId is None:
        msg = 'Missing experimentMetaData.json in ' +  folderId
        print('\tgetDataSpecObj:' + msg)
        return None, msg
    metaDataFile = getFileFromGoogleDrive(metaDataFileId, service)

    massOverTimeFileId, _ = getFileId(folderId, 'massOverTime.pb', True)
    if massOverTimeFileId is None:
        msg = 'Missing massOverTime.pb in ' + folderId
        print('\tgetDataSpecObj: ' + msg)
        return None, msg
    massOverTimeMetaData = getFileMetaDataFromGoogleDrive(massOverTimeFileId, service, 'size')

    dataSpecObj = json.loads(metaDataFile.read())

    parentId = googleDriveFile['parents'][0]
    folderPathList = getFolderPathFromGoogleDrive(service, settings.TOP_GOOGLE_DRIVE_FOLDER_ID, parentId)
    unknownFolder = False
    if len(folderPathList) == 0:
        unknownFolder = True
        msg = 'Cannot find ' + parentId + ' in ' + settings.TOP_GOOGLE_DRIVE_FOLDER_ID
        print('\tgetDataSpecObj: ' + msg)
        # return None, msg

    dataSpecObj['googleDriveId'] = parentId
    if dataSpecObj.get('folder', '') == '':
        if unknownFolder:
            dataSpecObj['folder'] = 'unknown'
        else:
            dataSpecObj['folder'] = '/'.join(folderPathList) + '/'
    if dataSpecObj.get('author', '') == '':
        dataSpecObj['author'] = googleDriveFile['owners'][0]['displayName']
    if dataSpecObj.get('displayName', '') == '':
        if unknownFolder:
            dataSpecObj['displayName'] = 'unkown'
        else:
            dataSpecObj['displayName'] = folderPathList[2] + '/.../' + folderPathList[-1]
    if dataSpecObj.get('uniqueId', '') == '':
        dataSpecObj['uniqueId'] = parentId
    dataSpecObj['modifiedDate'] = googleDriveFile['modifiedTime'].split('T')[0]
    dataSpecObj['fileSize'] = massOverTimeMetaData['size']
    return dataSpecObj, 'OK'

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
        id = fileSpecObj['uniqueId']
        fileSpecObj['vizLinkHtml'] = '<a href="/detailedView/{}" target="_blank">Viz Link</a>'.format(id)
        driveUrl = 'https://drive.google.com/drive/u/1/folders/{}'.format(fileSpecObj['googleDriveId'])
        fileSpecObj['driveLinkHtml'] = '<a href="{}" target="_blank">Drive Link</a>'.format(driveUrl)
        combinedList.append(fileSpecObj)
        authorSet.add(fileSpecObj['author'])
        fileSpecObj['fileSize'] = int(fileSpecObj['fileSize']) / (1024 * 1024.0)
        maxSize = max(maxSize, fileSpecObj['fileSize'])

        del fileSpecObj['locationMaps'] # there is no point in copying these over
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
    print('getCached', 'folderId' + '=' + folderId, 'filename' + '=' + filename, 'filePath' + '=' + filePath)
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

@app.route('/data/<string:folderId>/massOverTime.pb')
@authRequired
def getMassOverTimePb(folderId: str): # -> flask.Response:
    filename = 'massOverTime.pb'

    innerFolderId, _ = getFileId(folderId, '.vizMetaData',True)
    if innerFolderId is None:
        print('getMassOverTimePb: ".vizMetaData" does not exist')
        return '' 
    fileId, service = getFileId(innerFolderId, filename, True)
    if fileId is None:
        print('getMassOverTimePb: "' + filename + '" does not exist')
        return ''

    if isCached(folderId, filename):
        filePath = cachePath(folderId, filename)
        cachedModifiedTime = os.path.getmtime(filePath)
        driveModifiedTime = getLastModifiedTimeFromGoogleDrive(fileId, service)
        if cachedModifiedTime > driveModifiedTime:
            print('loading cached files from ' + folderId)
            return getCached(folderId, filename)

    print('getting ' + filename + ' from ' + folderId)
    f = getFileFromGoogleDrive(fileId, service)

    cache(folderId, 'massOverTime.pb', f.getbuffer(), True) 

    response = flask.send_file(f, mimetype='application/octet-stream')
    return response
 
@app.route('/data/<string:folderId>/imageMetaData.json')
@authRequired
def getImageStackMetaDataJson(folderId: str):
    filename = 'imageMetaData.json'
    if isCached(folderId, filename):
        return getCached(folderId, filename)

    innerFolderId, _ = getFileId(folderId, '.vizMetaData',True)
    if innerFolderId is None:
        return
    fileId, service = getFileId(innerFolderId, 'imageMetaData.json', True)
    if fileId is None:
        return
    f = getFileFromGoogleDrive(fileId, service)
    return flask.send_file(f, mimetype='application/json')

@app.route('/data/<string:folderId>/img_<int:locationId>_<int:bundleIndex>.jpg')
@authRequired
def getImageStackBundle(folderId: str, locationId: int, bundleIndex: int):
    folder = '{}/data{}'.format(folderId, locationId)
    filename = 'D{}.jpg'.format(bundleIndex)
    if isCached(folder, filename):
        return getCached(folder, filename)

    try:
        # Google Drive API sometimes fails inside getFileId
        innerFolderId, _ = getFileId(folderId, 'data{}'.format(locationId), True)
        if innerFolderId is None:
            return
        fileId, service = getFileId(innerFolderId, 'D{}.jpg'.format(bundleIndex))
        if fileId is None:
            return
    except:
        print('Error: Failed in getFileId because of google drive API')
        return flask.send_file(io.BytesIO(), mimetype='image/jpeg')

    f = getFileFromGoogleDrive(fileId, service)
    return flask.send_file(f, mimetype='image/jpeg')

@app.route('/data/<string:folderId>/label_<int:locationId>_<int:bundleIndex>.pb')
@authRequired
def getImageLabelBundle(folderId: str, locationId: int, bundleIndex: int):
    folder = '{}/data{}'.format(folderId, locationId)
    filename = 'L{}.pb'.format(bundleIndex)
    if isCached(folder, filename):
        return getCached(folder, filename)

    try:
        # Google Drive API sometimes fails inside getFileId
        innerFolderId, _ = getFileId(folderId, 'data{}'.format(locationId), True)
        if innerFolderId is None:
            return
        fileId, service = getFileId(innerFolderId, 'L{}.pb'.format(bundleIndex))
        if fileId is None:
            return
    except:
        print('Error: Failed in getFileId because of google drive API')
        return flask.send_file(io.BytesIO(), mimetype='application/octet-stream')  
    f = getFileFromGoogleDrive(fileId, service)
    return flask.send_file(f, mimetype='application/octet-stream')

def getFileId(folderId: str, filename: str, doNotAbort = False) -> Tuple[str, googleapiclient.discovery.Resource]:
    if flask.session['allowAccessToAll']:
        credentials = google.oauth2.credentials.Credentials.from_authorized_user_file(settings.DEMO_CREDENTIALS_FILENAME)
    else:
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
    return credentials.valid and not credentials.expired


def getFileFromGoogleDrive(googleFileId: str, service: googleapiclient.discovery.Resource) -> BytesIO:
    f = io.BytesIO()
    request = service.files().get_media(fileId=googleFileId)

    downloader = MediaIoBaseDownload(f, request)
    done = False
    while done is False:
        try:
            status, done = downloader.next_chunk()
            print("Download {} %".format(int(status.progress() * 100)), end='\r')
        except:
            print("ERROR: Failed to download file from Google Drive. FileID:", googleFileId)
            return f
    f.seek(0)
    return f

def getLastModifiedTimeFromGoogleDrive(googleFileId: str, service: googleapiclient.discovery.Resource) -> float:
    metadata = getFileMetaDataFromGoogleDrive(googleFileId, service, 'modifiedTime')
    dateObj = datetime.strptime(metadata['modifiedTime'], '%Y-%m-%dT%H:%M:%S.%fZ')
    secondsSinceEpoch = (dateObj - datetime(1970, 1, 1)).total_seconds()
    return secondsSinceEpoch

def getFileMetaDataFromGoogleDrive(googleFileId: str, service: googleapiclient.discovery.Resource, dataFields: str):
    request = service.files().get(fileId=googleFileId, fields=dataFields)
    metadata = request.execute()
    return metadata

@app.route('/spinner.gif')
def getSpinner():
    return flask.redirect('/static/assets/spinner.gif')

@app.errorhandler(404)
def page_not_found(error):
    return flask.redirect('/static/404.jpg')    

if __name__ == '__main__':
    app.run()

