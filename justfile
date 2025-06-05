# List all available commands
default:
    @just --list

# Setup development environment and build extension
setup:
    pnpm install
    pnpm run build
    @echo "Build complete. Load the 'dist' directory in Chrome as an unpacked extension."

# Clean up build artifacts
teardown:
    rm -rf dist node_modules

# Development build with watch mode
dev:
    pnpm run dev

# Build for production
build:
    npx tsc --noEmit --project tsconfig.json
    pnpm run build
