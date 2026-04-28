@echo off
call :kill 8545 "Hardhat node"
call :kill 3001 "Backend (Express)"
call :kill 3000 "Frontend (Vite)"
exit /b

:kill
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%~1 " ^| findstr LISTENING') do (
    taskkill /PID %%p /F >nul 2>&1
    echo Killed  :%~1  %~2  (PID %%p)
    exit /b
)
echo Free    :%~1  %~2
exit /b
