@echo off
cd /d "%~dp0..\.."
echo Starting Hardhat node on http://127.0.0.1:8545 ...
node_modules\.bin\hardhat node
pause
