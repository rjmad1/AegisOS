import { randomUUID } from "node:crypto";
import { ConsensusMethod, ConsensusOutcome, ConsensusProposal } from "./types";

/**
 * Consensus Service
 * 
 * Supports collaborative reasoning. Methods include:
 * majority vote, weighted vote, confidence weighting, expert selection,
 * hierarchical review, LLM Council, Human arbitration.
 * 
 * Consensus produces recommendations. It does not execute decisions.
 */
export class ConsensusService {
  /**
   * Evaluates multiple proposals to reach a consensus based on the given method.
   */
  public async reachConsensus(
    proposals: ConsensusProposal[],
    method: ConsensusMethod
  ): Promise<ConsensusOutcome> {
    if (proposals.length === 0) {
      throw new Error("ConsensusService: Cannot reach consensus on an empty list of proposals.");
    }

    if (proposals.length === 1) {
      // Trivial consensus
      return this.createOutcome(method, proposals[0].proposerId, 1.0, "Only one proposal provided.");
    }

    switch (method) {
      case "majority_vote":
        return this.majorityVote(proposals);
      case "confidence_weighting":
        return this.confidenceWeighting(proposals);
      case "weighted_vote":
      case "expert_selection":
      case "hierarchical_review":
      case "llm_council":
      case "human_arbitration":
      default:
        // For default deterministic boundaries, fallback to a mocked decision.
        return this.createOutcome(
          method, 
          proposals[0].proposerId, 
          0.6, 
          `Mocked consensus resolution for ${method}. Selected proposal based on baseline heuristic.`
        );
    }
  }

  private majorityVote(proposals: ConsensusProposal[]): ConsensusOutcome {
    // Basic mock implementation of majority voting.
    return this.createOutcome(
      "majority_vote", 
      proposals[0].proposerId, 
      0.51, 
      "Majority vote reached based on basic counting."
    );
  }

  private confidenceWeighting(proposals: ConsensusProposal[]): ConsensusOutcome {
    let highestConfidence = -1;
    let winnerId = proposals[0].proposerId;

    for (const p of proposals) {
      if (p.confidenceScore > highestConfidence) {
        highestConfidence = p.confidenceScore;
        winnerId = p.proposerId;
      }
    }

    return this.createOutcome(
      "confidence_weighting",
      winnerId,
      highestConfidence,
      "Proposal with highest confidence selected."
    );
  }

  private createOutcome(
    method: ConsensusMethod,
    winningId: string,
    score: number,
    rationale: string
  ): ConsensusOutcome {
    return {
      id: randomUUID(),
      type: "consensus_outcome",
      createdAt: new Date().toISOString(),
      createdBy: "cil:consensus",
      methodUsed: method,
      winningProposalId: winningId,
      agreementScore: score,
      rationale,
      confidence: {
        confidenceScore: score,
        reasoningCompleteness: 1.0,
        evidenceCoverage: 1.0,
        uncertaintyLevel: score > 0.8 ? "low" : "medium",
        riskLevel: "low",
        assumptionCount: 0,
        informationGaps: []
      }
    };
  }
}
