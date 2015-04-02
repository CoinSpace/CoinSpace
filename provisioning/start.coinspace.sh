#!/bin/bash

cd {{ app_dir }}
export `cat {{ base_dir }}/{{ app_name }}.config`
#forever start server/server.js
forever start -c "npm start" ./
