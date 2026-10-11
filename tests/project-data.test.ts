import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deployments } from "../data/deployments";
import { garden, gardenArchive } from "../data/garden";
import { gardenFeatures } from "../data/gardenFeatures";
import { gardenPathNodes } from "../data/gardenPaths";
test("active projects have one AXOM identity and current destinations", () => {
  assert.equal(deployments.filter(d => d.id === "axom").length, 1);
  assert.equal(garden.filter(d => d.id === "axom").length, 1);
  for (const data of [deployments, garden, gardenFeatures]) assert.doesNotMatch(JSON.stringify(data), /noctyrium|jd-med-app|vercel.com\/jacloses/i);
  assert.equal(deployments[0].webUrl, "https://axom.info"); assert.equal(deployments[0].repoUrl, "https://github.com/jaclose/AXOM");
  assert.ok(readFileSync(new URL(`../public${deployments[0].art}`, import.meta.url)).length > 0);
});
test("historical prototype and authored essay references are preserved", () => {
  assert.equal(gardenArchive.find(d => d.id === "jd-med-app")?.status, "archived");
  assert.match(readFileSync(new URL('../content/essays.json', import.meta.url), 'utf8'), /Noctyrium/);
});
test("renamed path references resolve", () => {
  const ids = new Set(gardenPathNodes.map(p => p.id));
  for (const node of gardenPathNodes) {
    for (const next of node.nextNodes || []) assert.ok(ids.has(next), `${node.id} → ${next}`);
    if (node.featureId) assert.ok(gardenFeatures.some(f => f.id === node.featureId), node.featureId);
  }
});
