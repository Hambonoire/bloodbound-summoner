// tests/test-fixes.js
// Run with: node tests/test-fixes.js
// Tests the fixes applied to data/combat.js, data/shopLogic.js, and data/status-effects.js.
// All tests are self-contained — no dependency on main.js.

"use strict";

const { createCombatSystem } = require("../data/combat");
const { createShopSystem } = require("../data/shopLogic");
const { createCostSystem } = require("../data/status-effects");

// ─── Tiny test runner ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// Suppress console.log noise from the systems under test
const _log = console.log;
function silence() {
  console.log = () => {};
}
function unsilence() {
  console.log = _log;
}

// ─── Shared fixtures ─────────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
  return Object.assign(
    {
      hp: 30,
      maxHp: 30,
      blood: 5,
      maxBlood: 10,
      marrow: 10,
      pain: 0,
      painCap: 40,
      painZone: "cold",
      apexUnlocked: false,
      summonAttackBonus: 0,
      field: [],
      hand: [],
      deck: [],
      discard: [],
      statuses: { bleedStacks: 0, bleedTurnsRemaining: 0 },
    },
    overrides,
  );
}

function makeEncounter(enemies = []) {
  return { enemies, turn: 0, active: true };
}

// ─── data/combat.js ──────────────────────────────────────────────────────────

section("combat.js — handleEnemyDamaged");

{
  // [combat-1] Rage fires on a living enemy that takes damage
  const player = makePlayer();
  const encounter = makeEncounter();
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  const ragEnemy = {
    id: "e1",
    name: "Vein Sentinel",
    hp: 10,
    maxHp: 10,
    attack: 4,
    armor: 0,
    effect: "Rage: gains +1 attack each time it takes damage.",
  };

  silence();
  combat.handleEnemyDamaged(ragEnemy, 3);
  unsilence();

  assert("[combat-1] Rage fires: attack incremented", ragEnemy.attack === 5);
}

{
  // [combat-2] Rage does NOT fire when damageDealt is 0
  const player = makePlayer();
  const encounter = makeEncounter();
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  const ragEnemy = {
    id: "e1",
    name: "Vein Sentinel",
    hp: 10,
    maxHp: 10,
    attack: 4,
    armor: 0,
    effect: "Rage: gains +1 attack each time it takes damage.",
  };

  silence();
  combat.handleEnemyDamaged(ragEnemy, 0);
  unsilence();

  assert(
    "[combat-2] Rage silent at 0 damage: attack unchanged",
    ragEnemy.attack === 4,
  );
}

{
  // [combat-3] No-op when enemy has no effect
  const player = makePlayer();
  const encounter = makeEncounter();
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  const plain = {
    id: "e2",
    name: "Grunt",
    hp: 5,
    maxHp: 5,
    attack: 2,
    armor: 0,
    effect: null,
  };

  silence();
  let threw = false;
  try {
    combat.handleEnemyDamaged(plain, 2);
  } catch (e) {
    threw = true;
  }
  unsilence();

  assert("[combat-3] No effect — no throw", !threw);
}

section("combat.js — handleEnemyDeath");

{
  // [combat-4] Hollow Thrall heals the next living enemy
  const player = makePlayer();
  const thrall = {
    id: "e1",
    name: "Hollow Thrall",
    hp: 0,
    maxHp: 8,
    attack: 1,
    armor: 0,
    effect: "On death: heals the next enemy in the encounter for 2 HP.",
  };
  const next = {
    id: "e2",
    name: "Boneguard",
    hp: 10,
    maxHp: 16,
    attack: 3,
    armor: 2,
    effect: null,
  };
  const encounter = makeEncounter([thrall, next]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  silence();
  combat.handleEnemyDeath(thrall, 5);
  unsilence();

  assert("[combat-4] Hollow Thrall: next enemy healed by 2", next.hp === 12);
}

{
  // [combat-5] Hollow Thrall no-op when no living enemy follows
  const player = makePlayer();
  const thrall = {
    id: "e1",
    name: "Hollow Thrall",
    hp: 0,
    maxHp: 8,
    attack: 1,
    armor: 0,
    effect: "On death: heals the next enemy in the encounter for 2 HP.",
  };
  const dead = {
    id: "e2",
    name: "Dead Grunt",
    hp: 0,
    maxHp: 5,
    attack: 2,
    armor: 0,
    effect: null,
  };
  const encounter = makeEncounter([thrall, dead]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  silence();
  let threw = false;
  try {
    combat.handleEnemyDeath(thrall, 5);
  } catch (e) {
    threw = true;
  }
  unsilence();

  assert("[combat-5] Hollow Thrall: no living target — no throw", !threw);
  assert("[combat-5] Hollow Thrall: dead enemy HP unchanged", dead.hp === 0);
}

{
  // [combat-6] No-op when deadEnemy has no effect
  const player = makePlayer();
  const plain = {
    id: "e1",
    name: "Grunt",
    hp: 0,
    maxHp: 6,
    attack: 2,
    armor: 0,
    effect: null,
  };
  const encounter = makeEncounter([plain]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  silence();
  let threw = false;
  try {
    combat.handleEnemyDeath(plain, 3);
  } catch (e) {
    threw = true;
  }
  unsilence();

  assert("[combat-6] No effect — no throw", !threw);
}

section("combat.js — attackEnemy");

{
  // [combat-7] Armor absorbs damage correctly
  const player = makePlayer();
  const armored = {
    id: "e1",
    name: "Boneguard",
    hp: 16,
    maxHp: 16,
    attack: 3,
    armor: 2,
    effect: null,
  };
  const encounter = makeEncounter([armored]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });
  const attacker = { name: "Flesh Crawler", attack: 5, id: "c1" };

  silence();
  combat.attackEnemy("e1", attacker);
  unsilence();

  // 5 atk − 2 armor = 3 net damage; 16 − 3 = 13
  assert("[combat-7] Armor absorbs 2: enemy HP = 13", armored.hp === 13);
  assert("[combat-7] Armor reduced to 0", armored.armor === 0);
}

{
  // [combat-8] Rage triggers mid-combat when enemy survives hit
  const player = makePlayer();
  const ragEnemy = {
    id: "e1",
    name: "Vein Sentinel",
    hp: 18,
    maxHp: 18,
    attack: 4,
    armor: 0,
    effect: "Rage: gains +1 attack each time it takes damage.",
  };
  const encounter = makeEncounter([ragEnemy]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });
  const attacker = { name: "Flesh Crawler", attack: 3, id: "c1" };

  silence();
  combat.attackEnemy("e1", attacker);
  unsilence();

  assert(
    "[combat-8] Rage: enemy survived and attack incremented",
    ragEnemy.attack === 5,
  );
  assert("[combat-8] Rage: HP reduced by 3", ragEnemy.hp === 15);
}

section("combat.js — enemyAttack");

{
  // [combat-9] Blocker fully absorbs attack (attack < defense) — not destroyed
  const blocker = { id: "c1", name: "Bone Shard", attack: 1, defense: 5 };
  const player = makePlayer({ field: [blocker] });
  const enemy = {
    id: "e1",
    name: "Shambling Corpse",
    hp: 6,
    maxHp: 6,
    attack: 3,
    armor: 0,
    effect: null,
  };
  const encounter = makeEncounter([enemy]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  silence();
  combat.enemyAttack(enemy);
  unsilence();

  assert("[combat-9] Player HP unchanged", player.hp === 30);
  assert("[combat-9] Blocker still on field", player.field.length === 1);
}

{
  // [combat-10] Overflow hits player when attack > blocker defense
  const blocker = { id: "c1", name: "Bone Shard", attack: 1, defense: 2 };
  const player = makePlayer({ field: [blocker] });
  const enemy = {
    id: "e1",
    name: "Hound",
    hp: 5,
    maxHp: 5,
    attack: 5,
    armor: 0,
    effect: null,
  };
  const encounter = makeEncounter([enemy]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  silence();
  combat.enemyAttack(enemy);
  unsilence();

  // overflow = 5 − 2 = 3; player HP = 30 − 3 = 27
  assert("[combat-10] Player takes 3 overflow damage", player.hp === 27);
  assert("[combat-10] Blocker destroyed", player.field.length === 0);
}

{
  // [combat-11] Direct hit when field is empty
  const player = makePlayer({ field: [] });
  const enemy = {
    id: "e1",
    name: "Hound",
    hp: 5,
    maxHp: 5,
    attack: 4,
    armor: 0,
    effect: null,
  };
  const encounter = makeEncounter([enemy]);
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  silence();
  combat.enemyAttack(enemy);
  unsilence();

  assert("[combat-11] Direct hit: player HP = 26", player.hp === 26);
}

// ─── data/shopLogic.js ───────────────────────────────────────────────────────

section("shopLogic.js — generateShopInventory");

const mockCards = [
  { id: "m1", name: "Minion A", tier: "minion", archetype: "blood-flesh" },
  { id: "m2", name: "Minion B", tier: "minion", archetype: "undead-bone" },
  { id: "w1", name: "Warrior A", tier: "warrior", archetype: "blood-flesh" },
  { id: "w2", name: "Warrior B", tier: "warrior", archetype: "undead-bone" },
  { id: "ch1", name: "Champion A", tier: "champion", archetype: "blood-flesh" },
];

{
  // [shop-1] Returns correct item count (size param)
  const player = makePlayer();
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  const inv = shopSys.generateShopInventory(1, 4);
  unsilence();

  assert("[shop-1] Inventory size === 4", inv.length === 4);
}

{
  // [shop-2] Each item has card and price fields
  const player = makePlayer();
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  const inv = shopSys.generateShopInventory(1, 3);
  unsilence();

  const allValid = inv.every(
    (item) => item.card && typeof item.price === "number",
  );
  assert("[shop-2] Every item has card + numeric price", allValid);
}

{
  // [shop-3] Act 1 only returns minion/warrior tier cards
  const player = makePlayer();
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  const inv = shopSys.generateShopInventory(1, 20);
  unsilence();

  const allAllowed = inv.every(
    (item) => item.card.tier === "minion" || item.card.tier === "warrior",
  );
  assert("[shop-3] Act 1: only minion/warrior tiers present", allAllowed);
}

section("shopLogic.js — openShop");

{
  // [shop-4] openShop populates shop.inventory
  const player = makePlayer();
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  shopSys.openShop(1);
  unsilence();

  assert(
    "[shop-4] shop.inventory populated after openShop",
    shop.inventory.length > 0,
  );
}

section("shopLogic.js — buyCard");

{
  // [shop-5] Deducts marrow and adds card to run.collection
  const player = makePlayer({ marrow: 10 });
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  shopSys.openShop(1);
  const result = shopSys.buyCard(0);
  unsilence();

  assert("[shop-5] buyCard returns true", result === true);
  assert("[shop-5] Card added to run.collection", run.collection.length === 1);
  assert("[shop-5] Marrow deducted", player.marrow < 10);
}

{
  // [shop-6] Fails when insufficient marrow
  const player = makePlayer({ marrow: 0 });
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  shopSys.openShop(1);
  const result = shopSys.buyCard(0);
  unsilence();

  assert("[shop-6] buyCard returns false with no marrow", result === false);
  assert("[shop-6] Collection unchanged", run.collection.length === 0);
}

{
  // [shop-7] Marks item as sold, blocks double-buy
  const player = makePlayer({ marrow: 50 });
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  shopSys.openShop(1);
  shopSys.buyCard(0); // first buy
  const result = shopSys.buyCard(0); // double buy
  unsilence();

  assert("[shop-7] Double-buy returns false", result === false);
  assert("[shop-7] Collection has only 1 card", run.collection.length === 1);
}

section("shopLogic.js — refreshShop");

{
  // [shop-8] Deducts refreshCost and regenerates inventory
  const player = makePlayer({ marrow: 10 });
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  shopSys.openShop(1);
  const beforeMarrow = player.marrow;
  shopSys.refreshShop(1);
  unsilence();

  assert(
    "[shop-8] Marrow deducted by refreshCost",
    player.marrow === beforeMarrow - 3,
  );
  assert(
    "[shop-8] Inventory still populated after refresh",
    shop.inventory.length > 0,
  );
}

{
  // [shop-9] Fails when insufficient marrow
  const player = makePlayer({ marrow: 2 });
  const run = { collection: [] };
  const shop = { inventory: [], refreshCost: 3 };
  const shopSys = createShopSystem({ player, run, cards: mockCards, shop });

  silence();
  shopSys.openShop(1);
  const beforeMarrow = player.marrow;
  shopSys.refreshShop(1);
  unsilence();

  assert(
    "[shop-9] Marrow unchanged when refresh fails",
    player.marrow === beforeMarrow,
  );
}

// ─── data/status-effects.js ──────────────────────────────────────────────────

section("status-effects.js — exported methods");

{
  // [status-1] drainBlood exported and reduces blood
  const player = makePlayer({ blood: 6 });
  const costSys = createCostSystem({ player, onEndRun: () => {} });

  silence();
  const drained = costSys.drainBlood(3);
  unsilence();

  assert(
    "[status-1] drainBlood exported (not undefined)",
    typeof costSys.drainBlood === "function",
  );
  assert("[status-1] Blood reduced to 3", player.blood === 3);
  assert("[status-1] drainBlood returns amount drained", drained === 3);
}

{
  // [status-2] drainBlood cannot reduce below 0
  const player = makePlayer({ blood: 2 });
  const costSys = createCostSystem({ player, onEndRun: () => {} });

  silence();
  const drained = costSys.drainBlood(10);
  unsilence();

  assert("[status-2] Blood floored at 0", player.blood === 0);
  assert("[status-2] Returns only what was available", drained === 2);
}

{
  // [status-3] addBlood exported and increases blood
  const player = makePlayer({ blood: 3 });
  const costSys = createCostSystem({ player, onEndRun: () => {} });

  silence();
  costSys.addBlood(4);
  unsilence();

  assert(
    "[status-3] addBlood exported (not undefined)",
    typeof costSys.addBlood === "function",
  );
  assert("[status-3] Blood increased to 7", player.blood === 7);
}

{
  // [status-4] addBlood caps at maxBlood
  const player = makePlayer({ blood: 8, maxBlood: 10 });
  const costSys = createCostSystem({ player, onEndRun: () => {} });

  silence();
  costSys.addBlood(5);
  unsilence();

  assert("[status-4] Blood capped at maxBlood (10)", player.blood === 10);
}

{
  // [status-5] applyBleedToPlayer exported and sets stacks/duration
  const player = makePlayer();
  const costSys = createCostSystem({ player, onEndRun: () => {} });

  silence();
  costSys.applyBleedToPlayer(2, 3);
  unsilence();

  assert(
    "[status-5] applyBleedToPlayer exported",
    typeof costSys.applyBleedToPlayer === "function",
  );
  assert("[status-5] bleedStacks set to 2", player.statuses.bleedStacks === 2);
  assert(
    "[status-5] bleedTurnsRemaining set to 3",
    player.statuses.bleedTurnsRemaining === 3,
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n══════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log("All tests passed ✓");
} else {
  console.log("Fix the failures above before committing.");
  process.exit(1);
}
