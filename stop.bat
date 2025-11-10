@echo off
echo ========================================
echo   Stopping Velorent Application
echo ========================================
echo.

echo Stopping Node.js processes...
taskkill /f /im node.exe 2>nul

echo Stopping Ionic processes...
taskkill /f /im node.exe 2>nul

echo.
echo All servers have been stopped.
pause

