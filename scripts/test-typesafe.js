import { TypeSafeSystemOneDirector } from "../src/lib/typesafe-director.ts";

console.log("=== Testing TypeSafe System One Evaluation & Routing Engine ===");

// Scenario 1: Early ascent, calm pace
const telem1 = {
  climbHeightMeters: 15,
  runDurationSeconds: 8,
  tapFrequencyPerSec: 1.2,
  averageVelocityY: -2.1,
  distanceToLavaMeters: 14.2,
  crumbleStressCount: 10,
  powerUpsAcquired: 0,
  doubleJumpsTriggered: 0,
  consecutiveQuickPlacements: 1,
};

const eval1 = TypeSafeSystemOneDirector.evaluateLiveSession(telem1);
console.log("\n[Scenario 1: Early Calm Ascent]");
console.log(
  "Pacing Mode (Choice):",
  eval1.pacingMode.selected,
  `(${eval1.pacingMode.confidence * 100}%)`,
);
console.log(
  "Imminent Hazard (Noul):",
  eval1.imminentHazard.isAffirmative ? "YES" : "NO",
  `(P = ${eval1.imminentHazard.probability})`,
);
console.log(
  "Clutch Rescue Needed (Noul):",
  eval1.clutchRescueEligible.isAffirmative ? "YES" : "NO",
  `(P = ${eval1.clutchRescueEligible.probability})`,
);
console.log(
  "Mastery Grade (Score):",
  eval1.climberMastery.levelName,
  `(Level ${eval1.climberMastery.level})`,
);
console.log(
  "Reflex Precision (Score):",
  eval1.reflexPrecision.levelName,
  `(Level ${eval1.reflexPrecision.level})`,
);
console.log("Coaching Routed:", eval1.coachingRecommendation.headline);

// Scenario 2: Panic state, lava 1.8m below with clutch rescue eligible
const telem2 = {
  climbHeightMeters: 75,
  runDurationSeconds: 32,
  tapFrequencyPerSec: 3.4,
  averageVelocityY: 1.5,
  distanceToLavaMeters: 1.8,
  crumbleStressCount: 45,
  powerUpsAcquired: 2,
  doubleJumpsTriggered: 1,
  consecutiveQuickPlacements: 6,
};

const eval2 = TypeSafeSystemOneDirector.evaluateLiveSession(telem2);
console.log("\n[Scenario 2: Critical Magma Panic]");
console.log(
  "Pacing Mode (Choice):",
  eval2.pacingMode.selected,
  `(${eval2.pacingMode.confidence * 100}%)`,
);
console.log(
  "Imminent Hazard (Noul):",
  eval2.imminentHazard.isAffirmative ? "YES" : "NO",
  `(P = ${eval2.imminentHazard.probability})`,
);
console.log(
  "Clutch Rescue Needed (Noul):",
  eval2.clutchRescueEligible.isAffirmative ? "YES" : "NO",
  `(P = ${eval2.clutchRescueEligible.probability})`,
);
console.log(
  "Mastery Grade (Score):",
  eval2.climberMastery.levelName,
  `(Level ${eval2.climberMastery.level})`,
);
console.log(
  "Reflex Precision (Score):",
  eval2.reflexPrecision.levelName,
  `(Level ${eval2.reflexPrecision.level})`,
);
console.log(
  "Dynamic Bounce Boost:",
  `${(eval2.dynamicWeights.bounceChance * 100).toFixed(1)}%`,
);
console.log("Coaching Routed:", eval2.coachingRecommendation.headline);

// Scenario 3: Apex Titan Flow State
const telem3 = {
  climbHeightMeters: 280,
  runDurationSeconds: 70,
  tapFrequencyPerSec: 2.1,
  averageVelocityY: -6.2,
  distanceToLavaMeters: 18.5,
  crumbleStressCount: 120,
  powerUpsAcquired: 7,
  doubleJumpsTriggered: 5,
  consecutiveQuickPlacements: 9,
};

const eval3 = TypeSafeSystemOneDirector.evaluateLiveSession(telem3);
console.log("\n[Scenario 3: Apex Titan Flow State]");
console.log(
  "Pacing Mode (Choice):",
  eval3.pacingMode.selected,
  `(${eval3.pacingMode.confidence * 100}%)`,
);
console.log(
  "Imminent Hazard (Noul):",
  eval3.imminentHazard.isAffirmative ? "YES" : "NO",
  `(P = ${eval3.imminentHazard.probability})`,
);
console.log(
  "Mastery Grade (Score):",
  eval3.climberMastery.levelName,
  `(Level ${eval3.climberMastery.level})`,
);
console.log(
  "Reflex Precision (Score):",
  eval3.reflexPrecision.levelName,
  `(Level ${eval3.reflexPrecision.level})`,
);
console.log("Coaching Routed:", eval3.coachingRecommendation.headline);

console.log("\nAll TypeSafe System One primitives evaluated successfully!");
