import assert from "node:assert/strict";
import {
  normalizePostgraduateStatus,
  parseTextareaList,
  slugifyProgrammeValue,
} from "@/features/postgraduate/catalogue";

assert.equal(slugifyProgrammeValue("MSc Food Science & Technology"), "msc-food-science-technology");
assert.deepEqual(parseTextareaList("One\n\n Two \nThree"), ["One", "Two", "Three"]);
assert.equal(normalizePostgraduateStatus("published"), "Open");
assert.equal(normalizePostgraduateStatus("closing_soon"), "Closing Soon");

console.log("postgraduate catalogue helpers passed");
