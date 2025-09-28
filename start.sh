#!/bin/bash

# Start nginx in background
nginx -g "daemon off;" &

# Wait a moment for nginx to start
sleep 2

# Start the Node.js application
cd /app
npm start