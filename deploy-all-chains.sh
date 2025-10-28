#!/bin/bash

# Deploy Defifa Subgraphs for All Chains
# This script deploys subgraphs for all supported chains

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

# Function to deploy subgraph for a specific chain
deploy_chain() {
    local chain=$1
    local version_label=$2
    
    print_status "Deploying subgraph for $chain..."
    
    # Check if deployment artifacts exist
    local deployer_path="../defifa-collection-deployer-v5/deployments/defifa-v5/$chain/DefifaDeployer.json"
    if [ ! -f "$deployer_path" ]; then
        print_error "Deployment artifacts not found for $chain at $deployer_path"
        return 1
    fi
    
    # Extract contract address and deployment block
    local deployer_address=$(jq -r '.address' "$deployer_path")
    local deployment_block=$(jq -r '.receipt.blockNumber' "$deployer_path" | sed 's/0x//' | xargs -I {} printf "%d\n" 0x{})
    
    print_status "Using DefifaDeployer address: $deployer_address"
    print_status "Using start block: $deployment_block"
    
    # Determine which subgraph config to use
    local subgraph_config="subgraph-$chain.yaml"
    if [ ! -f "$subgraph_config" ]; then
        print_error "Subgraph configuration not found: $subgraph_config"
        return 1
    fi
    
    print_status "Using subgraph configuration: $subgraph_config"
    
    # Copy updated ABIs
    cp "../defifa-collection-deployer-v5/deployments/defifa-v5/$chain/DefifaDeployer.json" abis/DefifaDeployer.json
    cp "../defifa-collection-deployer-v5/deployments/defifa-v5/$chain/DefifaDelegate.json" abis/DefifaNFT.json
    cp "../defifa-collection-deployer-v5/deployments/defifa-v5/$chain/DefifaGovernor.json" abis/DefifaGovernor.json
    
    # Generate types
    print_status "Generating types for $chain..."
    npm run codegen
    
    # Build subgraph
    print_status "Building subgraph for $chain..."
    npm run build
    
    # Deploy subgraph using the chain-specific config
    print_status "Deploying subgraph for $chain with version $version_label..."
    graph deploy --node https://api.studio.thegraph.com/deploy/ "defifa-$chain" --version-label "$version_label" "$subgraph_config"
    
    print_success "Successfully deployed subgraph for $chain!"
    echo ""
}

# Main deployment function
main() {
    print_status "Starting Defifa Subgraph Deployment for All Chains"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "subgraph.yaml" ]; then
        print_error "subgraph.yaml not found. Please run this script from the defifa-subgraph directory."
        exit 1
    fi
    
    # Check if deployment artifacts exist
    if [ ! -d "../defifa-collection-deployer-v5/deployments" ]; then
        print_error "Deployment artifacts not found. Please ensure defifa-collection-deployer-v5 is in the parent directory."
        exit 1
    fi
    
    # Get version label from user or use default
    if [ -z "$1" ]; then
        read -p "Enter version label (e.g., v0.3.0): " VERSION_LABEL
    else
        VERSION_LABEL=$1
    fi
    
    if [ -z "$VERSION_LABEL" ]; then
        VERSION_LABEL="v0.3.0"
        print_warning "No version label provided, using default: $VERSION_LABEL"
    fi
    
    print_status "Using version label: $VERSION_LABEL"
    echo ""
    
    # Define chains to deploy
    CHAINS=("sepolia" "arbitrum_sepolia" "base_sepolia")
    
    # Deploy each chain
    for chain in "${CHAINS[@]}"; do
        deploy_chain "$chain" "$VERSION_LABEL"
    done
    
    print_success "All subgraphs deployed successfully!"
    echo ""
    print_status "Subgraph endpoints:"
    for chain in "${CHAINS[@]}"; do
        echo "  - $chain: https://api.studio.thegraph.com/query/107226/defifa-$chain/$VERSION_LABEL"
    done
}

# Run main function
main "$@"
