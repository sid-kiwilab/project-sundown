@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found on PATH. Install Node 18+ from https://nodejs.org/ and try again.
  goto :fail
)

where npm >nul 2>&1
if errorlevel 1 (
  echo npm was not found on PATH. Reinstall Node.js ^(includes npm^) and try again.
  goto :fail
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

echo.
echo ========================================
echo   Sundown UI — NOT the CLI
echo   Building scan engine, then Next.js...
echo   Open http://localhost:3000 in your browser
echo ========================================
echo.

call npm run build:engine
if errorlevel 1 goto :fail

call npm run dev -w @sundown/web
if errorlevel 1 goto :fail

exit /b 0

:fail
echo.
echo start.bat failed. See errors above.
pause
exit /b 1