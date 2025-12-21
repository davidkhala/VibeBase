# VibeBase - Windows x64 Release Build Script

$ErrorActionPreference = "Stop"

Write-Host "🚀 Building Windows x64 version..." -ForegroundColor Green

# Check if running in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from project root directory" -ForegroundColor Red
    exit 1
}

# Check dependencies
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npm not found, please install Node.js first" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: cargo not found, please install Rust first" -ForegroundColor Red
    exit 1
}

# Set target architecture
$env:TAURI_TARGET = "x86_64-pc-windows-msvc"

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build

Write-Host "🔧 Building Tauri app (x64)..." -ForegroundColor Yellow
Set-Location src-tauri
cargo build --release --target x86_64-pc-windows-msvc
Set-Location ..

Write-Host "📦 Packaging application..." -ForegroundColor Yellow
npm run tauri build -- --target x86_64-pc-windows-msvc

Write-Host "✅ Build completed!" -ForegroundColor Green
Write-Host "📂 Output location: src-tauri\target\x86_64-pc-windows-msvc\release\bundle\" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
Get-ChildItem "src-tauri\target\x86_64-pc-windows-msvc\release\bundle\" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime

