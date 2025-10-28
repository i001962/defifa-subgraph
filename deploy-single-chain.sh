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

# Check if deployment artifacts exist
DEPLOYER_PATH="../defifa-collection-deployer-v5/deployments/defifa-v5/$CHAIN/DefifaDeployer.json"
if [ ! -f "$DEPLOYER_PATH" ]; then
    print_error "Deployment artifacts not found for $CHAIN at $DEPLOYER_PATH"
    exit 1
fi

# Extract contract address and deployment block
DEPLOYER_ADDRESS=$(jq -r '.address' "$DEPLOYER_PATH")
DEPLOYMENT_BLOCK=$(jq -r '.receipt.blockNumber' "$DEPLOYER_PATH" | sed 's/0x//' | xargs -I {} printf "%d\n" 0x{})

# Use a safer start block for Arbitrum Sepolia if the deployment block is too high
if [ "$CHAIN" = "arbitrum_sepolia" ] && [ "$DEPLOYMENT_BLOCK" -gt 100000000 ]; then
    DEPLOYMENT_BLOCK=1000000
    print_warning "Using safer start block $DEPLOYMENT_BLOCK for Arbitrum Sepolia"
fi

print_status "Using DefifaDeployer address: $DEPLOYER_ADDRESS"
print_status "Using start block: $DEPLOYMENT_BLOCK"

# Backup original subgraph.yaml
cp subgraph.yaml subgraph.yaml.backup

# Update the subgraph.yaml file
sed -i.tmp "s/network: sepolia/network: $CHAIN/" subgraph.yaml
sed -i.tmp "s/address: \".*\"/address: \"$DEPLOYER_ADDRESS\"/" subgraph.yaml
sed -i.tmp "s/startBlock: [0-9]*/startBlock: $DEPLOYMENT_BLOCK/" subgraph.yaml

# Copy updated ABIs
print_status "Copying ABIs for $CHAIN..."
cp "../defifa-collection-deployer-v5/deployments/defifa-v5/$CHAIN/DefifaDeployer.json" abis/DefifaDeployer.json
cp "../defifa-collection-deployer-v5/deployments/defifa-v5/$CHAIN/DefifaDelegate.json" abis/DefifaNFT.json
cp "../defifa-collection-deployer-v5/deployments/defifa-v5/$CHAIN/DefifaGovernor.json" abis/DefifaGovernor.json

# Generate types
print_status "Generating types for $CHAIN..."
npm run codegen

# Build subgraph
print_status "Building subgraph for $CHAIN..."
npm run build

# Deploy subgraph
print_status "Deploying subgraph for $CHAIN..."

# Skip create step - subgraph already exists in Graph Studio
# Convert underscores to hyphens for Graph Studio naming convention
SUBGRAPH_NAME=$(echo "defifa-$CHAIN" | sed 's/_/-/g')
graph deploy --node https://api.studio.thegraph.com/deploy/ "$SUBGRAPH_NAME" --version-label "$VERSION_LABEL"

# Restore original subgraph.yaml
mv subgraph.yaml.backup subgraph.yaml
rm -f subgraph.yaml.tmp

print_success "Successfully deployed subgraph for $CHAIN!"
print_status "Subgraph endpoint: https://api.studio.thegraph.com/query/107226/$SUBGRAPH_NAME/$VERSION_LABEL"
