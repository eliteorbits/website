@echo off
echo ============================================
echo   Elite Orbits - Starting local server
echo ============================================
echo.

cd backend

if not exist node_modules (
  echo Installing backend dependencies for the first time, please wait...
  call npm install
)

if not exist .env (
  echo Creating .env file from template...
  copy .env.example .env
)

echo.
echo Starting backend at http://localhost:4000 ...
start "Elite Orbits Backend" cmd /k npm start

timeout /t 3 /nobreak >nul

echo Opening the website in Chrome...
cd ..\frontend
start chrome "%cd%\index.html"

echo.
echo Done. Keep the black backend window open while using the site.
pause
