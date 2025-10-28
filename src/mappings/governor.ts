import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ScorecardSubmitted as ScorecardSubmittedEvent
} from "../../generated/templates/Governor/DefifaGovernor"
import {
  Account,
  Scorecard,
  DefifaTierRedemptionWeight
} from "../../generated/schema"

export function handleScorecardSubmitted(event: ScorecardSubmittedEvent): void {
  let gameId = event.params.gameId
  let scorecardId = event.params.scorecardId
  let tierWeights = event.params.tierWeights
  let isDefaultAttestationDelegate = event.params.isDefaultAttestationDelegate
  let caller = event.params.caller

  // Create or get the submitter account
  let submitter = Account.load(caller)
  if (submitter == null) {
    submitter = new Account(caller)
    submitter.save()
  }

  // Create the scorecard
  let scorecard = new Scorecard(gameId.toString() + "-" + scorecardId.toString())
  scorecard.gameId = gameId.toString()
  scorecard.scorecardId = scorecardId
  scorecard.submitter = submitter.id
  scorecard.save()

  // Create tier weights
  for (let i = 0; i < tierWeights.length; i++) {
    let tierWeight = tierWeights[i]
    let tierWeightId = scorecard.id + "-" + tierWeight.id.toString()
    
    let defifaTierRedemptionWeight = new DefifaTierRedemptionWeight(tierWeightId)
    defifaTierRedemptionWeight.scorecard = scorecard.id
    defifaTierRedemptionWeight.tierId = tierWeight.id.toString()
    defifaTierRedemptionWeight.redemptionWeight = tierWeight.cashOutWeight
    defifaTierRedemptionWeight.save()
  }
}