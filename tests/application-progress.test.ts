import assert from "node:assert/strict";
import {
  getApplicationProgress,
  getStepCompletion,
  isStepOpen,
} from "../src/features/applications/progress";

const incomplete = getApplicationProgress({
  programmeSelected: true,
  personalDetailsComplete: true,
  documentsComplete: false,
  paymentStatus: "none",
});

assert.equal(incomplete.currentStep, 3);
assert.equal(incomplete.maxAllowedStep, 3);
assert.equal(getStepCompletion(4, incomplete), false);
assert.equal(isStepOpen(5, incomplete), false);

const paymentReady = getApplicationProgress({
  programmeSelected: true,
  personalDetailsComplete: true,
  documentsComplete: true,
  paymentStatus: "none",
});

assert.equal(paymentReady.currentStep, 4);
assert.equal(paymentReady.maxAllowedStep, 4);
assert.equal(getStepCompletion(3, paymentReady), true);
assert.equal(getStepCompletion(4, paymentReady), false);
assert.equal(getStepCompletion(5, paymentReady), false);

const awaitingApproval = getApplicationProgress({
  programmeSelected: true,
  personalDetailsComplete: true,
  documentsComplete: true,
  paymentStatus: "pending_approval",
});

assert.equal(awaitingApproval.currentStep, 5);
assert.equal(awaitingApproval.maxAllowedStep, 5);
assert.equal(getStepCompletion(4, awaitingApproval), true);
assert.equal(getStepCompletion(5, awaitingApproval), false);

const approved = getApplicationProgress({
  programmeSelected: true,
  personalDetailsComplete: true,
  documentsComplete: true,
  paymentStatus: "successful",
});

assert.equal(approved.currentStep, 5);
assert.equal(approved.maxAllowedStep, 5);
assert.equal(getStepCompletion(5, approved), true);
