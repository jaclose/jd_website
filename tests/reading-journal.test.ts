import test from "node:test";
import assert from "node:assert/strict";
import { readingQuests } from "../data/readingQuests";
import { essays } from "../lib/content";
import { parseReadingEntries } from "../lib/readingProgress";
test("reading trails cover every original essay exactly once", () => {
  const slugs = readingQuests.flatMap(q => [...q.slugs]);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.deepEqual([...slugs].sort(), essays.map(e => e.slug).sort());
});
test("reading journal restores completion and bounded private reflections", () => {
  const entries = parseReadingEntries({ "hello-world": { startedAt: 1, completedAt: 2, position: 1.5, reflection: "a".repeat(2000) }, invalid: { startedAt: "bad" }, "../unsafe": { startedAt: 1 } });
  assert.deepEqual(Object.keys(entries), ["hello-world"]);
  assert.equal(entries["hello-world"].position, 1);
  assert.equal(entries["hello-world"].reflection.length, 1600);
  assert.equal(entries["hello-world"].completedAt, 2);
  assert.throws(() => parseReadingEntries(null));
});
