import assert from "node:assert/strict";
import {
  getCoursePricing,
  resolveLearnerCourseAccess,
} from "../src/features/elearning/access";

assert.deepEqual(getCoursePricing("foundations-food-security"), {
  pricingType: "free",
  amount: 0,
});

assert.deepEqual(getCoursePricing("post-harvest-management-storage"), {
  pricingType: "paid",
  amount: 5000,
});

assert.equal(
  resolveLearnerCourseAccess({
    pricingType: "free",
    hasEnrollment: false,
    paymentStatus: "none",
    hasCertificate: false,
    progressPercent: 0,
  }).state,
  "free_available"
);

assert.equal(
  resolveLearnerCourseAccess({
    pricingType: "paid",
    hasEnrollment: true,
    paymentStatus: "pending_receipt",
    hasCertificate: false,
    progressPercent: 0,
  }).state,
  "payment_required"
);

assert.equal(
  resolveLearnerCourseAccess({
    pricingType: "paid",
    hasEnrollment: true,
    paymentStatus: "pending_approval",
    hasCertificate: false,
    progressPercent: 0,
  }).state,
  "payment_pending"
);

assert.equal(
  resolveLearnerCourseAccess({
    pricingType: "paid",
    hasEnrollment: true,
    paymentStatus: "failed",
    hasCertificate: false,
    progressPercent: 0,
  }).state,
  "payment_rejected"
);

assert.equal(
  resolveLearnerCourseAccess({
    pricingType: "paid",
    hasEnrollment: true,
    paymentStatus: "successful",
    hasCertificate: false,
    progressPercent: 40,
  }).state,
  "active"
);

assert.equal(
  resolveLearnerCourseAccess({
    pricingType: "free",
    hasEnrollment: true,
    paymentStatus: "none",
    hasCertificate: true,
    progressPercent: 100,
  }).state,
  "completed"
);
