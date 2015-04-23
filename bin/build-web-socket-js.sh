#!/bin/bash

set -euo pipefail

root="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/.. > /dev/null && pwd )"
src="$root/src/web-socket-js"

cd $src

if [[ $JAVA_HOME ]]; then
  # ok use this one
  true

elif [[ -x /usr/libexec/java_home ]]; then
  # on os x we have this thing for finding java_home
  export JAVA_HOME=$(/usr/libexec/java_home -v 1.6)
fi

cd $src/flash-src

if ! command -v mxmlc; then
  echo "please install the flex sdk"
  exit 1
fi

mxmlc \
  -static-link-runtime-shared-libraries \
  -target-player=11.1.0 \
  -output=$src/WebSocketMain.swf \
  -source-path=src -source-path=third-party \
  src/net/gimite/websocket/WebSocketMain.as

mxmlc \
  -static-link-runtime-shared-libraries \
  -target-player=11.1.0 \
  -output=$src/WebSocketMainInsecure.swf \
  -source-path=src -source-path=third-party \
  src/net/gimite/websocket/WebSocketMainInsecure.as
