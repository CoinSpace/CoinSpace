#!/bin/bash

APP=$1
if [ -z $APP ]; then APP=dev-coinspace; fi

echo "=== APP: $APP ==="
cp .env.$APP .env
heroku docker:release --app $APP