import os, io, math, random
from functools import wraps
from typing import Dict

# web framework
import flask
from flask.helpers import url_for
from flask import abort

# Google authentication
import google.oauth2.credentials
import googleapiclient.discovery
import google_auth_oauthlib.flow

# working with matlab (.mat) files
from scipy.io import loadmat
from PIL import Image
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
            return flask.redirect(url_for('auth', next=flask.request.url))
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
    return flask.redirect(url_for('index'))

@app.route('/')
@authRequired
def index():
    return flask.render_template('index.html')

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
    timeToIndex = {}
    for index, time in enumerate(timeArray):
        # weird [0] indexing here is a result of weird
        # array structure that has nested arrays at 
        # surprising places
        time = time[0]
        locId = locationArray[0][index]
        frameId = frameArray[index, 0]
        timeToIndex[time] = (locId, frameId)

    returnStr = 'x,y,mass,time,id,meanValue,shapeFactor,locationId,frameId\n'
    for row in massOverTime:
        time = row[3]
        locationId, frameId = timeToIndex[time]
        returnStr += ",".join(map(str, row)) + ',' + str(locationId) + ',' + str(frameId) + '\n'

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
    key = 'tracks'
    if matlabDict != None and key in matlabDict:
        return matlabDict[key]
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat', key)
    
def getTimeIndexArray(folderId: str, matlabDict = None):
    key = 't_stored'
    if matlabDict != None and key in matlabDict:
        return matlabDict[key]
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat', key)
    
def getLocationArray(folderId: str, matlabDict = None):
    key = 'Loc_stored'
    if matlabDict != None and key in matlabDict:
        return matlabDict[key]
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat', key)
    
def getFrameArray(folderId: str, matlabDict = None):
    key = 'ii_stored'
    if matlabDict != None and key in matlabDict:
        return matlabDict[key]
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat', key)

@app.route('/data/<string:folderId>/img_<int:locationId>_metadata.json')
def getImageStackMetaData(folderId: str, locationId: int):
    # todo
    return

@app.route('/data/<string:folderId>/img_<int:locationId>.png')
@authRequired
def getImageStack(folderId: str, locationId: int):
    imageStackArray = getImageStackArray(folderId, locationId)
    
    shape = np.shape(imageStackArray)
    print("image stack shape = " + str(shape))

    fileObject = getTiledImage(imageStackArray, 'F')

    response = flask.send_file(fileObject, mimetype='image/png')

    return response

@app.route('/data/<string:folderId>/imgLabel_<int:locationId>.png')
@authRequired
def getLabeledImageStack(folderId: str, locationId: int):
    imageStackArray = getLabeledImageStackArray(folderId, locationId)


    shape = np.shape(imageStackArray)
    print("Labeled image stack shape = " + str(shape))

    fileObject = getTiledImage(imageStackArray, 'I;16')

    response = flask.send_file(fileObject, mimetype='image/png')

    return response

@app.route('/data/<string:folderId>/imgLabelColored_<int:locationId>.png')
@authRequired
def getLabeledColoredImageStack(folderId: str, locationId: int):
    imageStackArray = getLabeledImageStackArray(folderId, locationId)

    shape = np.shape(imageStackArray)
    print("Labeled Colored image stack shape = " + str(shape))
    print(type(imageStackArray))

    # outfile = open('./tmp/debug.txt')
    # np.save(outfile, imageStackArray)

    fileObject = getTiledImage(imageStackArray, 'I;16', True)

    response = flask.send_file(fileObject, mimetype='image/png')

    return response

def getImageStackArray(folderId: str, locationId: int):
    imageFilename = 'Copy of data' + str(locationId) + '.mat'
    return getMatlabObjectFromGoogleDrive(folderId, imageFilename, 'D_stored')

def getLabeledImageStackArray(folderId: str, locationId: int):
    imageFilename = 'Copy of data' + str(locationId) + '.mat'
    return getMatlabObjectFromGoogleDrive(folderId, imageFilename, 'L_stored')

def getTiledImage(imageStackArray, imageType: str, colorize = False) -> io.BytesIO:
    size = np.shape(imageStackArray)
    smallH, smallW, numImages = size
    numberOfColumns = 10
    tiledImgMetaData = {
        'tileWidth': smallW,
        'tileHeight': smallH,
        'numberOfColumns': numberOfColumns,
        'numberOfTiles': numImages
    }

    numImageH = math.ceil(numImages / float(numberOfColumns))


    (bigWidth, bigHeight) = (numberOfColumns * smallW, numImageH * smallH)
    bigImg = Image.new('RGB', (bigWidth, bigHeight))

    if colorize:
        colorLookup = {0: (0,0,0)}
    for timeIndex in range(numImages):
        smallImg = imageStackArray[:, :, timeIndex]
        smallImg = Image.fromarray(smallImg, imageType)
        if colorize:
            smallImg = getColorMappedImage(smallImg, colorLookup)
        x = timeIndex % numberOfColumns
        y = math.floor(timeIndex / numberOfColumns)
        top = y * smallH
        left = x * smallW
        bigImg.paste(smallImg, (left, top))

    bigImg = bigImg.convert('RGB')

    metaDataString: str = json.dumps(tiledImgMetaData)
    exifDict = {}
    exifDict['Exif'] = {}
    exifDict['Exif'][piexif.ExifIFD.MakerNote] = bytes(metaDataString, 'utf-8')
    print('exif = ' + str(exifDict))

    fileObject = io.BytesIO()

    bigImg.save(fileObject, "PNG", exif=piexif.dump(exifDict))
    fileObject.seek(0)

    return fileObject


def getColorMappedImage(labeledValueImg, lookup):
    random.seed(500)  # static seed so colors can be reproduced or compared
    outputImg = Image.new('RGB', labeledValueImg.size)
    coloredImgData = labeledValueImg.getdata()
    outputImgData = [getColor(x, lookup) for x in coloredImgData]
    outputImg.putdata(outputImgData)

    return outputImg

def getColor(label, lookup):
    if label in lookup:
        return lookup[label]
    # keep colors above 64 to help keep it distinguishable from black
    r = random.randint(64, 255)
    g = random.randint(64, 255)
    b = random.randint(64, 255)
    color = (r, g, b)
    lookup[label] = color
    return color


def getMatlabObjectFromGoogleDrive(folderId: str, filename: str, matlabKey: str = None):
    fileId, service = getFileId(folderId, filename)
    matlabDict = getMatlabDictFromGoogleFileId(fileId, service)
    # print('------ matlabDict!!!')
    # for key in matlabDict.keys():
    #     print(key)
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