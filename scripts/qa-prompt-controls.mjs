import assert from "node:assert/strict";
import {
  normalizePromptContext,
  parsePromptControlMarker,
  resolvePromptControl,
} from "../src/lib/prompt-controls.js";
import { JULY_CONTENT } from "../src/julyContent.js";

const content = {
  challenge: "Copy the working prompt below.\n\n[[copy-challenge-prompt]]",
  challengePrompt: "Permanent challenge prompt",
  prompts: [
    { title: "Prompt 1: Setup", text: "Setup prompt" },
    { title: "Prompt 2A (Helper)", text: "Helper prompt" },
  ],
};

const challengeControl = parsePromptControlMarker("[[copy-challenge-prompt]]");
assert.deepEqual(challengeControl, { type: "copy-challenge-prompt" });
assert.equal(resolvePromptControl(challengeControl, normalizePromptContext(content))?.text, "Permanent challenge prompt");

const numberedControl = parsePromptControlMarker("  [[copy-prompt:2A]]  ");
assert.deepEqual(numberedControl, { type: "copy-prompt", prompt: "2A" });
assert.equal(resolvePromptControl(numberedControl, content)?.text, "Helper prompt");

assert.equal(resolvePromptControl(challengeControl, { challengePrompt: "" }), null);
assert.equal(parsePromptControlMarker("Copy the prompt below"), null);

const julyChallengeMarker = JULY_CONTENT.challenge
  .split("\n")
  .map(parsePromptControlMarker)
  .find((control) => control?.type === "copy-challenge-prompt");
assert.ok(julyChallengeMarker, "The canonical July challenge should retain its prompt-control marker.");
assert.equal(
  resolvePromptControl(julyChallengeMarker, JULY_CONTENT)?.text,
  JULY_CONTENT.challengePrompt,
  "The July challenge marker should resolve to its canonical challenge prompt.",
);

console.log("Prompt-control QA passed.");
