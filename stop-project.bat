@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT_DIR=%~dp0"

for /f "skip=1 tokens=1" %%P in ('wmic process where "commandline like '%%C:\\Users\\HP\\Desktop\\preboarding-assistance\\server%%' or commandline like '%%C:\\Users\\HP\\Desktop\\preboarding-assistance\\client%%'" get processid 2^>nul ^| findstr /r "[0-9]"') do (
  echo Stopping project process %%P
  taskkill /PID %%P /F >nul 2>&1
)

for /f "skip=1 tokens=1" %%P in ('wmic process where "commandline like '%%vite%%' and commandline like '%%preboarding-assistance%%'" get processid 2^>nul ^| findstr /r "[0-9]"') do (
  echo Stopping frontend process %%P
  taskkill /PID %%P /F >nul 2>&1
)

echo.
echo Project processes stopped.
echo If Node.js processes still remain, close them manually from Task Manager.
pause
exit /b 0
