import assert from "node:assert/strict";
import {
  buildTrainingStepHref,
  buildTrainingWorkspaceHref,
} from "@/features/training/routes";

assert.equal(buildTrainingStepHref(2, null), "/training/register/2");
assert.equal(
  buildTrainingStepHref(4, "abc-123"),
  "/training/register/4?registration=abc-123"
);

assert.equal(buildTrainingWorkspaceHref("/training/materials", null), "/training/materials");
assert.equal(
  buildTrainingWorkspaceHref("/training/dashboard", "abc-123"),
  "/training/dashboard?registration=abc-123"
);

console.log("training route helpers passed");
