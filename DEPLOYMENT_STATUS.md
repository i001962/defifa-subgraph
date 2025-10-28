# Multi-Chain Subgraph Deployment Status

## ✅ Completed Setup

### 1. Deployment Scripts Created
- `deploy-all-chains.sh` - Deploy subgraphs for all chains
- `deploy-single-chain.sh` - Deploy subgraph for a single chain
- Updated `package.json` with new npm scripts

### 2. Interface Configuration Updated
All chain config files have been updated with:
- ✅ Correct contract addresses from `refactor/nana-v5` deployments
- ✅ Updated subgraph URLs pointing to `v0.3.1` versions
- ✅ Proper ABI imports from deployment artifacts

**Updated Files:**
- `src/config/sepolia.ts` ✅ (already deployed)
- `src/config/arbitrum_sepolia.ts` ✅
- `src/config/base_sepolia.ts` ✅  
- `src/config/optimism_sepolia.ts` ✅

### 3. Contract Addresses Verified
All chains use the same contract addresses (factory deployment):
- **DefifaDelegate**: `0x9f8e41fdb2447fcebfffdc97387ac72b523e9fc3`
- **DefifaGovernor**: `0xf6ae3f8bb41b55ae23412c64fdb135c0f6cb86ae`
- **DefifaDeployer**: `0xaa1c5d7bee4cc88523286774dffeab26687ec0ff`
- **DefifaTokenUriResolver**: `0x57c110647675bb935f8e0b417fe7f64475718e94`

## 🚀 Deployment Progress

### Deployed Subgraphs
- **Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-sepolia/v0.2.0` ✅ (already deployed)
- **Arbitrum Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-arbitrum-sepolia/v0.3.1` ✅ (Deployed successfully!)
- **Base Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-base-sepolia/v0.3.1` ✅ (Deployed successfully!)

### Pending Deployments (due to subgraph limit)
- **Optimism Sepolia**: `https://api.studio.thegraph.com/query/107226/defifa-optimism-sepolia/v0.3.1` ❌ (Still hitting subgraph limit)

## 🚧 Next Steps Required

### 1. Free Up Subgraph Slots
To deploy Optimism Sepolia, you need to free up one more subgraph slot in your Graph Studio account. This can be done by:
- **Removing another unused subgraph** from your [Graph Studio dashboard](https://thegraph.com/studio/), OR
- **Upgrading to an even higher plan** for more subgraph slots.

### 2. Deploy Remaining Subgraph
Once a slot is available, deploy Optimism Sepolia:

```bash
# Deploy Optimism Sepolia
cd defifa-subgraph
./deploy-single-chain.sh optimism_sepolia v0.3.1
```

## 📋 Deployment Process

### Manual Steps (if scripts fail)
1. **Update subgraph.yaml**:
   ```yaml
   dataSources:
     - kind: ethereum
       name: DefifaDeployer
       address: "0xaa1c5d7bee4cc88523286774dffeab26687ec0ff"
       startBlock: 34837971  # Get from deployment artifacts
       network: optimism-sepolia  # Change for each chain (use hyphens)
   ```

2. **Copy ABIs**:
   ```bash
   cp ../defifa-collection-deployer-v5/deployments/defifa-v5/optimism_sepolia/DefifaDeployer.json abis/DefifaDeployer.json
   cp ../defifa-collection-deployer-v5/deployments/defifa-v5/optimism_sepolia/DefifaDelegate.json abis/DefifaNFT.json
   cp ../defifa-collection-deployer-v5/deployments/defifa-v5/optimism_sepolia/DefifaGovernor.json abis/DefifaGovernor.json
   ```

3. **Build and Deploy**:
   ```bash
   npm run codegen
   npm run build
   graph deploy --node https://api.studio.thegraph.com/deploy/ defifa-optimism-sepolia --version-label v0.3.1
   ```

## 🔍 Verification

After deployment, verify each subgraph is working:

```bash
# Test query for each chain
curl -X POST "https://api.studio.thegraph.com/query/107226/defifa-base-sepolia/v0.3.1" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { contracts(first: 5) { id address gameId name } }"
  }'
```

## 📝 Notes

- All chains use the same contract addresses due to factory deployment pattern
- The interface is already configured to use the new subgraph versions
- Sepolia subgraph is already deployed and working
- The deployment scripts handle ABI updates and configuration automatically
- Start blocks are extracted from deployment artifacts for each chain
- Subgraph names in Graph Studio use hyphens (e.g., `defifa-base-sepolia`), not underscores.
- **Current Status**: 3 out of 4 subgraphs deployed successfully!