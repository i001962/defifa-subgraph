import { Address, BigInt, BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts"

import {
  Account,
  Governor,
  Proposal,
  ProposalCall,
  ProposalSupport,
  VoteReceipt,
  ProposalCreated,
  ProposalQueued,
  ProposalExecuted,
  ProposalCanceled,
  Transaction,
  VoteCast,
  Scorecard,
  TierWeight
} from "../../generated/schema"

import {
  GameInitialized as GameInitializedEvent,
  ScorecardSubmitted as ScorecardSubmittedEvent,
  ScorecardAttested as ScorecardAttestedEvent,
  ScorecardRatified as ScorecardRatifiedEvent
} from "../../generated/templates/Governor/DefifaGovernor"

import {
  ProposalCreated as ProposalCreatedEvent,
  ProposalQueued as ProposalQueuedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalCanceled as ProposalCanceledEvent,
  VoteCast as VoteCastEvent,
  VoteCastWithParams as VoteCastWithParamsEvent,
  Governor as GovernorContract
} from "../../generated/templates/Governor/Governor"

// Helper constants (replacing deprecated @amxx/graphprotocol-utils)
const BIGINT_ZERO = BigInt.fromI32(0)
const BIGDECIMAL_ZERO = BigDecimal.fromString("0")

// Helper function to convert BigInt to BigDecimal with 18 decimals
function toDecimals(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigDecimal.fromString("1000000000000000000"))
}

export function handleGameInitialized(event: GameInitializedEvent): void {
  // Game initialization event
  // Parameters:
  // - gameId: uint256 (indexed)
  // - attestationStartTime: uint256
  // - attestationGracePeriod: uint256
  // - caller: address
  
  // For now, this is a stub handler to allow the subgraph to sync
  // The Governor entity is already created in the LaunchGame handler
  // This event just signals that the game's attestation phase has been initialized
}

export function handleScorecardSubmitted(event: ScorecardSubmittedEvent): void {
  // Create scorecard entity
  let scorecardId = event.params.gameId.toString() + "-" + event.params.scorecardId.toString()
  let scorecard = new Scorecard(scorecardId)
  
  scorecard.gameId = event.params.gameId
  scorecard.scorecardId = event.params.scorecardId
  scorecard.submitter = fetchAccount(event.params.caller).id
  scorecard.isDefaultAttestationDelegate = event.params.isDefaultAttestationDelegate
  scorecard.timestamp = event.block.timestamp
  scorecard.blockNumber = event.block.number
  scorecard.transactionHash = event.transaction.hash
  scorecard.ratified = false
  scorecard.ratifiedAt = null
  scorecard.ratifiedBy = null
  
  scorecard.save()
  
  // Create tier weight entities
  let tierWeights = event.params.tierWeights
  for (let i = 0; i < tierWeights.length; i++) {
    let tierWeightId = scorecardId + "-" + i.toString()
    let tierWeight = new TierWeight(tierWeightId)
    
    tierWeight.scorecard = scorecardId
    tierWeight.tierId = tierWeights[i].id
    tierWeight.redemptionWeight = tierWeights[i].cashOutWeight
    
    tierWeight.save()
  }
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let governor = fetchGovernor(event.address)

  let proposal = fetchProposal(governor, event.params.proposalId)
  proposal.proposer = fetchAccount(event.params.proposer).id
  proposal.startBlock = event.params.startBlock
  proposal.endBlock = event.params.endBlock
  proposal.description = event.params.description
  proposal.save()

  let targets = event.params.targets
  let values = event.params.values
  let signatures = event.params.signatures
  let calldatas = event.params.calldatas
  for (let i = 0; i < targets.length; ++i) {
    let id = proposal.id.concat("/").concat(i.toString())
    let call = ProposalCall.load(id)

    if (call == null) {
      call = new ProposalCall(id)
      call.proposal = proposal.id
      call.index = i
    }

    call.target = fetchAccount(targets[i]).id
    call.value =
      i < values.length
        ? toDecimals(values[i])
        : BIGDECIMAL_ZERO
    call.signature = i < signatures.length ? signatures[i] : ""
    call.calldata = i < calldatas.length ? calldatas[i] : Bytes.empty()
    call.save()
  }

  let ev = new ProposalCreated(
    event.block.number
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
  )
  ev.emitter = governor.id
  ev.transaction = logTransaction(event).id
  ev.timestamp = event.block.timestamp
  ev.governor = proposal.governor
  ev.proposal = proposal.id
  ev.proposer = proposal.proposer
  ev.save()
}

export function handleProposalQueued(event: ProposalQueuedEvent): void {
  let governor = fetchGovernor(event.address)

  let proposal = fetchProposal(governor, event.params.proposalId)
  proposal.queued = true
  proposal.eta = event.params.eta
  proposal.save()

  let ev = new ProposalQueued(
    event.block.number
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
  )
  ev.emitter = governor.id
  ev.transaction = logTransaction(event).id
  ev.timestamp = event.block.timestamp
  ev.governor = governor.id
  ev.proposal = proposal.id
  ev.eta = event.params.eta
  ev.save()
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let governor = fetchGovernor(event.address)

  let proposal = fetchProposal(governor, event.params.proposalId)
  proposal.executed = true
  proposal.save()

  let ev = new ProposalExecuted(
    event.block.number
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
  )
  ev.emitter = governor.id
  ev.transaction = logTransaction(event).id
  ev.timestamp = event.block.timestamp
  ev.governor = governor.id
  ev.proposal = proposal.id
  ev.save()
}

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  let governor = fetchGovernor(event.address)

  let proposal = fetchProposal(governor, event.params.proposalId)
  proposal.canceled = true
  proposal.save()

  let ev = new ProposalCanceled(
    event.block.number
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
  )
  ev.emitter = governor.id
  ev.transaction = logTransaction(event).id
  ev.timestamp = event.block.timestamp
  ev.governor = governor.id
  ev.proposal = proposal.id
  ev.save()
}

export function handleVoteCast(event: VoteCastEvent): void {
  let governor = fetchGovernor(event.address)

  let proposal = fetchProposal(governor, event.params.proposalId)

  let id = proposal.id.concat("/").concat(event.params.support.toString())
  let support = ProposalSupport.load(id)

  if (support == null) {
    support = new ProposalSupport(id)
    support.proposal = proposal.id
    support.support = event.params.support
    support.weight = BIGINT_ZERO
  }

  support.weight = support.weight.plus(event.params.weight)
  support.save()

  let receipt = fetchVoteReceipt(proposal, event.params.voter)
  receipt.support = support.id
  receipt.weight = event.params.weight
  receipt.reason = event.params.reason
  receipt.save()

  let ev = new VoteCast(
    event.block.number
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
  )
  ev.emitter = governor.id
  ev.transaction = logTransaction(event).id
  ev.timestamp = event.block.timestamp
  ev.governor = governor.id
  ev.proposal = receipt.proposal
  ev.support = receipt.support
  ev.receipt = receipt.id
  ev.voter = receipt.voter
  ev.save()
}

export function handleVoteCastWithParams(event: VoteCastWithParamsEvent): void {
  let governor = fetchGovernor(event.address)

  let proposal = fetchProposal(governor, event.params.proposalId)

  let id = proposal.id.concat("/").concat(event.params.support.toString())
  let support = ProposalSupport.load(id)

  if (support == null) {
    support = new ProposalSupport(id)
    support.proposal = proposal.id
    support.support = event.params.support
    support.weight = BIGINT_ZERO
  }

  support.weight = support.weight.plus(event.params.weight)
  support.save()

  let receipt = fetchVoteReceipt(proposal, event.params.voter)
  receipt.support = support.id
  receipt.weight = event.params.weight
  receipt.reason = event.params.reason
  receipt.params = event.params.params
  receipt.save()

  let ev = new VoteCast(
    event.block.number
      .toString()
      .concat("-")
      .concat(event.logIndex.toString())
  )
  ev.emitter = governor.id
  ev.transaction = logTransaction(event).id
  ev.timestamp = event.block.timestamp
  ev.governor = governor.id
  ev.proposal = receipt.proposal
  ev.support = receipt.support
  ev.receipt = receipt.id
  ev.voter = receipt.voter
  ev.save()
}

// HELPERS

export function fetchAccount(address: Address): Account {
  let account = new Account(address)
  account.save()
  return account
}

export function fetchGovernor(address: Address): Governor {
  let contract = Governor.load(address)

  if (contract == null) {
    const COUNTING_MODE = GovernorContract.bind(address).try_COUNTING_MODE()

    contract = new Governor(address)
    contract.asAccount = address
    if (!COUNTING_MODE.reverted) {
      contract.mode = COUNTING_MODE.value
    }
    contract.save()

    let account = fetchAccount(address)
    account.asGovernor = address
    account.save()
  }

  return contract as Governor
}

export function fetchProposal(
  contract: Governor,
  proposalId: BigInt
): Proposal {
  let id = contract.id
    .toHex()
    .concat("/")
    .concat(proposalId.toHex())
  let proposal = Proposal.load(id)

  if (proposal == null) {
    proposal = new Proposal(id)
    proposal.governor = contract.id
    proposal.proposalId = proposalId
    proposal.proposer = Address.zero()
    proposal.startBlock = BigInt.zero()
    proposal.endBlock = BigInt.zero()
    proposal.description = ""
    proposal.canceled = false
    proposal.queued = false
    proposal.executed = false
  }

  return proposal as Proposal
}

export function fetchVoteReceipt(
  proposal: Proposal,
  voter: Address
): VoteReceipt {
  let id = proposal.id.concat("/").concat(voter.toHex())
  let receipt = VoteReceipt.load(id)

  if (receipt == null) {
    receipt = new VoteReceipt(id)
    receipt.proposal = proposal.id
    receipt.voter = fetchAccount(voter).id
  }

  return receipt as VoteReceipt
}

export function handleScorecardAttested(event: ScorecardAttestedEvent): void {
  // Handle scorecard attestation (voting) event
  // Parameters:
  // - gameId: uint256 (indexed)
  // - scorecardId: uint256 (indexed) 
  // - weight: uint256 (voting weight)
  // - caller: address (voter)
  
  // For now, this is a stub handler to allow the subgraph to sync
  // In the future, we could track individual votes/attestations here
  // The vote counts are already tracked via the contract's attestationCountOf function
}

export function handleScorecardRatified(event: ScorecardRatifiedEvent): void {
  // Handle scorecard ratification (locking) event
  // Parameters:
  // - gameId: uint256 (indexed)
  // - scorecardId: uint256 (indexed)
  // - caller: address (ratifier)
  
  // Update the scorecard to mark it as ratified
  let scorecardId = event.params.gameId.toString() + "-" + event.params.scorecardId.toString()
  let scorecard = Scorecard.load(scorecardId)
  
  if (scorecard != null) {
    scorecard.ratified = true
    scorecard.ratifiedAt = event.block.timestamp
    scorecard.ratifiedBy = fetchAccount(event.params.caller).id
    scorecard.save()
  }
}

export function logTransaction(event: ethereum.Event): Transaction {
  let tx = new Transaction(event.transaction.hash.toHex())
  tx.timestamp = event.block.timestamp
  tx.blockNumber = event.block.number
  tx.save()
  return tx as Transaction
}
export type Tx = Transaction
