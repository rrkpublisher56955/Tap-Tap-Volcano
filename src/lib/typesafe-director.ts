/**
 * TypeSafe System One Models — Intelligent Gameplay Evaluation & Routing Engine
 *
 * Implements TypeSafe's System One architecture (Jev model specification):
 * - Fast, atomic typed judgments that software can compose directly
 * - Three foundational primitives:
 *    1. Choice: Pick one option from a defined categorical set with probability distribution
 *    2. Noul: Calibrated probability P(yes) that a condition holds
 *    3. Score: Probability-weighted position on structured levels
 *
 * Used in Tap Tap Volcano for:
 * - Dynamic Pacing & Difficulty Routing (Choice)
 * - Imminent Hazard & Fatal Danger Evaluation (Noul)
 * - Clutch Rescue Dynamic Assistance Routing (Noul)
 * - Climber Reflex & Agility Mastery Scoring (Score)
 * - Tap Timing & Placement Precision (Score)
 * - Post-Run Death Telemetry Coaching Router
 */

export interface ClimbSessionTelemetry {
  climbHeightMeters: number;
  runDurationSeconds: number;
  tapFrequencyPerSec: number;
  averageVelocityY: number;
  distanceToLavaMeters: number;
  crumbleStressCount: number;
  powerUpsAcquired: number;
  doubleJumpsTriggered: number;
  consecutiveQuickPlacements: number;
}

export type PacingModeOption =
  | "measured_ascent" // Calm, calculated climbing
  | "flow_state" // High rhythm, confident placement
  | "panic_climb" // Rapid erratic taps, close to lava
  | "terminal_peril"; // Imminent submersion, desperate jumps

export interface TypeSafeChoiceJudgment<T extends string> {
  type: "choice";
  selected: T;
  confidence: number;
  distribution: Record<T, number>;
  rationale: string;
}

export interface TypeSafeNoulJudgment {
  type: "noul";
  condition: string;
  probability: number; // P(yes) in [0, 1]
  isAffirmative: boolean;
}

export interface TypeSafeScoreJudgment {
  type: "score";
  dimension: string;
  level: number; // 1 to 5
  confidence: number;
  levelName: string;
  description: string;
}

export interface DynamicSpawnWeights {
  bounceChance: number;
  doubleChance: number;
  freezeChance: number;
  anchorChance: number;
  normalChance: number;
  lavaSpeedMultiplier: number;
  scoreMultiplier: number;
}

export interface TypeSafeRunEvaluation {
  timestamp: number;
  pacingMode: TypeSafeChoiceJudgment<PacingModeOption>;
  imminentHazard: TypeSafeNoulJudgment;
  clutchRescueEligible: TypeSafeNoulJudgment;
  climberMastery: TypeSafeScoreJudgment;
  reflexPrecision: TypeSafeScoreJudgment;
  dynamicWeights: DynamicSpawnWeights;
  coachingRecommendation: {
    badge: string;
    headline: string;
    tacticalTip: string;
  };
}

/**
 * TypeSafe System One Engine Simulator & Client
 * Computes calibrated System One evaluations over climb telemetry
 */
export class TypeSafeSystemOneDirector {
  /**
   * Evaluate live telemetry and route dynamic game decisions
   */
  public static evaluateLiveSession(telemetry: ClimbSessionTelemetry): TypeSafeRunEvaluation {
    const {
      climbHeightMeters,
      distanceToLavaMeters,
      tapFrequencyPerSec,
      consecutiveQuickPlacements,
      powerUpsAcquired,
      runDurationSeconds,
    } = telemetry;

    // -------------------------------------------------------------
    // 1. Choice Primitive: Pacing Mode Routing
    // -------------------------------------------------------------
    let dist: Record<PacingModeOption, number> = {
      measured_ascent: 0.15,
      flow_state: 0.25,
      panic_climb: 0.35,
      terminal_peril: 0.25,
    };

    if (distanceToLavaMeters < 3.5) {
      dist = {
        terminal_peril: 0.72,
        panic_climb: 0.22,
        flow_state: 0.05,
        measured_ascent: 0.01,
      };
    } else if (tapFrequencyPerSec > 2.8 && distanceToLavaMeters < 8) {
      dist = {
        panic_climb: 0.64,
        terminal_peril: 0.2,
        flow_state: 0.12,
        measured_ascent: 0.04,
      };
    } else if (consecutiveQuickPlacements >= 4 && distanceToLavaMeters >= 8) {
      dist = {
        flow_state: 0.75,
        measured_ascent: 0.15,
        panic_climb: 0.08,
        terminal_peril: 0.02,
      };
    } else {
      dist = {
        measured_ascent: 0.68,
        flow_state: 0.22,
        panic_climb: 0.08,
        terminal_peril: 0.02,
      };
    }

    let topChoice: PacingModeOption = "measured_ascent";
    let maxProb = 0;
    (Object.keys(dist) as PacingModeOption[]).forEach((key) => {
      if (dist[key] > maxProb) {
        maxProb = dist[key];
        topChoice = key;
      }
    });

    const pacingChoice: TypeSafeChoiceJudgment<PacingModeOption> = {
      type: "choice",
      selected: topChoice,
      confidence: Math.round(maxProb * 100) / 100,
      distribution: dist,
      rationale: `Lava buffer is ${distanceToLavaMeters.toFixed(1)}m with tap rate ${tapFrequencyPerSec.toFixed(1)} taps/sec.`,
    };

    // -------------------------------------------------------------
    // 2. Noul Primitive: Imminent Hazard Evaluation
    // P(yes) that player is in fatal stress requiring urgent response
    // -------------------------------------------------------------
    let hazardProb = 0.05;
    if (distanceToLavaMeters < 2.5) {
      hazardProb = 0.94;
    } else if (distanceToLavaMeters < 5) {
      hazardProb = 0.72;
    } else if (distanceToLavaMeters < 9) {
      hazardProb = 0.38;
    } else {
      hazardProb = 0.08;
    }

    const hazardNoul: TypeSafeNoulJudgment = {
      type: "noul",
      condition: "player_in_fatal_submersion_danger",
      probability: hazardProb,
      isAffirmative: hazardProb >= 0.5,
    };

    // -------------------------------------------------------------
    // 2b. Noul Primitive: Clutch Rescue Dynamic Assistance
    // P(yes) that player qualifies for clutch rescue assistance
    // -------------------------------------------------------------
    let clutchProb = 0.04;
    if (distanceToLavaMeters < 3.2 && climbHeightMeters >= 30) {
      clutchProb = 0.88;
    } else if (distanceToLavaMeters < 5.0 && climbHeightMeters >= 20) {
      clutchProb = 0.62;
    } else if (distanceToLavaMeters < 8.0) {
      clutchProb = 0.25;
    }

    const clutchNoul: TypeSafeNoulJudgment = {
      type: "noul",
      condition: "eligible_for_dynamic_clutch_rescue",
      probability: clutchProb,
      isAffirmative: clutchProb >= 0.6,
    };

    // -------------------------------------------------------------
    // 3. Score Primitive: Climber Agility & Mastery Level (1 to 5)
    // -------------------------------------------------------------
    let rawScore = 1;
    if (climbHeightMeters >= 250 && powerUpsAcquired >= 3) {
      rawScore = 5;
    } else if (climbHeightMeters >= 120 || (climbHeightMeters >= 80 && powerUpsAcquired >= 2)) {
      rawScore = 4;
    } else if (climbHeightMeters >= 60 || runDurationSeconds >= 25) {
      rawScore = 3;
    } else if (climbHeightMeters >= 25) {
      rawScore = 2;
    } else {
      rawScore = 1;
    }

    const levelDescriptions = [
      { name: "Novice Hopper", desc: "Learning initial tap timing and block stability" },
      { name: "Steady Ascender", desc: "Maintains cadence while lava pace accelerates" },
      { name: "Rhythm Weaver", desc: "Exploits crumbles and bounce pads with consistent flow" },
      { name: "Magma Acrobat", desc: "Effortlessly chains double jumps and vertical boosts" },
      {
        name: "Apex Titan",
        desc: "Master of extreme heights, fluid spatial instinct, and clutch escapes",
      },
    ];

    const climberScore: TypeSafeScoreJudgment = {
      type: "score",
      dimension: "climber_agility_mastery",
      level: rawScore,
      confidence: 0.88,
      levelName: levelDescriptions[rawScore - 1].name,
      description: levelDescriptions[rawScore - 1].desc,
    };

    // -------------------------------------------------------------
    // 3b. Score Primitive: Reflex Precision Score (1 to 5)
    // -------------------------------------------------------------
    let precisionLevel = 1;
    if (consecutiveQuickPlacements >= 8 && tapFrequencyPerSec >= 1.5 && tapFrequencyPerSec <= 2.8) {
      precisionLevel = 5; // Perfect flow rhythm
    } else if (consecutiveQuickPlacements >= 5) {
      precisionLevel = 4;
    } else if (consecutiveQuickPlacements >= 3) {
      precisionLevel = 3;
    } else if (consecutiveQuickPlacements >= 2) {
      precisionLevel = 2;
    }

    const precisionDescriptions = [
      { name: "Erratic Tap", desc: "Taps lack steady tempo; inconsistent interval gaps" },
      { name: "Basic Cadence", desc: "Beginning to find steady jump placement rhythm" },
      { name: "Fluid Sync", desc: "Reliable block deployment at the apex of each jump" },
      { name: "High-Speed Harmonic", desc: "Smooth rapid climb without wasteful double placements" },
      { name: "Chrono Precision", desc: "Flawless metronomic timing synchronized with crumble decay" },
    ];

    const reflexScore: TypeSafeScoreJudgment = {
      type: "score",
      dimension: "reflex_placement_precision",
      level: precisionLevel,
      confidence: 0.92,
      levelName: precisionDescriptions[precisionLevel - 1].name,
      description: precisionDescriptions[precisionLevel - 1].desc,
    };

    // -------------------------------------------------------------
    // 4. Dynamic Director Weights Routing
    // -------------------------------------------------------------
    const dynamicWeights = this.computeDynamicWeights(telemetry, clutchNoul.isAffirmative, topChoice);

    // -------------------------------------------------------------
    // 5. Coaching Router for Post-Run Reflection
    // -------------------------------------------------------------
    const coaching = this.routeCoaching(telemetry, pacingChoice, hazardNoul);

    return {
      timestamp: Date.now(),
      pacingMode: pacingChoice,
      imminentHazard: hazardNoul,
      clutchRescueEligible: clutchNoul,
      climberMastery: climberScore,
      reflexPrecision: reflexScore,
      dynamicWeights,
      coachingRecommendation: coaching,
    };
  }

  /**
   * Translates TypeSafe System One judgments into dynamic gameplay parameters
   */
  public static computeDynamicWeights(
    t: ClimbSessionTelemetry,
    isClutchActive: boolean,
    pacing: PacingModeOption,
  ): DynamicSpawnWeights {
    let bounceChance = 0.08;
    let doubleChance = 0.05;
    let freezeChance = 0.03;
    let anchorChance = 0.05;
    let lavaSpeedMultiplier = 1.0;
    let scoreMultiplier = 1.0;

    // Scale with altitude
    if (t.climbHeightMeters >= 50) {
      bounceChance = 0.12;
      doubleChance = 0.07;
      freezeChance = 0.04;
    }
    if (t.climbHeightMeters >= 150) {
      bounceChance = 0.14;
      doubleChance = 0.08;
      freezeChance = 0.05;
      anchorChance = 0.06;
    }

    // Dynamic Clutch Rescue Injection:
    // If player is in imminent peril, dynamically boost rescue power-ups to give them an escape path!
    if (isClutchActive) {
      bounceChance += 0.12;
      freezeChance += 0.08;
      lavaSpeedMultiplier = 0.85; // Slight dramatic relief window
    }

    // Flow State rewards
    if (pacing === "flow_state") {
      scoreMultiplier = 1.5;
    }

    const normalChance = Math.max(0.1, 1 - (bounceChance + doubleChance + freezeChance + anchorChance));

    return {
      bounceChance,
      doubleChance,
      freezeChance,
      anchorChance,
      normalChance,
      lavaSpeedMultiplier,
      scoreMultiplier,
    };
  }

  private static routeCoaching(
    t: ClimbSessionTelemetry,
    choice: TypeSafeChoiceJudgment<PacingModeOption>,
    hazard: TypeSafeNoulJudgment,
  ) {
    if (t.climbHeightMeters < 20) {
      return {
        badge: "Early Rhythm",
        headline: "Establish Upward Momentum Early",
        tacticalTip:
          "Don't linger on your initial platform. Tap immediately to begin your ascent before the lava builds speed.",
      };
    }
    if (t.distanceToLavaMeters < 2.0 && t.tapFrequencyPerSec > 3.0) {
      return {
        badge: "Panic Cadence",
        headline: "Smooth Overdrive Into Deliberate Steps",
        tacticalTip:
          "High-frequency spamming spawns blocks inside each other. Aim for measured taps at the apex of each jump.",
      };
    }
    if (t.doubleJumpsTriggered === 0 && t.powerUpsAcquired > 0) {
      return {
        badge: "Power-up Synergy",
        headline: "Unleash Stored Airborne Jumps",
        tacticalTip:
          "You collected double-jump power-ups but didn't trigger them mid-air. Tap while airborne to gain massive clearance.",
      };
    }
    if (t.climbHeightMeters >= 100) {
      return {
        badge: "Peak Mastery",
        headline: "Elite Lava Navigator",
        tacticalTip:
          "Phenomenal ascent! At 100m+, lava rises at peak velocity—prioritize diagonal bounce-pad catches to maintain lead.",
      };
    }
    return {
      badge: "Height Endurance",
      headline: "Master The Crumble Clock",
      tacticalTip:
        "Platforms disintegrate in 2.6 seconds. Use visual fracture cracks as your metronome to vault upward.",
    };
  }
}
