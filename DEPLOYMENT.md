# Defifa Subgraph Deployment Guide

This guide explains how to deploy Defifa subgraphs for all supported chains.

## Overview

The Defifa subgraph tracks game deployments, NFT contracts, and governance events across multiple EVM chains. Each chain has its own subgraph deployment with chain-specific contract addresses and deployment blocks.

## Supported Chains

- **Sepolia** (`sepolia`) - Ethereum testnet
- **Arbitrum Sepolia** (`arbitrum_sepolia`) - Arbitrum testnet  
- **Base Sepolia** (`base_sepolia`) - Base testnet
- **Optimism Sepolia** (`optimism_sepolia`) - Optimism testnet

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Graph CLI** installed globally:
   ```bash
   npm install -g @graphprotocol/graph-cli
   ```
3. **The Graph Studio Access** - You need access to deploy subgraphs
4. **Deployment Artifacts** - Contract deployment artifacts from `defifa-collection-deployer-v5`

## Quick Start

### Deploy All Chains

Use the automated deployment script to deploy subgraphs for all chains:

```bash
# From the defifa-subgraph directory
./deploy-all-chains.sh v0.3.0
```

This will:
1. Extract contract addresses and deployment blocks from each chain's artifacts
2. Update the subgraph configuration for each chain
3. Generate types and build the subgraph
4. Deploy to The Graph Studio
5. Provide the subgraph endpoints

### Deploy Individual Chain

To deploy a subgraph for a specific chain:

```bash
# Example: Deploy Arbitrum Sepolia
./deploy-single-chain.sh arbitrum_sepolia v0.3.0
```

## Manual Deployment Steps

If you prefer to deploy manually or need to troubleshoot:

### 1. Prepare Contract Data

Extract contract addresses and deployment blocks from the deployer artifacts:

```bash
# Example for Arbitrum Sepolia
cd ../defifa-collection-deployer-v5
jq -r '.address' deployments/defifa-v5/arbitrum_sepolia/DefifaDeployer.json
jq -r '.receipt.blockNumber' deployments/defifa-v5/arbitrum_sepolia/DefifaDeployer.json
```

### 2. Update Subgraph Configuration

Edit `subgraph.yaml`:

```yaml
dataSources:
  - kind: ethereum
    name: DefifaDeployer
    network: arbitrum_sepolia  # Change network
    source:
      abi: DefifaDeployer
      address: "0x..."  # Update with actual address
      startBlock: 12345678  # Update with actual block
```

### 3. Update ABIs

Copy the latest contract ABIs:

```bash
cp ../defifa-collection-deployer-v5/deployments/defifa-v5/arbitrum_sepolia/DefifaDeployer.json abis/DefifaDeployer.json
cp ../defifa-collection-deployer-v5/deployments/defifa-v5/arbitrum_sepolia/DefifaDelegate.json abis/DefifaNFT.json
cp ../defifa-collection-deployer-v5/deployments/defifa-v5/arbitrum_sepolia/DefifaGovernor.json abis/DefifaGovernor.json
```

### 4. Generate and Build

```bash
npm run codegen
npm run build
```

### 5. Deploy

```bash
graph deploy --node https://api.studio.thegraph.com/deploy/ defifa-arbitrum_sepolia --version-label v0.3.0
```

## Subgraph Endpoints

After deployment, your subgraphs will be available at:

- **Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-sepolia/v0.3.0`
- **Arbitrum Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-arbitrum_sepolia/v0.3.0`
- **Base Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-base_sepolia/v0.3.0`
- **Optimism Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-optimism_sepolia/v0.3.0`

## Updating Interface Configuration

After deploying subgraphs, update the interface configuration files:

### 1. Update Chain Config Files

For each chain, update the `subgraph` field in the config files:

```typescript
// src/config/arbitrum_sepolia.ts
export const DEFIFA_CONFIG_ARBITRUM_SEPOLIA: DefifaConfig = {
  // ... other config
  subgraph: "https://api.studio.thegraph.com/query/107226/defifa-arbitrum_sepolia/v0.3.0",
};
```

### 2. Update Contract Addresses

Ensure contract addresses match the deployed contracts:

```typescript
// Extract from deployment artifacts
DefifaDelegate: {
  address: "0x..." as EthereumAddress,
  interface: DefifaDelegate.abi,
},
DefifaGovernor: {
  address: "0x..." as EthereumAddress,
  interface: DefifaGovernor.abi,
},
// ... etc
```

## Troubleshooting

### Common Issues

1. **"Contract not found" errors**
   - Verify contract addresses are correct
   - Check that start blocks are accurate
   - Ensure ABIs match the deployed contracts

2. **"Network not supported" errors**
   - Verify the network name matches The Graph's supported networks
   - Check that the network is properly configured in `subgraph.yaml`

3. **"Deployment failed" errors**
   - Check The Graph Studio for detailed error messages
   - Verify you have proper permissions to deploy
   - Ensure the subgraph name is unique

### Verification

After deployment, verify the subgraph is working:

```bash
# Test query
curl -X POST "https://api.studio.thegraph.com/query/107226/defifa-arbitrum_sepolia/v0.3.0" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { contracts(first: 5) { id address gameId name } }"
  }'
```

## Version Management

- Use semantic versioning (e.g., `v0.3.0`, `v0.3.1`)
- Increment patch version for bug fixes
- Increment minor version for new features
- Increment major version for breaking changes

## Monitoring

Monitor your subgraphs in The Graph Studio:
- Check sync status
- Monitor query performance
- Review error logs
- Track indexing progress

## Contributing

When adding new chains or updating existing ones:

1. Update the deployment script
2. Add the new chain to the supported chains list
3. Update this README
4. Test the deployment process
5. Update interface configuration files
