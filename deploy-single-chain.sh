#!/bin/bash

# Deploy Defifa Subgraph for a Single Chain
# Usage: ./deploy-single-chain.sh <chain_name> <version_label>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check arguments
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <chain_name> <version_label>"
    print_error "Example: $0 arbitrum_sepolia v0.3.0"
    print_error ""
    print_error "Supported chains:"
    print_error "  - sepolia"
    print_error "  - arbitrum_sepolia"
    print_error "  - base_sepolia"
    print_error "  - optimism_sepolia"
    exit 1
fi

CHAIN=$1
VERSION_LABEL=$2

print_status "Deploying subgraph for $CHAIN with version $VERSION_LABEL..."

# Check if ABIs exist (assume they are manually placed)
if [ ! -f "abis/DefifaDeployer.json" ] || [ ! -f "abis/DefifaNFT.json" ] || [ ! -f "abis/DefifaGovernor.json" ]; then
    print_error "Required ABIs not found in abis/ directory. Please ensure the following files exist:"
    print_error "  - abis/DefifaDeployer.json"
    print_error "  - abis/DefifaNFT.json (DefifaDelegate ABI)"
    print_error "  - abis/DefifaGovernor.json"
    exit 1
fi

# Determine which subgraph config to use
# Convert underscores to hyphens for filename matching
CHAIN_FILENAME=$(echo "$CHAIN" | sed 's/_/-/g')
SUBGRAPH_CONFIG="subgraph-$CHAIN_FILENAME.yaml"
if [ ! -f "$SUBGRAPH_CONFIG" ]; then
    print_error "Subgraph configuration not found: $SUBGRAPH_CONFIG"
    print_error "Available configs:"
    ls -1 subgraph-*.yaml 2>/dev/null || print_error "  No subgraph configs found"
    exit 1
fi

print_status "Using subgraph configuration: $SUBGRAPH_CONFIG"

# Generate types
print_status "Generating types for $CHAIN..."
graph codegen "$SUBGRAPH_CONFIG"

# Build subgraph
print_status "Building subgraph for $CHAIN..."
graph build "$SUBGRAPH_CONFIG"

# Deploy subgraph using the chain-specific config
print_status "Deploying subgraph for $CHAIN..."

# Convert underscores to hyphens for Graph Studio naming convention
SUBGRAPH_NAME=$(echo "defifa-$CHAIN" | sed 's/_/-/g')
graph deploy --node https://api.studio.thegraph.com/deploy/ "$SUBGRAPH_NAME" --version-label "$VERSION_LABEL" "$SUBGRAPH_CONFIG"

print_success "Successfully deployed subgraph for $CHAIN!"
print_status "Subgraph endpoint: https://api.studio.thegraph.com/query/107226/$SUBGRAPH_NAME/$VERSION_LABEL"
