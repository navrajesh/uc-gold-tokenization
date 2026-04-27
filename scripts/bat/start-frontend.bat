@echo off
cd /d "%~dp0..\..\frontend"

if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting frontend dev server on http://localhost:3000 ...
call npm run dev
pause
