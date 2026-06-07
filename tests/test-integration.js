// tests/test-integration.js
// Run with: node tests/test-integration.js
// Integration test — boots main.js systems through their real factory wiring
// and confirms shared state objects are mutated correctly across system boundaries.

"use strict";

// ─── Silence main.js boot noise ──────────────────────────────────────────────
const _log = console.log;
const _err = console.error;
function silence() {
  console.log = () => {};
}
function unsilence() {
  console.log = _log;
}

// ─── Tiny test runner ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    _log(`  ✓ ${label}`);
    passed++;
  } else {
    _err(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function section(name) {
  _log(`\n── ${name} ──`);
}

// ─── Boot real systems from main.js ──────────────────────────────────────────
// We require the real data modules and replicate the exact factory wiring
// from main.js so we're testing the real integration surface, not stubs.

const { createDeckSystem, STARTING_DECKS, cards } = require("../data/cards");
const { createCombatSystem } = require("../data/combat");
const { createCostSystem } = require("../data/status-effects");
const { createEffectSystem } = require("../data/effects");
const { createShopSystem } = require("../data/shopLogic");
const { createMapSystem } = require("../data/map");

// ─── Shared state (mirrors main.js exactly) ──────────────────────────────────

function freshPlayer() {
  return {
    hp: 30,
    maxHp: 30,
    blood: 0,
    maxBlood: 10,
    marrow: 0,
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
  };
}

function freshRun(archetype) {
  return {
    collection: [],
    curses: [],
    artifacts: [],
    discoveredHints: [],
    archetypes: null,
    archetype,
  };
}

function freshEncounter(enemies = []) {
  return { enemies, turn: 0, active: false };
}

function freshShop() {
  return { inventory: [], refreshCost: 3 };
}

// ─── startRun / resetMatch ───────────────────────────────────────────────────

section("startRun + resetMatch — player and deck state");

{
  const player = freshPlayer();
  const run = freshRun(null);
  const encounter = freshEncounter();
  const shop = freshShop();
  let runEnded = false;

  const costSystem = createCostSystem({
    player,
    onEndRun: () => {
      runEnded = true;
    },
  });
  const effectSystem = createEffectSystem({
    player,
    run,
    encounter,
    costSystem,
  });
  const deckSystem = createDeckSystem({
    player,
    run,
    cards,
    costSystem,
    effectSystem,
  });

  // Seed run.collection with blood-flesh starting deck (mirrors startRun)
  silence();
  const deckIds = STARTING_DECKS["blood-flesh"];
  deckIds.forEach((id) => {
    const card = deckSystem.getCardById(id);
    if (card) run.collection.push(card);
  });

  // mirrors resetMatch
  player.field = [];
  player.hand = [];
  player.deck = [];
  player.discard = [];
  deckSystem.buildDeck();
  deckSystem.dealOpeningHand();
  costSystem.resetMilestones();
  unsilence();

  assert(
    "Starting collection seeded from STARTING_DECKS",
    run.collection.length > 0,
  );
  assert("buildDeck: deck is non-empty", player.deck.length > 0);
  assert("dealOpeningHand: hand has cards", player.hand.length > 0);
  assert("Player HP is 30 after reset", player.hp === 30);
  assert("Player pain is 0 after reset", player.pain === 0);
  assert("Player blood is 0 after reset", player.blood === 0);
}

// ─── costSystem ↔ deckSystem: playCard routes effect correctly ───────────────

section("costSystem ↔ deckSystem — bf_ritual_01 (Bloodletting Rite)");

{
  const player = freshPlayer();
  const run = freshRun("blood-flesh");
  const encounter = freshEncounter();
  const shop = freshShop();

  const costSystem = createCostSystem({ player, onEndRun: () => {} });
  const effectSystem = createEffectSystem({
    player,
    run,
    encounter,
    costSystem,
  });
  const deckSystem = createDeckSystem({
    player,
    run,
    cards,
    costSystem,
    effectSystem,
  });

  silence();
  const deckIds = STARTING_DECKS["blood-flesh"];
  deckIds.forEach((id) => {
    const card = deckSystem.getCardById(id);
    if (card) run.collection.push(card);
  });
  player.field = [];
  player.hand = [];
  player.deck = [];
  player.discard = [];
  deckSystem.buildDeck();
  unsilence();

  const ritual = deckSystem.getCardById("bf_ritual_01");
  assert("bf_ritual_01 found in card data", !!ritual);

  if (ritual) {
    player.hand.push(ritual);
    const hpBefore = player.hp;
    const painBefore = player.pain;
    const bloodBefore = player.blood;

    silence();
    deckSystem.playCard(ritual);
    unsilence();

    // Bloodletting Rite: pay 3 HP, gain 3 Blood, gain 1 Pain
    assert("ritual: HP reduced (self-damage cost paid)", player.hp < hpBefore);
    assert("ritual: Blood increased", player.blood > bloodBefore);
    assert("ritual: Pain increased", player.pain > painBefore);
    assert(
      "ritual: card left hand after play",
      !player.hand.find((c) => c.id === "bf_ritual_01"),
    );
  }
}

section("costSystem ↔ deckSystem — ub_sacrifice_01 (Bone Harvest)");

{
  const player = freshPlayer();
  const run = freshRun("undead-bone");
  const encounter = freshEncounter();
  const shop = freshShop();

  const costSystem = createCostSystem({ player, onEndRun: () => {} });
  const effectSystem = createEffectSystem({
    player,
    run,
    encounter,
    costSystem,
  });
  const deckSystem = createDeckSystem({
    player,
    run,
    cards,
    costSystem,
    effectSystem,
  });

  silence();
  const deckIds = STARTING_DECKS["undead-bone"];
  deckIds.forEach((id) => {
    const card = deckSystem.getCardById(id);
    if (card) run.collection.push(card);
  });
  player.field = [];
  player.hand = [];
  player.deck = [];
  player.discard = [];
  deckSystem.buildDeck();
  unsilence();

  const fodder = deckSystem.getCardById("ub_minion_02");
  const boneShard = deckSystem.getCardById("ub_minion_01");
  const sacrifice = deckSystem.getCardById("ub_sacrifice_01");

  assert("ub_sacrifice_01 found", !!sacrifice);
  assert("fodder minion found", !!fodder);

  if (sacrifice && fodder && boneShard) {
    player.field.push(fodder);
    player.deck.push(boneShard);
    player.hand.push(sacrifice);

    const marrowBefore = player.marrow;
    const fieldBefore = player.field.length;

    silence();
    deckSystem.playCard(sacrifice);
    unsilence();

    // Bone Harvest: sacrifice field minion → gain Marrow + draw a card
    assert("sacrifice: Marrow increased", player.marrow > marrowBefore);
    assert(
      "sacrifice: field minion removed",
      player.field.length < fieldBefore,
    );
    assert(
      "sacrifice: card left hand",
      !player.hand.find((c) => c.id === "ub_sacrifice_01"),
    );
  }
}

// ─── combatSystem — shared state mutation ────────────────────────────────────

section("combatSystem — shared player/encounter state");

{
  const player = freshPlayer();
  const encounter = freshEncounter();

  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  const enemy = {
    id: "e1",
    name: "Shambling Corpse",
    hp: 8,
    maxHp: 8,
    attack: 3,
    armor: 0,
    effect: null,
  };
  encounter.enemies = [{ ...enemy, intentIndex: 0 }];
  encounter.active = true;

  const attackerCard = { id: "c1", name: "Flesh Crawler", attack: 4 };

  silence();
  combat.attackEnemy("e1", attackerCard);
  unsilence();

  // 4 attack, 0 armor → enemy takes 4 damage; 8 − 4 = 4
  assert(
    "attackEnemy: enemy HP reduced on shared encounter object",
    encounter.enemies[0].hp === 4,
  );
  assert("attackEnemy: player HP unchanged (no retaliation)", player.hp === 30);
}

{
  // enemyAttack mutates shared player HP
  const player = freshPlayer({ field: [] });
  const encounter = freshEncounter();
  const combat = createCombatSystem({ player, encounter, onEndRun: () => {} });

  const enemy = {
    id: "e1",
    name: "Hound",
    hp: 5,
    maxHp: 5,
    attack: 4,
    armor: 0,
    effect: null,
  };

  silence();
  combat.enemyAttack(enemy);
  unsilence();

  assert(
    "enemyAttack: player HP mutated on shared player object",
    player.hp === 26,
  );
}

// ─── shopSystem — injected shop object ───────────────────────────────────────

section("shopSystem — shop object wired through factory");

{
  const player = freshPlayer({ marrow: 20 });
  const run = freshRun("blood-flesh");
  const shop = freshShop();

  const shopSystem = createShopSystem({ player, run, cards, shop });

  silence();
  shopSystem.openShop(1);
  unsilence();

  assert(
    "openShop: shop.inventory populated on injected shop object",
    shop.inventory.length > 0,
  );
  assert(
    "openShop: every item has card + price",
    shop.inventory.every((i) => i.card && typeof i.price === "number"),
  );

  const marrowBefore = player.marrow;
  silence();
  const bought = shopSystem.buyCard(0);
  unsilence();

  assert("buyCard: returns true with sufficient marrow", bought === true);
  assert("buyCard: card added to run.collection", run.collection.length === 1);
  assert(
    "buyCard: marrow deducted from shared player object",
    player.marrow < marrowBefore,
  );
}

// ─── mapSystem — act1Map loads and resolves ───────────────────────────────────

section("mapSystem — act1Map structure");

{
  silence();
  const mapSystem = createMapSystem();
  unsilence();

  const map = mapSystem.act1Map;
  assert("act1Map exists", !!map);
  assert("act1Map has a currentNodeId", !!map.currentNodeId);
  assert(
    "act1Map has nodes array",
    Array.isArray(map.nodes) && map.nodes.length > 0,
  );

  const startNode = map.nodes.find((n) => n.id === map.currentNodeId);
  assert("startNode exists in nodes", !!startNode);
  assert("startNode has a type", typeof startNode.type === "string");
  assert("startNode is not locked", startNode.locked === false);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

_log(`\n══════════════════════════════`);
_log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  _log("All integration tests passed ✓");
} else {
  _err("Fix the failures above before committing.");
  process.exit(1);
}
