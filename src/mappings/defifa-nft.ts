import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  json
} from "@graphprotocol/graph-ts"
import {
  Transfer as TransferEvent,
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
        // For IPFS URIs, we'll create a basic TokenMetadata entry
        // The actual metadata fetching would need to be handled by the frontend
        let tokenMetadata = new TokenMetadata(tokenFullId)
        tokenMetadata.token = tokenFullId
        tokenMetadata.name = "NFT #" + tokenId
        tokenMetadata.image = "https://ipfs.io/ipfs/" + uri.value.substring(7)
        tokenMetadata.save()
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

