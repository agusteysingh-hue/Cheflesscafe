$port = 8080
$root = $PSScriptRoot
if (-not $root) { $root = "C:\Users\Hp\.gemini\antigravity\scratch\chefless-cafe-landing" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$port/")

try {
    $listener.Start()
} catch {
    # If + binding fails, try localhost only
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  CHEFLESS CAFE - LOCAL SERVER RUNNING" -ForegroundColor Yellow  
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Desktop:  http://localhost:$port" -ForegroundColor Cyan
if ($localIP) {
    Write-Host "  Mobile:   http://${localIP}:$port" -ForegroundColor Green
    Write-Host ""
    Write-Host "  (Connect your phone to the same WiFi" -ForegroundColor Gray
    Write-Host "   and open the Mobile URL above)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.webp' = 'image/webp'
    '.json' = 'application/json'
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $urlPath = $request.Url.LocalPath
    if ($urlPath -eq '/') { $urlPath = '/index.html' }
    
    $filePath = Join-Path $root ($urlPath -replace '/', '\')
    
    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = 'application/octet-stream' }
        
        $response.ContentType = $contentType
        $response.StatusCode = 200
        
        # Cache static assets
        if ($ext -ne '.html') {
            $response.Headers.Add("Cache-Control", "public, max-age=3600")
        } else {
            $response.Headers.Add("Cache-Control", "no-cache")
        }
        
        $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $fileBytes.Length
        $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 200 $urlPath" -ForegroundColor Green
    } else {
        $response.StatusCode = 404
        $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentLength64 = $errorBytes.Length
        $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 404 $urlPath" -ForegroundColor Red
    }
    
    $response.Close()
}
