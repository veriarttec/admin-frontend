#!/bin/bash
set -e
npm install
npm run build
exec npm start -- -p "${PORT:-3000}"
