#!/bin/bash
set -e

APP_NAME="FamilyTree"
BUILD_TYPE="release"
VERSION=$(grep -oP 'version="\K[^"]+' config.xml)

APK_DIR="$HOME/family-tree-vault/platforms/android/app/build/outputs/apk/debug"
SRC="$APK_DIR/app-debug.apk"
DST="$HOME/family-tree-vault/APK/${APP_NAME}-${BUILD_TYPE}-v${VERSION}.apk"

mv "$SRC" "$DST"

echo "APK renamed to: $DST"

