#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Pre-deploy check: ensures every HTML file has a favicon and a favicon.ico exists in public/.
.DESCRIPTION
  Run this before deploying any Grudge project to catch missing favicons.
  Usage:  .\scripts\check-favicons.ps1 [-Path <project-root>]
  Exit code 0 = all good, 1 = problems found.
#>
param(
    [string]$Path = (Get-Location).Path
)

$errors = @()
$warnings = @()

Write-Host "`n=== Favicon Pre-Deploy Check ===" -ForegroundColor Cyan
Write-Host "Scanning: $Path`n"

# --- 1. Check for favicon.ico in common static dirs ---
$staticDirs = @("public", "static", "dist", ".")
$faviconFound = $false
foreach ($dir in $staticDirs) {
    $check = Join-Path $Path $dir "favicon.ico"
    if (Test-Path $check) {
        $size = (Get-Item $check).Length
        if ($size -lt 100) {
            $warnings += "  [WARN] $check exists but is only $size bytes (possibly corrupt)"
        } else {
            Write-Host "  [OK] favicon.ico found: $check ($size bytes)" -ForegroundColor Green
        }
        $faviconFound = $true
        break
    }
}
if (-not $faviconFound) {
    $errors += "  [FAIL] No favicon.ico found in public/, static/, dist/, or project root"
}

# --- 2. Check all HTML files for <link rel="icon"> ---
$htmlFiles = Get-ChildItem -Path $Path -Filter "*.html" -Recurse -File |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|dist[\\/]|build[\\/]|\.claude[\\/]|attached_assets[\\/]|\.git[\\/]" }

$total = $htmlFiles.Count
$missing = @()
$hasIco = @()
$hasPng = @()

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    # Check if it has a <head> section (skip partials/fragments)
    if ($content -notmatch "<head[\s>]") { continue }

    $relPath = $file.FullName.Replace($Path, "").TrimStart("\", "/")

    $hasAnyFavicon = $content -match 'rel="icon"' -or $content -match "rel='icon'" -or $content -match 'rel="shortcut icon"'

    if (-not $hasAnyFavicon) {
        $missing += $relPath
    } else {
        if ($content -match 'favicon\.ico') { $hasIco += $relPath }
        if ($content -match 'type="image/png".*rel="icon"' -or $content -match 'rel="icon".*type="image/png"') {
            $hasPng += $relPath
        }
    }
}

Write-Host "`n  HTML files scanned: $total"

if ($missing.Count -gt 0) {
    $errors += "  [FAIL] These HTML files have NO favicon link:"
    foreach ($m in $missing) {
        $errors += "         - $m"
    }
}

if ($hasIco.Count -gt 0) {
    Write-Host "  [OK] $($hasIco.Count) file(s) reference favicon.ico" -ForegroundColor Green
}

# --- 3. Check vercel.json rewrite exclusions (if Vercel project) ---
$vercelJson = Join-Path $Path "vercel.json"
if (Test-Path $vercelJson) {
    $vContent = Get-Content $vercelJson -Raw
    if ($vContent -match "favicon") {
        Write-Host "  [OK] vercel.json rewrite excludes 'favicon'" -ForegroundColor Green
    } else {
        if ($vContent -match '"rewrites"') {
            $warnings += "  [WARN] vercel.json has rewrites but does NOT exclude 'favicon' — /favicon.ico may 404"
        }
    }
}

# --- Report ---
Write-Host ""
if ($warnings.Count -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
}

if ($errors.Count -gt 0) {
    Write-Host "Errors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    Write-Host "`n FAVICON CHECK FAILED — fix the above before deploying.`n" -ForegroundColor Red
    exit 1
} else {
    Write-Host " ALL FAVICON CHECKS PASSED`n" -ForegroundColor Green
    exit 0
}
