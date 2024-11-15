#!/bin/bash
echo "$FIREBASE_SERVICE_ACCOUNT_KEY" > /src/server/utils/serviceAccountKey.json
chmod 600 /src/server/utils/serviceAccountKey.json
exec "$@"