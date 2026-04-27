@echo off
cd /d "%~dp0..\.."
echo Deploying SGT916 token to localhost...
node_modules\.bin\hardhat run scripts\deploy\02-deploy-sgt916.ts --network localhost
if %errorlevel% neq 0 (
    echo.
    echo Deploy failed. Is the Hardhat node running?
    pause
    exit /b 1
)
echo.
echo Done. SGT916 addresses merged into deployments\localhost.json
pause
