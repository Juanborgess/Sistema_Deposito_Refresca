@echo off
chcp 65001 >nul
title Instalador Refresca Bebidas PDV

echo ========================================================
echo   Instalando o icone do Refresca Bebidas no seu computador...
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$lnkPath = [System.IO.Path]::Combine($desktop, 'Refresca Bebidas - Caixa PDV.lnk'); " ^
  "$shortcut = $ws.CreateShortcut($lnkPath); " ^
  "$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'; " ^
  "if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }; " ^
  "if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' }; " ^
  "$shortcut.TargetPath = $chrome; " ^
  "$localData = [Environment]::GetFolderPath('LocalApplicationData'); " ^
  "$shortcut.Arguments = '--user-data-dir=\"' + $localData + '\RefrescaPDV\" --kiosk-printing --app=https://depositorefresca.com.br/admin/orders'; " ^
  "$shortcut.Description = 'Refresca Bebidas - Painel Gerente e Caixa PDV'; " ^
  "$shortcut.IconLocation = $chrome + ',0'; " ^
  "$shortcut.Save(); " ^
  "Write-Host 'Sucesso! O icone foi adicionado a sua Area de Trabalho.' -ForegroundColor Green"

echo.
echo ========================================================
echo   Pronto! Procure o icone 'Refresca Bebidas - Caixa PDV'
echo   na tela inicial do computador e abra por ele.
echo ========================================================
echo.
timeout /t 5 >nul
