#! /bin/bash

PROJ_DIR="$HOME/family-tree-vault"
cd ${PROJ_DIR} || exit 1

cordova build android
cordova run android --device
