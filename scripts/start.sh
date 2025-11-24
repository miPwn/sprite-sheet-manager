#!/bin/bash

echo "Starting Sprite Sheet Manager..."
echo ""

echo "Checking dependencies..."

if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

echo ""
echo "All dependencies installed!"
echo ""
echo "Starting development servers..."
echo "- Backend API will run on http://localhost:5000"
echo "- Frontend will run on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

npm run dev