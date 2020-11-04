mkdir tmp
mkdir static/cache/datasetList
mkdir static/cache/datasetList/derived
touch static/cache/datasetList/derived/combined.json
echo CLIENT_SECRETS_FILENAME = \<path to google credentials\> > .env
echo TEMP_FILES_FOLDER = 'tmp/' >> .env
echo TOP_GOOGLE_DRIVE_FOLDER_ID = \<top google drive id\> >> .env
echo OAUTHLIB_INSECURE_TRANSPORT = \<1 for development, delete for production\> >> .env
echo OAUTHLIB_RELAX_TOKEN_SCOPE = 1 >> .env
echo FLASK_SECRET_KEY = \<secret key, e.g. output of [python3 -c 'import os; print(os.urandom(16).hex())']\> >> .env
echo FLASK_ENV=\<development \| production \> >> .env
echo FLASK_SERVER_NAME=\<url, e.g. for development localhost:8080\> >> .env