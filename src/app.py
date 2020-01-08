import os
import flask
from flask.helpers import url_for
import google.oauth2.credentials
import googleapiclient.discovery
import google_auth_oauthlib.flow

CLIENT_SECRETS_FILENAME = 'config/credentials.json'
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

app = flask.Flask(__name__)
app.secret_key = "TODO: replace dev key in production"

@app.route('/')
def index():
    if 'credentials' not in flask.session:
        return flask.redirect('auth')
    
    credentials = google.oauth2.credentials.Credentials(**flask.session['credentials'])
    service: googleapiclient.discovery.Resource = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)

    # Hardcoded example folders
    adherentFolderId = '1_adgXIOUOBkx3pplmVPW7k5Ddq0Jof96'
    nonAdherentFolderId = '1Xzov6WDJPV5V4LK56CQ7QIVTl_apy8dX'
    massOverTimeFilename = 'data_allframes.mat'
    
    massOverTimeIds = []
    for folderId in [adherentFolderId, nonAdherentFolderId]:
        query = "'" + folderId + "' in parents and name='" + massOverTimeFilename + "'"
        responseFields = "nextPageToken, files(id, name)"

        results = service.files().list(q=query, fields=responseFields).execute()
        items = results.get('files', [])
        massOverTimeIds.append(items[0]['id'])

    return ", ".join(massOverTimeIds)


@app.route('/auth')
def auth():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(CLIENT_SECRETS_FILENAME, scopes=SCOPES)
    flow.redirect_uri = url_for('authCallback', _external=True)

    authUrl, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')

    flask.session['state'] = state
    return flask.redirect(authUrl)


@app.route('/authCallback')
def authCallback():
    state = flask.session['state']
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(CLIENT_SECRETS_FILENAME, scopes=SCOPES, state=state)
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
    return flask.redirect(url_for('index'))


if __name__ == '__main__':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
    app.run('localhost', 8080, debug=True)