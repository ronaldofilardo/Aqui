param(
    [string]$VercelToken = $env:VERCEL_TOKEN,
    [string]$ProjectId = $env:VERCEL_PROJECT_ID
)

if (-not $VercelToken -or -not $ProjectId) {
    Write-Host "ERROR: VERCEL_TOKEN e VERCEL_PROJECT_ID sao obrigatorios" -ForegroundColor Red
    exit 1
}

$VercelApi = "https://api.vercel.com"

# Gerar NEXTAUTH_SECRET aleatório
function Generate-Secret {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

$NextAuthSecret = Generate-Secret

# Headers para autenticação
$headers = @{
    "Authorization" = "Bearer $VercelToken"
    "Content-Type" = "application/json"
}

# Variáveis a configurar
$envVars = @(
    # DATABASE_URL MUST be configured manually in Vercel Dashboard UI
    # NEVER hardcode database connection strings
    @{
        key = "NEXTAUTH_SECRET"
        value = $NextAuthSecret
    },
    @{
        key = "NEXTAUTH_URL"
        value = "https://seu-dominio.vercel.app"
    },
    @{
        key = "AUTH_SECRET"
        value = $NextAuthSecret
    },
    @{
        key = "ASAAS_SANDBOX"
        value = "false"
    }
)

Write-Host "🔐 Configurando variáveis de ambiente no Vercel..." -ForegroundColor Cyan
Write-Host "Project ID: $ProjectId`n"

foreach ($env in $envVars) {
    $body = @{
        key = $env.key
        value = $env.value
        target = @("production")
    } | ConvertTo-Json -Compress

    Write-Host "📝 Configurando: $($env.key)..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest `
            -Uri "$VercelApi/v10/projects/$ProjectId/env" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
            Write-Host "✅ $($env.key) configurado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Status: $($response.StatusCode) - $($response.Content)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green
Write-Host "`n📝 NEXTAUTH_SECRET gerado (salve em local seguro):"
Write-Host $NextAuthSecret -ForegroundColor Cyan
