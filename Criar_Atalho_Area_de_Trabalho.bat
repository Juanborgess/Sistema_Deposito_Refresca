@echo off
chcp 65001 >nul
title Criador de Atalho Refresca PDV

echo ========================================================
echo   Criando atalho do Refresca PDV na sua Area de Trabalho
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$lnkPath = [System.IO.Path]::Combine($desktop, 'Refresca Bebidas PDV.lnk'); " ^
  "$shortcut = $ws.CreateShortcut($lnkPath); " ^
  "$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; " ^
  "if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }; " ^
  "if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' }; " ^
  "$shortcut.TargetPath = $chrome; " ^
  "$localData = [Environment]::GetFolderPath('LocalApplicationData'); " ^
  "$shortcut.Arguments = '--user-data-dir=\"' + $localData + '\RefrescaPDV\" --kiosk-printing --app=https://depositorefresca.com.br/admin/orders'; " ^
  "$shortcut.Description = 'Refresca Bebidas - Painel Gerente com Impressao Automatica 100% Silenciosa'; " ^
  "$shortcut.IconLocation = $chrome + ',0'; " ^
  "$shortcut.Save(); " ^
  "Write-Host 'Atalho criado com sucesso na Area de Trabalho!' -ForegroundColor Green"

echo.
echo ========================================================
echo   Pronto! Procure o icone 'Refresca Bebidas PDV' na
echo   sua Area de Trabalho do Windows e abra por ele.
echo ========================================================
echo.
pause

