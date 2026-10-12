@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "BACKEND_DIR=%~dp0server"
set "FRONTEND_DIR=%~dp0client"
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=5173"
set "APP_URL=http://localhost:%FRONTEND_PORT%"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed, or it is not on your PATH.
  echo Install Node.js LTS from https://nodejs.org and reopen this file.
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\package.json" (
  echo ERROR: Backend folder not found: %BACKEND_DIR%
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo ERROR: Frontend folder not found: %FRONTEND_DIR%
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\.env" (
  echo WARNING: %BACKEND_DIR%\.env was not found.
  echo Create it from %BACKEND_DIR%\.env.example and set your MySQL settings before starting the app.
)

if not exist "%FRONTEND_DIR%\.env" (
  echo WARNING: %FRONTEND_DIR%\.env was not found.
  echo Create it from %FRONTEND_DIR%\.env.example and set the API URL before starting the app.
)

set "BACKEND_RUNNING=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%BACKEND_PORT% " 2^>nul') do set "BACKEND_RUNNING=1"

if "%BACKEND_RUNNING%"=="1" (
  echo INFO: Backend port %BACKEND_PORT% is already in use. The API may already be running.
) else (
  echo Starting the Express backend on http://localhost:%BACKEND_PORT%...
  start "Pre-Boarding Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && npm install && npm run dev"
)

set "FRONTEND_RUNNING=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%FRONTEND_PORT% " 2^>nul') do set "FRONTEND_RUNNING=1"

if "%FRONTEND_RUNNING%"=="1" (
  echo INFO: Frontend port %FRONTEND_PORT% is already in use. The website may already be running.
) else (
  echo Starting the React frontend on http://localhost:%FRONTEND_PORT%...
  start "Pre-Boarding Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm install && npm run dev"
)

echo.
echo Waiting for the servers to initialize...
timeout /t 8 /nobreak >nul

start "" "%APP_URL%"

echo.
echo The application should now be opening in your browser.
echo If either terminal window shows errors, close it and check the messages shown there.
echo.
echo Useful URLs:
 echo   - Backend health check: http://localhost:%BACKEND_PORT%/api/health
 echo   - Frontend app: %APP_URL%

echo.
pause
exit /b 0
