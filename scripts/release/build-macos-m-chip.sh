#!/bin/bash

# VibeBase - macOS Apple Silicon (M Chip) Release Build Script

set -e

echo "🚀 Building macOS Apple Silicon (M Chip) version..."

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from project root directory"
    exit 1
fi

# Check dependencies
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm not found, please install Node.js first"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "❌ Error: cargo not found, please install Rust first"
    exit 1
fi

# Set target architecture
export TAURI_TARGET="aarch64-apple-darwin"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "🔧 Building Tauri app (Apple Silicon)..."
cd src-tauri
cargo build --release --target aarch64-apple-darwin
cd ..

echo "📦 Packaging application..."
npm run tauri build -- --target aarch64-apple-darwin

echo "✅ Build completed!"
echo "📂 Output location: src-tauri/target/aarch64-apple-darwin/release/bundle/"
echo ""
echo "Generated files:"
ls -lh src-tauri/target/aarch64-apple-darwin/release/bundle/ 2>/dev/null || echo "Bundle files not found"

