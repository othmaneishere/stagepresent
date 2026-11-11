$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process powershell -ArgumentList '-NoProfile','-WindowStyle','Hidden','-Command',"Set-Location -LiteralPath '$root'; python -m http.server 8765" | Out-Null
Start-Process 'http://localhost:8765/index.html'
