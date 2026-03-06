# Push all .env vars to Vercel for all environments
# Reads from .env file — secrets are never displayed
$envPath = Join-Path $PSScriptRoot ".env"
$envs = @("production", "preview", "development")
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 0) { return }
    $name = $line.Substring(0, $idx)
    $value = $line.Substring($idx + 1)
    Write-Host "`n>> Setting $name ..." -ForegroundColor Cyan
    foreach ($env in $envs) {
        # Remove existing if present (ignore errors)
        & vercel env rm $name $env -y 2>$null | Out-Null
        # Add new value
        $value | & vercel env add $name $env
    }
}
Write-Host "`nDone! All env vars pushed to Vercel." -ForegroundColor Green
