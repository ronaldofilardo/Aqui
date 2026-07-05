param(
    [string]$VercelToken = $env:VERCEL_TOKEN,
    [string]$ProjectId = $env:VERCEL_PROJECT_ID
)

if (-not $VercelToken -or -not $ProjectId) {
    Write-Host "[ERROR] VERCEL_TOKEN e VERCEL_PROJECT_ID sao obrigatorios" -ForegroundColor Red
    Write-Host "Defina as variaveis:"
    Write-Host '  $env:VERCEL_TOKEN = "seu_token"'
    Write-Host '  $env:VERCEL_PROJECT_ID = "seu_project_id"'
    exit 1
}

$VercelApi = "https://api.vercel.com"

$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
$NextAuthSecret = [Convert]::ToBase64String($bytes)

$headers = @{
    "Authorization" = "Bearer $VercelToken"
    "Content-Type" = "application/json"
}

$envVars = @(
    # DATABASE_URL MUST be configured manually in Vercel UI Dashboard
    # NEVER hardcode database connection strings in scripts or documentation
    # To configure: https://vercel.com/dashboard → Project Settings → Environment Variables
    @{ key = "NEXTAUTH_SECRET"; value = $NextAuthSecret },
    @{ key = "NEXTAUTH_URL"; value = "https://seu-dominio.vercel.app" },
    @{ key = "AUTH_SECRET"; value = $NextAuthSecret }
)

Write-Host "[SETUP] Configurando variaveis de ambiente no Vercel..."
Write-Host "Project ID: $ProjectId"
Write-Host ""

foreach ($env in $envVars) {
    Write-Host "[INFO] Configurando: $($env.key)"
    
    $body = @{
        key = $env.key
        value = $env.value
        target = @("production")
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$VercelApi/v10/projects/$ProjectId/env" -Method POST -Headers $headers -Body $body
        Write-Host "[OK] $($env.key)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value
        if ($statusCode -eq 201 -or $statusCode -eq 200) {
            Write-Host "[OK] $($env.key)"
        } else {
            Write-Host "[ERROR] Status $statusCode"
        }
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "[SUCCESS] Configuracao concluida!"
Write-Host ""
Write-Host "NEXTAUTH_SECRET: $NextAuthSecret"
