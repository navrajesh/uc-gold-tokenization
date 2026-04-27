@echo off
cd /d "%~dp0..\..\backend"

if not exist .env (
    echo .env not found - copying from .env.example
    copy .env.example .env
)

if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo Checking for process already on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 "') do (
    echo Killing PID %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting backend API on http://localhost:3001 ...
call npm run dev
pause
