@echo off
echo Starting Sprite Sheet Manager...
echo.

echo Checking dependencies...

if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo.
echo All dependencies installed!
echo.
echo Starting development servers...
echo - Backend API will run on http://localhost:5000
echo - Frontend will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop the servers
echo.

call npm run dev