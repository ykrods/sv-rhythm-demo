#!/bin/bash
# NOTE: このスクリプトはコンテナ作成後に実行される
sudo chown vscode:vscode node_modules
npm install
npx playwright-cli install-browser chromium --with-deps

