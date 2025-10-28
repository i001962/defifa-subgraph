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
    
    # Check if ABIs exist (assume they are manually placed)
    if [ ! -f "abis/DefifaDeployer.json" ] || [ ! -f "abis/DefifaNFT.json" ] || [ ! -f "abis/DefifaGovernor.json" ]; then
        print_error "Required ABIs not found in abis/ directory. Please ensure the following files exist:"
        print_error "  - abis/DefifaDeployer.json"
        print_error "  - abis/DefifaNFT.json (DefifaDelegate ABI)"
        print_error "  - abis/DefifaGovernor.json"
        return 1
    fi
    
    # Determine which subgraph config to use
    # Convert underscores to hyphens for filename matching
    local chain_filename=$(echo "$chain" | sed 's/_/-/g')
    local subgraph_config="subgraph-$chain_filename.yaml"
    if [ ! -f "$subgraph_config" ]; then
        print_error "Subgraph configuration not found: $subgraph_config"
        return 1
    fi
    
    print_status "Using subgraph configuration: $subgraph_config"
    
    # Generate types
    print_status "Generating types for $chain..."
    graph codegen "$subgraph_config"
    
    # Build subgraph
    print_status "Building subgraph for $chain..."
    graph build "$subgraph_config"
    
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
    if [ ! -d "abis" ] || [ ! -f "schema.graphql" ]; then
        print_error "Not in the defifa-subgraph directory. Please run this script from the defifa-subgraph directory."
        exit 1
    fi
    
    # Check if ABIs exist (assume they are manually placed)
    if [ ! -f "abis/DefifaDeployer.json" ] || [ ! -f "abis/DefifaNFT.json" ] || [ ! -f "abis/DefifaGovernor.json" ]; then
        print_error "Required ABIs not found in abis/ directory. Please ensure the following files exist:"
        print_error "  - abis/DefifaDeployer.json"
        print_error "  - abis/DefifaNFT.json (DefifaDelegate ABI)"
        print_error "  - abis/DefifaGovernor.json"
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
