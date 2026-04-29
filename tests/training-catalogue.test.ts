import assert from "node:assert/strict";
import {
  canDeleteTrainingProgramme,
  countPaidRegistrationsByTraining,
} from "@/features/training/catalogue";

const paidCounts = countPaidRegistrationsByTraining(
  [
    { trainingId: "training-a", applicationId: "app-1" },
    { trainingId: "training-a", applicationId: "app-1" },
    { trainingId: "training-a", applicationId: "app-2" },
    { trainingId: "training-b", applicationId: "app-3" },
  ]
);

assert.equal(paidCounts.get("training-a"), 2);
assert.equal(paidCounts.get("training-b"), 1);
assert.equal(paidCounts.get("training-c") || 0, 0);

assert.equal(canDeleteTrainingProgramme(0), true);
assert.equal(canDeleteTrainingProgramme(1), false);

console.log("training catalogue helpers passed");
