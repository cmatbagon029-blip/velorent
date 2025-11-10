@echo off
echo Finding your local IP address...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set ip=%%a
    set ip=!ip:~1!
    echo Your local IP address: !ip!
    echo.
    echo Update environment.prod.ts with:
    echo   apiUrl: 'http://!ip!:3000/api'
    echo.
    echo !ip! | clip
    echo IP address copied to clipboard!
    goto :done
)

:done
pause

