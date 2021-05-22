#!/bin/bash
echo $0
./app/scripts/get_mc_dl_url.sh
./node/bin/node app/scripts/install.js $1 $2
./app/scripts/update_mc_server.sh