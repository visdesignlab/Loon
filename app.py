import os, io, math
from functools import wraps

# web framework
import flask
from flask.helpers import url_for

# Google authentication
import google.oauth2.credentials
import googleapiclient.discovery
import google_auth_oauthlib.flow

# working with matlab (.mat) files
from scipy.io import loadmat
from PIL import Image
import numpy as np

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
    print('###################################')
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
    massOverTime = getMassOverTimeArray(folderId)
    returnStr = 'x,y,mass,time,id,meanValue,shapeFactor\n'
    for row in massOverTime:
        returnStr += ",".join(map(str, row)) + '\n'

    # cache file
    if not os.path.exists(cachePath):
        os.mkdir(cachePath)
    cache = open(cachePath + '/' + 'massOverTime.csv', 'w')
    cache.write(returnStr)
    cache.close()

    return returnStr


def getMassOverTimeArray(folderId: str):
    return getMatlabObjectFromGoogleDrive(folderId, 'data_allframes.mat', 'tracks')

@app.route('/data/<string:folderId>/img_<int:frameId>.png')
@authRequired
def getImageStack(folderId: str, frameId: int):
    imageStackArray = getImageStackArray(folderId, frameId)

    fileObject = getTiledImage(imageStackArray)

    response = flask.send_file(fileObject, mimetype='image/png')

    return response

def getImageStackArray(folderId: str, frameId: int):
    imageFilename = 'Copy of data' + str(frameId) + '.mat'
    return getMatlabObjectFromGoogleDrive(folderId, imageFilename, 'D_stored')

def getTiledImage(imageStackArray) -> io.BytesIO:
    size = np.shape(imageStackArray)
    smallH, smallW, numImages = size

    numImageW = 10
    numImageH = math.ceil(numImages / float(numImageW))


    (bigWidth, bigHeight) = (numImageW * smallW, numImageH * smallH)
    bigImg = Image.new('F', (bigWidth, bigHeight))

    for timeIndex in range(numImages):
        smallImg = imageStackArray[:, :, timeIndex]
        smallImg = Image.fromarray(smallImg, 'F')

        x = timeIndex % numImageW
        y = math.floor(timeIndex / numImageW)
        top = y * smallH
        left = x * smallW
        bigImg.paste(smallImg, (left, top))

    bigImg = bigImg.convert('RGB')

    fileObject = io.BytesIO()

    bigImg.save(fileObject, "png")
    fileObject.seek(0)

    return fileObject

def getMatlabObjectFromGoogleDrive(folderId: str, filename: str, matlabKey: str):
    fileId, service = getFileId(folderId, filename)
    matlabDict = getMatlabDictFromGoogleFileId(fileId, service)
    return matlabDict[matlabKey]

def getFileId(folderId: str, filename: str):
    credentials = google.oauth2.credentials.Credentials(**flask.session['credentials'])
    service: googleapiclient.discovery.Resource = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)
    
    query = "'" + folderId + "' in parents and name='" + filename + "'"
    responseFields = "nextPageToken, files(id, name)"
    
    results = service.files().list(q=query, fields=responseFields).execute()
    items = results.get('files', [])
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

if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
    app.run('localhost', 8080, debug=True)