$pythonScripts = "C:\Users\User\AppData\Local\Python\pythoncore-3.14-64\Scripts"
$nodeDir = "C:\Program Files\nodejs"

Write-Host "Starting backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; & '$pythonScripts\uvicorn.exe' main:app --reload"

Start-Sleep 2

Write-Host "Starting frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; & '$nodeDir\npm.cmd' run dev"

Write-Host ""
Write-Host "Both servers started!" -ForegroundColor Green
Write-Host "Open: http://localhost:3000" -ForegroundColor Yellow
