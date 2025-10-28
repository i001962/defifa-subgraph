import { BigInt, DataSourceContext } from "@graphprotocol/graph-ts"
import { 
  LaunchGame as LaunchGameEvent,
  QueuedRefundPhase as QueuedRefundPhaseEvent,
  QueuedScoringPhase as QueuedScoringPhaseEvent,
  QueuedNoContest as QueuedNoContestEvent,
  FulfilledCommitments as FulfilledCommitmentsEvent
} from "../../generated/DefifaDeployer/DefifaDeployer"
import {
  Contract as ContractEntity,
  Governor,
  Account
} from "../../generated/schema"
import {
  DefifaNFT as Contract,
  Governor as GovernorInstance
} from "../../generated/templates"

import { DefifaNFT } from "../../generated/templates/DefifaNFT/DefifaNFT"
import { Governor as GovernorContract } from "../../generated/templates/Governor/Governor"

export function handleLaunchGame(event: LaunchGameEvent): void {
  let caller = event.params.caller
  let delegate = event.params.delegate
  let gameId = event.params.gameId
  let governor = event.params.governor
  let tokenUriResolver = event.params.tokenUriResolver

  let contract = new ContractEntity(delegate)
  let governorContract = new Governor(governor)
  let governorAccount = new Account(governor)

  let instance = DefifaNFT.bind(event.params.delegate)

  contract.address = delegate
  contract.gameId = gameId
  contract.governor = governor
  contract.creator = caller
  contract.tokenUriResolver = tokenUriResolver
  contract.totalSupply = BigInt.fromI32(0)

  let name = instance.try_name()
  if (!name.reverted) {
    contract.name = name.value
  }
  let symbol = instance.try_symbol()
  if (!symbol.reverted) {
    contract.symbol = symbol.value
  }

  contract.save()

  // const COUNTING_MODE = GovernorContract.bind(governor).try_COUNTING_MODE()
  governorContract.asAccount = governor
  governorContract.defifaContract = delegate
  // if (!COUNTING_MODE.reverted) {
  //   governorContract.mode = COUNTING_MODE.value
  // }
  governorContract.save()

  governorAccount.asGovernor = governor
  governorAccount.save()

  let defifaContractContext = new DataSourceContext()
  defifaContractContext.setBigInt("gameId", gameId)
  Contract.createWithContext(delegate, defifaContractContext)

  let governorContext = new DataSourceContext()
  governorContext.setBigInt("gameId", gameId)
  GovernorInstance.createWithContext(governor, governorContext)
}

export function handleQueuedRefundPhase(event: QueuedRefundPhaseEvent): void {
  // TODO: Implement handler for QueuedRefundPhase event
  // For now, this is a stub to allow the subgraph to compile
}

export function handleQueuedScoringPhase(event: QueuedScoringPhaseEvent): void {
  // TODO: Implement handler for QueuedScoringPhase event
  // For now, this is a stub to allow the subgraph to compile
}

export function handleQueuedNoContest(event: QueuedNoContestEvent): void {
  // TODO: Implement handler for QueuedNoContest event
  // For now, this is a stub to allow the subgraph to compile
}

export function handleFulfilledCommitments(event: FulfilledCommitmentsEvent): void {
  // TODO: Implement handler for FulfilledCommitments event
  // For now, this is a stub to allow the subgraph to compile
}
