# CampusFix - build_deploy.ps1
# Assembles the production upload package into deploy_package/
# Run from: C:\Users\keshv\OneDrive\Desktop\web project
# Usage:  .\build_deploy.ps1

$root    = $PSScriptRoot
$staging = Join-Path $root "deploy_package"
$dist    = Join-Path $root "frontend\dist"
$backend = Join-Path $root "backend"

Write-Host "`n=== CampusFix Deploy Packager ===" -ForegroundColor Cyan

# --- 1. Clean and recreate staging dir ----------------------------------------
if (Test-Path $staging) {
    Remove-Item $staging -Recurse -Force
    Write-Host "Cleaned old deploy_package/" -ForegroundColor Yellow
}
New-Item -ItemType Directory -Path $staging | Out-Null

# --- 2. Copy React build to htdocs root ---------------------------------------
Write-Host "Copying frontend build..." -ForegroundColor White
Copy-Item "$dist\index.html"   "$staging\index.html"
Copy-Item "$dist\favicon.svg"  "$staging\favicon.svg"
Copy-Item "$dist\icons.svg"    "$staging\icons.svg"
Copy-Item "$dist\assets"       "$staging\assets" -Recurse

# --- 3. Copy .htaccess for SPA routing ----------------------------------------
Copy-Item "$root\htdocs.htaccess" "$staging\.htaccess"
Write-Host "Copied SPA .htaccess" -ForegroundColor White

# --- 4. Copy backend - exclude dev-only files ---------------------------------
Write-Host "Copying backend..." -ForegroundColor White
$backendDest = Join-Path $staging "backend"
New-Item -ItemType Directory -Path $backendDest | Out-Null

# Files/dirs to copy
$toCopy = @("api", "config", "middleware", "utils", "files", "vendor",
            ".htaccess", "composer.json")

foreach ($item in $toCopy) {
    $src = Join-Path $backend $item
    $dst = Join-Path $backendDest $item
    if (Test-Path $src) {
        Copy-Item $src $dst -Recurse -Force
        Write-Host "  + backend\$item" -ForegroundColor DarkGray
    } else {
        Write-Host "  ! backend\$item not found - skipping" -ForegroundColor Yellow
    }
}

# Copy production .env (prioritize .env.production if it exists, otherwise .env)
$prodEnv = Join-Path $backend ".env.production"
$regularEnv = Join-Path $backend ".env"
if (Test-Path $prodEnv) {
    Copy-Item $prodEnv (Join-Path $backendDest ".env") -Force
    Write-Host "  + backend\.env (from backend\.env.production)" -ForegroundColor DarkGray
} elseif (Test-Path $regularEnv) {
    Copy-Item $regularEnv (Join-Path $backendDest ".env") -Force
    Write-Host "  + backend\.env" -ForegroundColor DarkGray
} else {
    Write-Host "  ! backend\.env not found - skipping" -ForegroundColor Yellow
}

# --- 5. Ensure uploads dir exists (with .htaccess and .gitkeep removed) -------
$uploadsDir = Join-Path $backendDest "files\uploads"
if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir | Out-Null
}
# Remove .gitkeep from deploy (not needed on server)
$gk = Join-Path $uploadsDir ".gitkeep"
if (Test-Path $gk) { Remove-Item $gk }
Write-Host "  + backend\files\uploads\ (writable dir)" -ForegroundColor DarkGray

# --- 6. Safety checks ---------------------------------------------------------
Write-Host "`nRunning safety checks..." -ForegroundColor Cyan

$checks = @(
    @{ Path = "$staging\index.html";                      Label = "index.html" },
    @{ Path = "$staging\assets";                          Label = "assets/" },
    @{ Path = "$staging\.htaccess";                       Label = ".htaccess (SPA)" },
    @{ Path = "$staging\backend\.env";                    Label = "backend/.env" },
    @{ Path = "$staging\backend\.htaccess";               Label = "backend/.htaccess" },
    @{ Path = "$staging\backend\vendor\autoload.php";     Label = "vendor/autoload.php" },
    @{ Path = "$staging\backend\config\db.php";           Label = "backend/config/db.php" },
    @{ Path = "$staging\backend\api\health.php";          Label = "backend/api/health.php" },
    @{ Path = "$staging\backend\files\uploads\.htaccess"; Label = "uploads/.htaccess" }
)

$ok = $true
foreach ($c in $checks) {
    if (Test-Path $c.Path) {
        Write-Host "  [OK] $($c.Label)" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $($c.Label)" -ForegroundColor Red
        $ok = $false
    }
}

# Ensure .env has production values
$envContent = Get-Content "$staging\backend\.env" -Raw
if ($envContent -match "DB_HOST=localhost") {
    Write-Host "  [FAIL] backend/.env still has localhost - update it first!" -ForegroundColor Red
    $ok = $false
} else {
    Write-Host "  [OK] backend/.env has non-localhost DB_HOST" -ForegroundColor Green
}
if ($envContent -match "APP_ENV=production") {
    Write-Host "  [OK] APP_ENV=production" -ForegroundColor Green
} else {
    Write-Host "  [WARN] APP_ENV is not 'production'" -ForegroundColor Yellow
}

# Ensure node_modules / .git / src were NOT included
foreach ($bad in @("node_modules", ".git", "frontend")) {
    if (Test-Path (Join-Path $staging $bad)) {
        Write-Host "  [FAIL] $bad should not be in deploy_package!" -ForegroundColor Red
        $ok = $false
    }
}

# --- 7. Create zip -------------------------------------------------------------
$zipPath = Join-Path $root "campusfix_deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$staging\*" -DestinationPath $zipPath
Write-Host "`nZip created: campusfix_deploy.zip" -ForegroundColor Cyan

# --- 8. Summary ----------------------------------------------------------------
Write-Host "`n=== Package Contents ===" -ForegroundColor Cyan
Get-ChildItem $staging | ForEach-Object { Write-Host "  $($_.Name)" }
Write-Host "`n  backend/" -ForegroundColor DarkGray
Get-ChildItem "$staging\backend" | ForEach-Object { Write-Host "    $($_.Name)" }

if ($ok) {
    Write-Host "`nPackage is ready. Upload deploy_package/ contents to htdocs/ via FTP." -ForegroundColor Green
} else {
    Write-Host "`nFix the issues above before uploading." -ForegroundColor Red
}
