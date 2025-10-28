# Defifa Subgraph

A subgraph for indexing Defifa game data across multiple blockchain networks.

## Overview

This subgraph indexes Defifa game events including:
- Game launches and configurations
- NFT minting and transfers
- Scorecard submissions and attestations
- Token metadata and ownership

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- The Graph CLI (`npm install -g @graphprotocol/graph-cli`)
- Access to The Graph Studio

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Place ABIs manually:**
   ASSUMPTION: the contracts are deterministically deployed. Ensure the following ABI files are placed in the `abis/` directory:
   - `abis/DefifaDeployer.json` - DefifaDeployer contract ABI
   - `abis/DefifaNFT.json` - DefifaDelegate contract ABI (renamed for clarity)
   - `abis/DefifaGovernor.json` - DefifaGovernor contract ABI

   **Note:** These ABIs are the same across all chains since the contracts are deterministically deployed.

3. **Configure subgraph endpoints:**
   Each network has its own configuration file:
   - `subgraph-sepolia.yaml` - Ethereum Sepolia
   - `subgraph-arbitrum-sepolia.yaml` - Arbitrum Sepolia  
   - `subgraph-base-sepolia.yaml` - Base Sepolia

## Deployment

### Single Chain Deployment

Deploy a subgraph for a specific chain:

```bash
./deploy-single-chain.sh <chain_name> <version_label>
```

**Examples:**
```bash
# Deploy to Sepolia
./deploy-single-chain.sh sepolia v1.0.0

# Deploy to Arbitrum Sepolia
./deploy-single-chain.sh arbitrum_sepolia v1.0.0

# Deploy to Base Sepolia
./deploy-single-chain.sh base_sepolia v1.0.0
```

**Supported chains:**
- `sepolia`
- `arbitrum_sepolia`
- `base_sepolia`
- `optimism_sepolia` (when subgraph config is available)

### All Chains Deployment

Deploy subgraphs for all supported chains:

```bash
./deploy-all-chains.sh [version_label]
```

**Example:**
```bash
# Deploy all chains with version v1.0.0
./deploy-all-chains.sh v1.0.0

# Deploy all chains (will prompt for version)
./deploy-all-chains.sh
```

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Generate types:**
   ```bash
   npm run codegen
   ```

2. **Build subgraph:**
   ```bash
   npm run build
   ```

3. **Deploy to specific chain:**
   ```bash
   # For Sepolia
   graph deploy --node https://api.studio.thegraph.com/deploy/ defifa-sepolia --version-label v1.0.0 subgraph-sepolia.yaml

   # For Arbitrum Sepolia
   graph deploy --node https://api.studio.thegraph.com/deploy/ defifa-arbitrum-sepolia --version-label v1.0.0 subgraph-arbitrum-sepolia.yaml

   # For Base Sepolia
   graph deploy --node https://api.studio.thegraph.com/deploy/ defifa-base-sepolia --version-label v1.0.0 subgraph-base-sepolia.yaml
   ```

## Subgraph Endpoints

After deployment, your subgraphs will be available at:

- **Sepolia:** `https://api.studio.thegraph.com/query/107226/defifa-sepolia/version/latest`
- **Arbitrum Sepolia:** `https://api.studio.thegraph.com/query/107226/defifa-arbitrum-sepolia/version/latest`
- **Base Sepolia:** `https://api.studio.thegraph.com/query/107226/defifa-base-sepolia/version/latest`

## Configuration Files

Each network has its own `subgraph-*.yaml` file containing:
- Network name
- Contract address
- Start block
- Data source configuration

## Development

### Local Development

1. **Start local Graph Node:**
   ```bash
   docker-compose up
   ```

2. **Create local subgraph:**
   ```bash
   graph create --node http://localhost:8020/ defifa-local
   ```

3. **Deploy locally:**
   ```bash
   graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 defifa-local subgraph-sepolia.yaml
   ```

### Schema

The subgraph schema defines the following entities:
- `Contract` - Game contract instances
- `Token` - Individual NFTs
- `TokenMetadata` - NFT metadata
- `Owner` - Token holders
- `Transfer` - Token transfer events

## Troubleshooting

### Common Issues

1. **ABI files missing:**
   - Ensure all required ABI files are in the `abis/` directory
   - Check file names match exactly: `DefifaDeployer.json`, `DefifaNFT.json`, `DefifaGovernor.json`

2. **Subgraph config not found:**
   - Verify the chain name matches the config file naming convention
   - Check that `subgraph-<chain>.yaml` exists for your target chain

3. **Deployment fails:**
   - Check that you have access to The Graph Studio
   - Verify the subgraph name doesn't conflict with existing deployments
   - Ensure the start block is correct for the target network

### Version Management

- Use semantic versioning for version labels (e.g., `v1.0.0`, `v1.0.1`)
- The `/version/latest` endpoint always points to the most recent deployment
- Previous versions remain accessible via their specific version labels

## Contributing

1. Make changes to the schema or mappings
2. Test locally using the development setup
3. Deploy to a test network first
4. Create a pull request with your changes

## License

[Add your license information here]