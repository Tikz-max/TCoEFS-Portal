import assert from "node:assert/strict";
import {
  getTrainingProgress,
  getTrainingStepCompletion,
  isTrainingStepOpen,
} from "@/features/training/progress";

const start = getTrainingProgress({
  applicationExists: false,
  programmeSelected: false,
  profileComplete: false,
  documentsComplete: false,
  paymentStatus: "none",
});

assert.equal(start.currentStep, 1);
assert.equal(start.maxAllowedStep, 1);
assert.equal(isTrainingStepOpen(2, start), false);

const profile = getTrainingProgress({
  applicationExists: true,
  programmeSelected: true,
  profileComplete: false,
  documentsComplete: false,
  paymentStatus: "none",
});

assert.equal(profile.currentStep, 2);
assert.equal(profile.maxAllowedStep, 2);
assert.equal(isTrainingStepOpen(2, profile), true);
assert.equal(isTrainingStepOpen(3, profile), false);

const docs = getTrainingProgress({
  applicationExists: true,
  programmeSelected: true,
  profileComplete: true,
  documentsComplete: false,
  paymentStatus: "none",
});

assert.equal(docs.currentStep, 3);
assert.equal(getTrainingStepCompletion(2, docs), true);
assert.equal(isTrainingStepOpen(4, docs), false);

const payment = getTrainingProgress({
  applicationExists: true,
  programmeSelected: true,
  profileComplete: true,
  documentsComplete: true,
  paymentStatus: "pending_approval",
});

assert.equal(payment.currentStep, 5);
assert.equal(payment.maxAllowedStep, 5);
assert.equal(getTrainingStepCompletion(4, payment), true);
assert.equal(isTrainingStepOpen(5, payment), true);

const approved = getTrainingProgress({
  applicationExists: true,
  programmeSelected: true,
  profileComplete: true,
  documentsComplete: true,
  paymentStatus: "successful",
});

assert.equal(getTrainingStepCompletion(5, approved), true);

console.log("training progress tests passed");
