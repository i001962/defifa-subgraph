import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  json
} from "@graphprotocol/graph-ts"
import {
  Transfer as TransferEvent,
  Mint as MintEvent,
  MintReservedToken as MintReservedTokenEvent,
  TierDelegateAttestationsChanged as TierDelegateAttestationsChangedEvent,
  DefifaNFT
} from "../../generated/templates/DefifaNFT/DefifaNFT"
import {
  Transfer,
  Owner,
  Contract,
  Token,
  TokenMetadata
} from "../../generated/schema"
import { decode } from "as-base64"
import { TokenMetadata as TokenMetadataTemplate } from "../../generated/templates"

export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  transfer.blockNumber = event.block.number
  transfer.timestamp = event.block.timestamp

  let tokenId = event.params.tokenId.toString()
  let to = getOrCreateOwner(event.params.to)
  let from = getOrCreateOwner(event.params.from)
  let contract = Contract.load(event.address)!
  let instance = DefifaNFT.bind(event.address)
  let token = Token.load(event.address.toHexString() + "-" + tokenId)

  // Do not go to minus with null-address
  if (from.balance > BigInt.fromI32(0)) {
    from.balance = from.balance.minus(BigInt.fromI32(1))
  }

  to.balance = to.balance.plus(BigInt.fromI32(1))

  if (token == null) {
    const tokenFullId = event.address.toHexString() + "-" + tokenId
    token = new Token(tokenFullId)
    token.number = event.params.tokenId
    token.contract = contract.id
    let uri = instance.try_tokenURI(event.params.tokenId)
    if (!uri.reverted) {
      token.uri = uri.value

      if (uri.value.startsWith("data:application/json;base64,")) {
        let tokenMetadata = new TokenMetadata(tokenFullId)
        tokenMetadata.token = tokenFullId

        const metaString = Bytes.fromUint8Array(decode(uri.value.substring(29)))
        const value = json.fromBytes(metaString).toObject()

        if (value) {
          const image = value.get("image")
          const name = value.get("name")
          const description = value.get("description")
          const identifier = value.get("identifier")
          const tags = value.get("tags")

          if (name) tokenMetadata.name = name.toString()
          if (image) tokenMetadata.image = image.toString()
          if (description) tokenMetadata.description = description.toString()
          if (identifier) tokenMetadata.identifier = identifier.toBigInt()
          if (tags)
            tokenMetadata.tags = tags
              .toArray()
              .map<string>((tag) => tag.toString())
        }

        tokenMetadata.save()
      } else if (uri.value.startsWith("ipfs://")) {
        const datasourceContext = dataSource.context()
        datasourceContext.setString("tokenId", tokenId)
        datasourceContext.setString("contract", event.address.toHexString())
        TokenMetadataTemplate.createWithContext(
          uri.value.substring(7),
          datasourceContext
        )
      }
    }

    contract.totalSupply = contract.totalSupply.plus(BigInt.fromI32(1))
    contract.save()
  }

  token.owner = to.id
  transfer.from = from.id
  transfer.to = to.id
  transfer.transactionHash = event.transaction.hash
  transfer.token = token.id
  to.save()
  from.save()
  transfer.save()
  token.save()
}

export function getOrCreateOwner(id: Address): Owner {
  let owner = Owner.load(id.toHexString())
  if (owner == null) {
    owner = new Owner(id.toHexString())
    owner.balance = BigInt.fromI32(0)
    owner.save()
  }
  return owner
}

// Mint event handler - captures mint-specific data that Transfer doesn't have
export function handleMint(event: MintEvent): void {
  // The Mint event is emitted alongside Transfer(0, beneficiary, tokenId)
  // Transfer creates the Token entity, but Mint has additional useful data:
  // - tierId: which tier was minted
  // - totalPrice: how much was paid
  // - caller: who initiated the mint
  
  let tokenId = event.params.tokenId.toString()
  let token = Token.load(event.address.toHexString() + "-" + tokenId)
  
  if (token) {
    // Token was already created by handleTransfer
    // We could store additional mint-specific metadata here if needed:
    // - mint price
    // - tier ID
    // - minter address (vs beneficiary)
    // For now, the Transfer event provides sufficient tracking
  }
}

// MintReservedToken event handler - tracks reserved token mints
export function handleMintReservedToken(event: MintReservedTokenEvent): void {
  // Reserved tokens are minted by the project owner, not through payment
  // The Transfer event creates the Token entity
  // This event provides:
  // - tierId: which tier the reserved token is from
  // - tokenId: the token that was minted
  // - beneficiary: who received it
  
  let tokenId = event.params.tokenId.toString()
  let token = Token.load(event.address.toHexString() + "-" + tokenId)
  
  if (token) {
    // Token was already created by handleTransfer
    // Could mark this as a "reserved" token if we add that field to the schema
  }
}

// TierDelegateAttestationsChanged event handler - tracks voting delegation
export function handleTierDelegateAttestationsChanged(event: TierDelegateAttestationsChangedEvent): void {
  // This event tracks when a user delegates their voting power to an attestation delegate
  // In Defifa, NFT holders can delegate their attestation (voting) power to trusted delegates
  // Parameters:
  // - delegate: the address receiving voting power
  // - tierId: which tier's voting power is being delegated
  // - newAttestationUnits: new total voting power for this delegate
  // - oldAttestationUnits: previous total voting power
  
  // This is used for governance/attestation phase
  // We'd need to add AttestationDelegate entities to the schema to track this properly
  // For basic mint tracking, we can skip this for now
}
