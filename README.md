# cell-growth

# Download/Install
`git clone https://github.com/visdesignlab/cell-growth.git`

`cd cell-growth`

`sudo sh setup.sh`

- setup will create a .env file with variables to fill out.

| Argument        | Description           |
|---|---|
| CLIENT_SECRETS_FILENAME` | Path to google credentials file. **Not tracked in GitHub.** |
| TEMP_FILES_FOLDER| Path to folder used for programiatically creating temporary files.      | 
| TOP_GOOGLE_DRIVE_FOLDER_ID | google drive id for the top folder for any data |
| OAUTHLIB_INSECURE_TRANSPORT | Set to `1` for development, delete entire variable for production. [(Link)](https://flask-dance.readthedocs.io/en/v0.8.0/quickstarts/google.html#index-2) |
| OAUTHLIB_RELAX_TOKEN_SCOPE | Can be left as `1`. [(link)](https://flask-dance.readthedocs.io/en/v0.8.0/quickstarts/google.html#index-3) |
| FLASK_SECRET_KEY | should be set to a secret random string |
| FLASK_ENV | should be either `development` or `production` |
| FLASK_SERVER_NAME | server name, e.g. for development it can be `localhost:8080` |

## There are a handful of files that must be added that are not tracked on GitHub.
- Google client secrets file for google auth/access to drive.
- `static/cache/datasetList/derived/combined.json` - an aggregation of available datasets.
- `static/cache/datasetList/*.json` - one json metadata file for each available dataset

## Install JS dependencies

`npm install`

## Install Python dependencies (e.g. using using virtualenv)

### Create [virtual environment](https://docs.python.org/3/tutorial/venv.html):

`python3 -m venv .venv`

### Activate virual environment:

Windows: `.venv\Scripts\activate.bat`

Mac: `source .venv/bin/activate`

### Install dependencies:

`python3 -m pip install -r requirements.txt`

### Troubleshooting
- See docs: [https://www.typescriptlang.org/docs/handbook/gulp.html](https://www.typescriptlang.org/docs/handbook/gulp.html)

# Build JS 

`gulp`

# Run server

`python3 app.py`
