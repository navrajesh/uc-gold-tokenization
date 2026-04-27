@echo off
cd /d "%~dp0..\.."
echo Deploying contracts to localhost...
node_modules\.bin\hardhat run scripts\deploy\01-deploy-gold-token.ts --network localhost
if %errorlevel% neq 0 (
    echo.
    echo Deploy failed. Is the Hardhat node running?
    pause
    exit /b 1
)
echo.
echo Done. Addresses written to deployments\localhost.json
pause
