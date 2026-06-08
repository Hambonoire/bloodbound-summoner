console.log("Bloodbound Summoner prototype initialized.");

const { createDeckSystem, STARTING_DECKS, cards } = require("./data/cards");
const { createMapSystem } = require("./data/map");
const { createEnemySystem } = require("./data/enemies");
const { createCombatSystem } = require("./data/combat");
const { createEconomySystem } = require("./data/economy");
const { createCostSystem } = require("./data/status-effects");
const { createEffectSystem } = require("./data/effects");
const { artifacts, getArtifactById } = require("./data/artifacts");
const { createShopSystem } = require("./data/shopLogic");

const game = {
  title: "Bloodbound Summoner",
  genre: "Roguelike card game",
  coreLoop: [
    "Start with a limited deck",
    "Win matches",
    "Choose a random pack reward",
    "Expand your summoning options",
  ],
};

const player = {
  hp: 30,
  maxHp: 30,
  blood: 0,
  maxBlood: 10,
  marrow: 0,
  pain: 0,
  painCap: 40,
  painZone: "cold", // "cold" | "threshold" | "broken"
  apexUnlocked: false,
  summonAttackBonus: 0,
  field: [], // summons currently in play (card objects)
  hand: [], // cards in hand
  deck: [], // remaining draw pile
  discard: [], // discarded cards
  statuses: {
    bleedStacks: 0,
    bleedTurnsRemaining: 0,
  },
};

console.log("Bloodbound Summoner initialized.");
console.log(player);

const run = {
  collection: [],
  curses: [],
  artifacts: [],
  discoveredHints: [],
  archetypes: null,
};

const shop = {
  inventory: [],
  refreshCost: 3,
};

const enemySystem = createEnemySystem();

const encounter = {
  enemies: [],
  turn: 0,
  active: false,
};

const costSystem = createCostSystem({ player, onEndRun: endRun });

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

const combat = createCombatSystem({ player, encounter, onEndRun: endRun });
const shopSystem = createShopSystem({ player, run, cards, shop });
const economySystem = createEconomySystem({
  player,
  run,
  cards,
  drawRandom: deckSystem.drawRandom,
});

const mapSystem = createMapSystem({
  player,
  run,
  cards,
  costSystem,
  economySystem,
  shopSystem,
  shop,
  startEncounter,
  drawRandom: deckSystem.drawRandom,
  getEnemyById: enemySystem.getEnemyById,
});

function startRun(startingArchetype) {
  // Reset run-scoped state on the existing object
  run.collection = [];
  run.curses = [];
  run.artifacts = [];
  run.discoveredHints = [];
  run.archetypes = null;

  // Reset player core stats
  player.hp = 30;
  player.maxHp = 30;
  player.blood = 0;
  player.maxBlood = 10;
  player.marrow = 0;
  player.pain = 0;
  player.painZone = "cold";
  player.apexUnlocked = false;
  player.summonAttackBonus = 0;
  player.field = [];
  player.hand = [];
  player.deck = [];
  player.discard = [];

  // Reset pain milestones
  costSystem.resetMilestones();

  const deckIds = STARTING_DECKS[startingArchetype];

  if (!deckIds) {
    console.log(
      `Unknown starting archetype: ${startingArchetype}. No starting deck seeded.`,
    );
    run.archetype = null;
  } else {
    deckIds.forEach((id) => {
      const card = deckSystem.getCardById(id);
      if (card) {
        run.collection.push(card);
      } else {
        console.log(`Warning: starting deck card ID not found: ${id}`);
      }
    });
    console.log(
      `Starting deck seeded for ${startingArchetype}: ${run.collection.length} cards.`,
    );
    run.archetype = startingArchetype;
  }

  console.log(
    `Run started with archetype: ${startingArchetype}. HP: ${player.hp}, Pain: ${player.pain}, Blood: ${player.blood}, Marrow: ${player.marrow}`,
  );
}

function resetMatch() {
  player.field = [];
  player.hand = [];
  player.deck = [];
  player.discard = [];

  deckSystem.buildDeck();
  deckSystem.dealOpeningHand();

  player.pain = 0;
  player.painZone = "cold";
  costSystem.resetMilestones();

  player.blood = 0;
  player.summonAttackBonus = 0;
  player.apexUnlocked = false;

  encounter.enemies = [];
  encounter.turn = 0;
  encounter.active = false;

  console.log("Match reset. HP carries over:", player.hp);
}

function startMatchForArchetype(archetypeName) {
  const key = String(archetypeName || "").toLowerCase();

  if (key === "blood" || key === "blood-flesh") {
    console.log("Starting Blood/Flesh run...");
    startRun("blood-flesh");
  } else if (key === "bone" || key === "undead-bone" || key === "undead") {
    console.log("Starting Undead/Bone run...");
    startRun("undead-bone");
  } else {
    console.log(`Unknown archetype '${archetypeName}'. Use "blood" or "bone".`);
    return;
  }

  resetMatch();
}

function startMatch() {
  console.log(
    'Choose archetype: "blood" or "bone". Then call startMatchForArchetype("<choice>").',
  );
}

function startEncounter(enemyList) {
  encounter.enemies = enemyList.map((e) => ({
    ...e, // shallow copy
    intentIndex: 0, // track position in this enemy's intent cycle
  }));
  encounter.turn = 0;
  encounter.active = true;
  console.log(
    `--- Encounter started: ${encounter.enemies
      .map((e) => e.name)
      .join(", ")} ---`,
  );
  onCombatStart(); // fire entry triggers
}

function playerTurn(card) {
  if (!encounter.active) return;
  console.log(`-- Player Turn ${encounter.turn + 1} --`);

  // Bleed tick at the start of the player's turn
  if (
    player.statuses &&
    player.statuses.bleedStacks > 0 &&
    player.statuses.bleedTurnsRemaining > 0
  ) {
    console.log(
      `Bleed ticks for ${player.statuses.bleedStacks} damage (${player.statuses.bleedTurnsRemaining} turn(s) remaining).`,
    );
    costSystem.dealSelfDamage(player.statuses.bleedStacks);

    player.statuses.bleedTurnsRemaining -= 1;
    if (player.statuses.bleedTurnsRemaining <= 0) {
      console.log("Bleed has faded.");
      player.statuses.bleedStacks = 0;
      player.statuses.bleedTurnsRemaining = 0;
    }
  }

  deckSystem.playCard(card);
  endPlayerTurn();
}

function logRunArtifacts() {
  if (!run.artifacts || run.artifacts.length === 0) {
    console.log("Artifacts this run: none.");
    return;
  }

  const active = run.artifacts.map((id) => getArtifactById(id)).filter(Boolean);

  if (active.length === 0) {
    console.log("Artifacts this run: unknown IDs only.");
    return;
  }

  const names = active.map((a) => a.name).join(", ");
  console.log(`Artifacts this run: ${names}.`);
}

function endPlayerTurn() {
  deckSystem.endTurnDiscardDownToLimit();
  enemyTurn();
}

function enemyTurn() {
  console.log(`-- Enemy Turn ${encounter.turn + 1} --`);

  for (const enemy of encounter.enemies) {
    if (enemy.hp <= 0) continue;
    executeEnemyIntent(enemy);
  }

  encounter.turn++;
  checkEncounterEnd();
}

function chooseNextIntent(enemy) {
  // If the enemy has an explicit intent list, cycle through it.
  if (Array.isArray(enemy.intents) && enemy.intents.length > 0) {
    const index = enemy.intentIndex || 0;
    const intent = enemy.intents[index];
    enemy.intentIndex = (index + 1) % enemy.intents.length;
    return intent;
  }

  // If there are weights, use weighted random over the intentWeights map.
  if (enemy.intentWeights) {
    const entries = Object.entries(enemy.intentWeights);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    const roll = Math.random() * total;
    let acc = 0;
    for (const [intent, weight] of entries) {
      acc += weight;
      if (roll <= acc) return intent;
    }
  }

  // Fallback: use enemy.intent if present, else default to "attack".
  return enemy.intent || "attack";
}

function executeEnemyIntent(enemy) {
  const intent = chooseNextIntent(enemy);

  console.log(`${enemy.name} prepares to ${intent}.`);

  switch (intent) {
    case "attack":
      combat.enemyAttack(enemy);
      if (
        enemy.effect &&
        enemy.effect.startsWith("On attack: applies Bleed to the player")
      ) {
        costSystem.applyBleedToPlayer(1, 2);
      }
      break;
    case "block":
      enemy.armor += 2;
      console.log(`${enemy.name} braces. Armor: ${enemy.armor}`);
      break;
    case "curse":
      // TODO: implement curse application
      console.log(`${enemy.name} applies a curse. [Effect: ${enemy.effect}]`);
      break;
    case "heal":
      enemy.hp = Math.min(enemy.hp + 3, enemy.maxHp);
      console.log(`${enemy.name} heals. HP: ${enemy.hp}`);
      break;
    default:
      console.log(
        `${enemy.name} hesitates. Unknown intent: ${intent}. Defaulting to attack.`,
      );
      combat.enemyAttack(enemy);
      break;
  }
}

function onCombatStart() {
  // Curse: Blood Debt — lose 2 HP at combat start
  if (run.curses && run.curses.includes("curse_blood_debt")) {
    costSystem.dealSelfDamage(2);
    console.log("[Combat Start] Blood Debt: lost 2 HP.");
  }

  // Artifact: Chalice of Coagulated Blood — gain 2 Blood at combat start
  if (run.artifacts && run.artifacts.includes("artifact_blood_chalice")) {
    costSystem.gainBlood(2);
    console.log("[Combat Start] Blood Chalice: gained 2 Blood.");
  }

  // Relic: Bloodbound Sigil — gain 2 Blood at combat start if Pain >= 10
  // Requires player.relics array (Task 38)
  if (player.relics && player.relics.includes("generic_relic_01")) {
    if (player.pain >= 10) {
      costSystem.gainBlood(2);
      console.log(
        "[Combat Start] Bloodbound Sigil: gained 2 Blood (Pain >= 10).",
      );
    }
  }
}

function checkEncounterEnd() {
  const allDead = encounter.enemies.every((e) => e.hp <= 0);
  if (allDead) {
    encounter.active = false;

    let map = mapSystem.act1Map;

    console.log("--- Encounter won. ---");

    // Mark current map node completed and unlock connections
    if (map && map.currentNodeId) {
      mapSystem.completeNode(map.currentNodeId);
    }

    // Trigger pack reward selection
    // Marrow reward based on enemies
    const baseMarrow = economySystem.calculateMarrowReward(encounter.enemies);

    // Boss-only bonus: +3 Marrow if any boss was present
    const foughtBoss = encounter.enemies.some((e) => e.tier === "boss");
    const bossBonus = foughtBoss ? 3 : 0;

    const totalMarrow = baseMarrow + bossBonus;
    economySystem.earnMarrow(totalMarrow);

    console.log(
      `Combat reward: +${baseMarrow} Marrow` +
        (bossBonus ? ` (+${bossBonus} boss bonus)` : "") +
        `. Total: ${totalMarrow}`,
    );

    // Pack rewards (for now, pass a simple archetype tag; adjust later)
    const packArchetype = run.archetype || "blood-flesh";
    const packOptions = economySystem.offerPackRewards(packArchetype);

    console.log(
      "--- Choose a pack by index with selectPack(packOptions, index) ---",
    );

    return;
  }

  if (player.hp <= 0) {
    encounter.active = false;
  }
}

function endRun(reason) {
  console.log(`Run ended. Reason: ${reason}`);
  // TODO: hook into run reset / game over screen
}

/*

--> insert start sequence here...
*/

console.log("\n=== TEST: Bloodletting Rite ===");
startMatchForArchetype("blood");

const ritual = deckSystem.getCardById("bf_ritual_01");
player.hand.push(ritual);
deckSystem.playCard(ritual);

console.log("After Bloodletting Rite:", {
  hp: player.hp,
  pain: player.pain,
  blood: player.blood,
  hand: player.hand.map((c) => c.id),
  field: player.field.map((c) => c.id),
});

console.log("\n=== TEST: Bone Harvest ===");
startMatchForArchetype("bone");

const fodder = deckSystem.getCardById("ub_minion_02");
player.field.push(fodder);

const boneShard = deckSystem.getCardById("ub_minion_01");
player.deck.push(boneShard);

const boneHarvest = deckSystem.getCardById("ub_sacrifice_01");
player.hand.push(boneHarvest);
deckSystem.playCard(boneHarvest);

console.log("After Bone Harvest:", {
  marrow: player.marrow,
  hand: player.hand.map((c) => c.id),
  field: player.field.map((c) => c.id),
  deck: player.deck.map((c) => c.id),
  discard: player.discard.map((c) => c.id),
});

console.log(game);
