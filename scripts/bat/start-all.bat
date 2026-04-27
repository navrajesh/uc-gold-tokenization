@echo off
:: Starts the full stack in separate CMD windows.
:: Usage:
::   start-all.bat           -- chain + backend + frontend
::   start-all.bat --deploy  -- also runs deploy after chain starts
setlocal
set "S=%~dp0"

echo Launching Gold Tokenization Platform...

start "HH Node"     cmd /k ""%S%start-chain.bat""
timeout /t 1 /nobreak >nul
start "Backend API" cmd /k ""%S%start-backend.bat""
start "Frontend"    cmd /k ""%S%start-frontend.bat""

if /i "%~1"=="--deploy" (
    echo Waiting 5 s for Hardhat node to initialise...
    timeout /t 5 /nobreak >nul
    start "Deploy" cmd /k ""%S%deploy.bat""
)

echo.
echo   Chain    --^>  http://127.0.0.1:8545
echo   Backend  --^>  http://localhost:3001
echo   Frontend --^>  http://localhost:3000
echo.
echo   Tip: run with --deploy to also deploy contracts automatically.
endlocal
