<#
.SYNOPSIS
    Deploy Page Pulse to Cloudflare Pages
.DESCRIPTION
    Non-interactive deployment script with deployment immunity guards
#>

param(
    [string]$ProjectName = "page-pulse-app",
    [string]$Branch = "main"
)

Write-Host "=== Page Pulse Deployment Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean build artifacts
Write-Host "Step 1: Cleaning build artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Path "wrangler.jsonc" -ErrorAction SilentlyContinue
Remove-Item -Path "wrangler.json" -ErrorAction SilentlyContinue
Write-Host "Clean complete." -ForegroundColor Green
Write-Host ""

# Step 2: Verify wrangler.toml exists
Write-Host "Step 2: Verifying configuration..." -ForegroundColor Yellow
if (-not (Test-Path "wrangler.toml")) {
    Write-Error "wrangler.toml not found! Deployment requires TOML configuration."
    exit 1
}

# Check for forbidden JSON configs
$jsonConfigs = Get-ChildItem -Path "wrangler.*" -Include "*.json", "*.jsonc" -ErrorAction SilentlyContinue
if ($jsonConfigs) {
    Write-Error "Found JSON config files: $($jsonConfigs.Name). Use only wrangler.toml."
    exit 1
}
Write-Host "Configuration verified." -ForegroundColor Green
Write-Host ""

# Step 3: Run build
Write-Host "Step 3: Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}
Write-Host "Build successful." -ForegroundColor Green
Write-Host ""

# Step 4: Run tests
Write-Host "Step 4: Running tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed!"
    exit 1
}
Write-Host "Tests passed." -ForegroundColor Green
Write-Host ""

# Step 5: Deploy
Write-Host "Step 5: Deploying to Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy dist --project-name="$ProjectName" --branch="$Branch" --commit-dirty=true
if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
