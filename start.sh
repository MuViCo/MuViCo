#!/bin/bash
echo "$FIREBASE_SERVICE_ACCOUNT_KEY" > /path/to/serviceAccountKey.json
chmod 600 /path/to/serviceAccountKey.json
exec "$@"
