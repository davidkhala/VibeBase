# VibeBase - Windows x86 (32-bit) Release Build Script

$ErrorActionPreference = "Stop"

Write-Host "🚀 Building Windows x86 (32-bit) version..." -ForegroundColor Green

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
$env:TAURI_TARGET = "i686-pc-windows-msvc"

Write-Host "⚠️  Note: Rust i686 target must be installed first" -ForegroundColor Yellow
Write-Host "Run: rustup target add i686-pc-windows-msvc" -ForegroundColor Yellow
Write-Host ""

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build

Write-Host "🔧 Building Tauri app (x86)..." -ForegroundColor Yellow
Set-Location src-tauri
cargo build --release --target i686-pc-windows-msvc
Set-Location ..

Write-Host "📦 Packaging application..." -ForegroundColor Yellow
npm run tauri build -- --target i686-pc-windows-msvc

Write-Host "✅ Build completed!" -ForegroundColor Green
Write-Host "📂 Output location: src-tauri\target\i686-pc-windows-msvc\release\bundle\" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
Get-ChildItem "src-tauri\target\i686-pc-windows-msvc\release\bundle\" -ErrorAction SilentlyContinue | Format-Table Name, Length, LastWriteTime

