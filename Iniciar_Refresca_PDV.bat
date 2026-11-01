@echo off
chcp 65001 >nul
title Refresca Bebidas - Modo PDV (Impressao Automatica)
echo ========================================================
echo   Iniciando Refresca Bebidas no Modo PDV Express
echo   Impressao Automatica 100%% Silenciosa Ativada (Kiosk)
echo ========================================================

set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME_PATH% set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist %EDGE_PATH% set EDGE_PATH="C:\Program Files\Microsoft\Edge\Application\msedge.exe"

set TARGET_URL=https://depositorefresca.com.br/admin/orders
set USER_DATA=%LOCALAPPDATA%\RefrescaPDV

if exist %CHROME_PATH% (
    start "" %CHROME_PATH% --user-data-dir="%USER_DATA%" --kiosk-printing --app=%TARGET_URL%
    exit
)

if exist %EDGE_PATH% (
    start "" %EDGE_PATH% --user-data-dir="%USER_DATA%" --kiosk-printing --app=%TARGET_URL%
    exit
)

echo Navegador Chrome ou Edge nao encontrado.
pause
