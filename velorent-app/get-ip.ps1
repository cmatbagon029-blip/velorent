# Get Local IP Address for Windows
Write-Host "Finding your local IP address..." -ForegroundColor Cyan
Write-Host ""

$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -ExpandProperty IPAddress

if ($ipAddresses.Count -eq 0) {
    Write-Host "No IP address found. Make sure you're connected to a network." -ForegroundColor Red
} else {
    Write-Host "Your local IP address(es):" -ForegroundColor Green
    foreach ($ip in $ipAddresses) {
        Write-Host "  - $ip" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Update environment.prod.ts with:" -ForegroundColor Cyan
    Write-Host "  apiUrl: 'http://$($ipAddresses[0]):3000/api'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to copy the first IP to clipboard..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    $ipAddresses[0] | Set-Clipboard
    Write-Host "IP address copied to clipboard!" -ForegroundColor Green
}

