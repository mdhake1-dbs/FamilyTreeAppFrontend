#!/bin/bash

echo "Checking development environment..."
echo ""

echo "Node.js version:"
node --version

echo "npm version:"
npm --version

echo "Cordova version:"
cordova --version

echo "Java version:"
java -version

echo "Python version:"
python3 --version

echo "Android SDK location:"
echo $ANDROID_HOME

echo "Platform tools:"
ls $ANDROID_HOME/platform-tools 2>/dev/null && echo "✓ Installed" || echo "✗ Not found"

echo ""
echo "All checks complete!"
