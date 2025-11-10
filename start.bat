@echo off
echo ========================================
echo   Starting Velorent Application
echo ========================================
echo.

echo Starting Backend Server...
start "Velorent Backend" cmd /k "cd backend && node app.js"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Velorent Frontend" cmd /k "cd velorent-app && ionic serve"

echo.
echo ========================================
echo   Both servers are starting...
echo   Backend: http://localhost:3000
echo   Frontend: http://localhost:8100
echo ========================================
echo.
echo Press any key to exit this window (servers will continue running)
pause > nul

