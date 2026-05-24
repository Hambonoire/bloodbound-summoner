console.log("Bloodbound Summoner prototype initialized.");

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
};

console.log("Bloodbound Summoner initialized.");
console.log(player);

function playCard(card) {
  if (!canAfford(card)) {
    console.log(`Cannot afford: ${card.name}`);
    return false;
  }

  payCost(card);
  applyEffect(card);

  if (card.type === "summon") {
    player.field.push(card);
    console.log(
      `Summoned: ${card.name} | ATK: ${card.attack + player.summonAttackBonus} | DEF: ${card.defense}`,
    );
  }

  discardCard(card.id);

  return true;
}

function canAfford(card) {
  const c = card.cost;
  if (c.hp && player.hp - c.hp <= 0) return false;
  if (c.blood && player.blood < c.blood) return false;
  if (c.marrow && player.marrow < c.marrow) return false;
  if (c.sacrifice && player.field.length < c.sacrifice) return false;
  return true;
}

function payCost(card) {
  const c = card.cost;

  if (c.hp) {
    dealSelfDamage(c.hp);
  }
  if (c.blood) {
    spendBlood(c.blood);
  }
  if (c.marrow) {
    player.marrow -= c.marrow;
  }
  if (c.sacrifice) {
    // sacrifices the last summon on the field for now
    // TODO: let player choose which summon to sacrifice
    const sacrificed = player.field.splice(
      player.field.length - c.sacrifice,
      c.sacrifice,
    );
    console.log(`Sacrificed: ${sacrificed.map((s) => s.name).join(", ")}`);
  }
}

function applyEffect(card) {
  if (!card.effect) return;
  // effects are strings for now — log and handle manually until effect system is built
  console.log(`Effect triggered [${card.name}]: ${card.effect}`);
}

function dealSelfDamage(amount) {
  player.hp -= amount;
  player.pain += amount;
  gainBlood(amount);
  updatePainZone();
  console.log(
    `Self-damage: ${amount} | HP: ${player.hp} | Pain: ${player.pain} | Blood: ${player.blood}`,
  );

  if (player.hp <= 0) {
    endRun("broken-by-damage");
    return;
  }
}

function gainBlood(amount) {
  const rate = player.painZone === "threshold" ? 2 : 1;
  player.blood = Math.min(player.blood + amount * rate, player.maxBlood);
}

function spendBlood(amount) {
  if (player.blood < amount) {
    console.log(`Not enough Blood. Have: ${player.blood}, need: ${amount}`);
    return false;
  }
  player.blood -= amount;
  console.log(`Spent ${amount} Blood | Blood: ${player.blood}`);
  return true;
}

function addBlood(amount) {
  const prev = player.blood;
  player.blood = Math.min(player.blood + amount, player.maxBlood);
  const gained = player.blood - prev;
  if (gained < amount) {
    console.log(
      `Blood pool full. Gained ${gained} of ${amount} | Blood: ${player.blood}`,
    );
  } else {
    console.log(`Gained ${amount} Blood | Blood: ${player.blood}`);
  }
}

function updatePainZone() {
  const prev = player.painZone;

  if (player.pain >= player.painCap) {
    player.painZone = "broken";
    endRun("broken-by-pain");
    return;
  } else if (player.pain >= 10) {
    player.painZone = "threshold";
  } else {
    player.painZone = "cold";
  }

  if (prev !== player.painZone) {
    onPainZoneChange(prev, player.painZone);
  }

  checkPainMilestones();
}

const triggeredMilestones = new Set();

function checkPainMilestones() {
  if (player.pain >= 10 && !triggeredMilestones.has(10)) {
    triggeredMilestones.add(10);
    console.log("MILESTONE 10: Blood generation doubled.");
  }
  if (player.pain >= 20 && !triggeredMilestones.has(20)) {
    triggeredMilestones.add(20);
    player.apexUnlocked = true;
    console.log("MILESTONE 20: Apex cards unlocked.");
  }
  if (player.pain >= 30 && !triggeredMilestones.has(30)) {
    triggeredMilestones.add(30);
    player.summonAttackBonus += 1;
    console.log("MILESTONE 30: All summons gain +1 attack.");
  }
}

function onPainZoneChange(from, to) {
  console.log(`Pain zone: ${from} → ${to}`);
}

function endRun(reason) {
  console.log(`Run ended. Reason: ${reason}`);
  // TODO: hook into run reset / game over screen
}

const encounter = {
  enemies: [],
  turn: 0,
  active: false,
};

function startEncounter(enemyList) {
  encounter.enemies = enemyList.map((e) => ({ ...e })); // shallow copy
  encounter.turn = 0;
  encounter.active = true;
  console.log(
    `--- Encounter started: ${encounter.enemies.map((e) => e.name).join(", ")} ---`,
  );
}

function playerTurn(card) {
  if (!encounter.active) return;
  console.log(`-- Player Turn ${encounter.turn + 1} --`);
  playCard(card);
  endPlayerTurn();
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

function executeEnemyIntent(enemy) {
  switch (enemy.intent) {
    case "attack":
      enemyAttack(enemy);
      break;
    case "block":
      enemy.armor += 2;
      console.log(`${enemy.name} braces. Armor: ${enemy.armor}`);
      break;
    case "curse":
      console.log(`${enemy.name} applies a curse. [Effect: ${enemy.effect}]`);
      // TODO: implement curse application
      break;
    case "heal":
      enemy.hp = Math.min(enemy.hp + 3, enemy.maxHp);
      console.log(`${enemy.name} heals. HP: ${enemy.hp}`);
      break;
  }
}

function enemyAttack(enemy) {
  let damage = enemy.attack;

  // find the highest defense summon on the field
  if (player.field.length > 0) {
    const blocker = player.field.reduce(
      (best, s) => (s.defense > best.defense ? s : best),
      player.field[0],
    );

    const overflow = damage - blocker.defense;
    console.log(
      `${enemy.name} attacks ${blocker.name} (DEF: ${blocker.defense})`,
    );

    if (overflow > 0) {
      console.log(`Overflow damage: ${overflow} hits player directly.`);
      player.hp -= overflow;
      console.log(`Player HP: ${player.hp}`);
    } else {
      console.log(`Attack fully absorbed by ${blocker.name}.`);
    }

    // destroy blocker if attack meets or exceeds its defense
    if (damage >= blocker.defense) {
      player.field = player.field.filter((s) => s.id !== blocker.id);
      console.log(`${blocker.name} destroyed.`);
    }
  } else {
    // no summons — direct damage to player
    player.hp -= damage;
    console.log(
      `${enemy.name} attacks player directly for ${damage}. HP: ${player.hp}`,
    );
  }

  if (player.hp <= 0) endRun("hp-depleted");
}

function attackEnemy(enemyId, attackerCard) {
  const enemy = encounter.enemies.find((e) => e.id === enemyId);
  if (!enemy || enemy.hp <= 0) return;

  const totalAttack = attackerCard.attack + player.summonAttackBonus;
  let damage = totalAttack;

  if (enemy.armor > 0) {
    const absorbed = Math.min(enemy.armor, damage);
    enemy.armor -= absorbed;
    damage -= absorbed;
    console.log(`Armor absorbed ${absorbed}. Remaining armor: ${enemy.armor}`);
  }

  enemy.hp -= damage;
  console.log(
    `${attackerCard.name} attacks ${enemy.name} for ${damage}. Enemy HP: ${enemy.hp}`,
  );

  if (enemy.hp <= 0) {
    console.log(`${enemy.name} defeated.`);
  }
}

function checkEncounterEnd() {
  const allDead = encounter.enemies.every((e) => e.hp <= 0);
  if (allDead) {
    encounter.active = false;
    console.log("--- Encounter won. ---");
    // TODO: trigger pack reward selection
  }
  if (player.hp <= 0) {
    encounter.active = false;
  }
}

function resetMatch() {
  // field, hand, discard reset
  player.field = [];
  buildDeck();
  dealOpeningHand();

  // Pain meter reset
  player.pain = 0;
  player.painZone = "cold";
  triggeredMilestones.clear();

  // Blood resets to 0 between matches
  player.blood = 0;

  // summon attack bonus resets
  player.summonAttackBonus = 0;

  // apex lock resets
  player.apexUnlocked = false;

  // encounter resets
  encounter.enemies = [];
  encounter.turn = 0;
  encounter.active = false;

  console.log("Match reset. HP carries over:", player.hp);
}

function startRun(startingArchetype) {
  // Reset player core stats
  player.hp = 30;
  player.maxHp = 30;
  player.blood = 0;
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
  triggeredMilestones.clear();

  // Reset run-scoped state
  run.collection = [];
  run.curses = [];
  run.artifacts = [];
  run.discoveredHints = [];

  // TODO (Task 18): seed starting deck into run.collection based on startingArchetype
  const deckIds = STARTING_DECKS[startingArchetype];
  if (!deckIds) {
    console.log(
      `Unknown starting archetype: ${startingArchetype}. No starting deck seeded.`,
    );
  } else {
    deckIds.forEach((id) => {
      const card = getCardById(id);
      if (card) {
        run.collection.push(card);
      } else {
        console.log(`Warning: starting deck card ID not found: ${id}`);
      }
    });
    console.log(
      `Starting deck seeded for ${startingArchetype}: ${run.collection.length} cards.`,
    );
  }

  console.log(
    `Run started with archetype: ${startingArchetype}. HP: ${player.hp}, Pain: ${player.pain}, Blood: ${player.blood}, Marrow: ${player.marrow}`,
  );
}

const STARTING_DECKS = {
  "blood-flesh": [
    "bf_minion_01",
    "bf_minion_01",
    "bf_minion_02",
    "bf_minion_02",
    "bf_minion_03",
    "bf_warrior_01",
    "bf_warrior_01",
    "bf_warrior_02",
    "bf_warrior_02",
    "bf_warrior_03",
  ],
  "undead-bone": [
    "ub_minion_01",
    "ub_minion_01",
    "ub_minion_02",
    "ub_minion_02",
    "ub_minion_03",
    "ub_warrior_01",
    "ub_warrior_01",
    "ub_warrior_02",
    "ub_warrior_02",
    "ub_warrior_03",
  ],
};

const run = {
  collection: [],
  curses: [],
  artifacts: [],
  discoveries: [],
};

function generatePack(type, archetype = null) {
  const pool =
    type === "rogue"
      ? cards.filter((c) => c.tier === "minion" || c.tier === "warrior")
      : cards.filter((c) => c.archetype === archetype);

  const pack = {
    type,
    archetype: archetype || "generic",
    cards: drawRandom(pool, 3),
    bonus: generatePackBonus(type),
  };

  return pack;
}

function generatePackBonus(type) {
  if (type === "rogue") {
    // low chance of a rare card drop
    const rareRoll = Math.random();
    if (rareRoll < 0.2) {
      const rarePool = cards.filter(
        (c) => c.tier === "champion" || c.tier === "apex",
      );
      const rare = drawRandom(rarePool, 1);
      if (rare.length) return { type: "rare-card", card: rare[0] };
    }
    return { type: "marrow", amount: rollMarrow(2, 5) };
  }
  return { type: "marrow", amount: rollMarrow(1, 3) };
}

function offerPackRewards(wonEncounterArchetype) {
  const options = [
    generatePack("archetype", wonEncounterArchetype),
    generatePack("archetype", wonEncounterArchetype),
    generatePack("rogue"),
  ];

  console.log("--- Pack Rewards ---");
  options.forEach((pack, i) => {
    const names = pack.cards.map((c) => c.name).join(", ");
    const bonus =
      pack.bonus.type === "rare-card"
        ? `Rare: ${pack.bonus.card.name}`
        : `Marrow: ${pack.bonus.amount}`;
    console.log(
      `[${i}] ${pack.type} (${pack.archetype}) | Cards: ${names} | Bonus: ${bonus}`,
    );
  });

  return options;
}

function selectPack(options, index) {
  const chosen = options[index];
  if (!chosen) {
    console.log("Invalid selection.");
    return;
  }

  run.collection.push(...chosen.cards);
  if (chosen.bonus.type === "marrow") earnMarrow(chosen.bonus.amount);

  if (chosen.bonus.type === "rare-card") {
    run.collection.push(chosen.bonus.card);
    console.log(`Rare card added: ${chosen.bonus.card.name}`);
  }

  console.log(
    `Pack selected. Cards added: ${chosen.cards.map((c) => c.name).join(", ")}`,
  );
  console.log(
    `Marrow: ${player.marrow} | Collection size: ${run.collection.length}`,
  );
}

// --- Helpers ---

function drawRandom(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getCardById(id) {
  return cards.find((c) => c.id === id) || null;
}

function rollMarrow(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function earnMarrow(amount) {
  player.marrow += amount;
  console.log(`Earned ${amount} Marrow | Marrow: ${player.marrow}`);
}

function spendMarrow(amount) {
  if (player.marrow < amount) {
    console.log(`Not enough Marrow. Have: ${player.marrow}, need: ${amount}`);
    return false;
  }
  player.marrow -= amount;
  console.log(`Spent ${amount} Marrow | Marrow: ${player.marrow}`);
  return true;
}

function getNode(id) {
  return act1Map.nodes.find((n) => n.id === id);
}

function completeNode(id) {
  const node = getNode(id);
  if (!node) return;

  node.completed = true;

  // check for secret discovery
  if (node.secret && !node.secret.discovered) {
    discoverSecret(node);
  }

  // unlock connected nodes
  node.connections.forEach((connId) => {
    const next = getNode(connId);
    if (next) {
      next.locked = false;
      console.log(`Node unlocked: ${next.title}`);
    }
  });

  act1Map.currentNodeId = id;
  console.log(`Node completed: ${node.title}`);
}

function discoverSecret(node) {
  node.secret.discovered = true;
  run.discoveredHints = run.discoveredHints || [];
  run.discoveredHints.push(node.secret.hintId);
  console.log(`Secret discovered — ${node.secret.hint}`);
  console.log(`Hints found this run: ${run.discoveredHints.length}`);
}

function travelToNode(id) {
  const node = getNode(id);
  if (!node) {
    console.log("Node not found.");
    return;
  }
  if (node.locked) {
    console.log(`${node.title} is locked.`);
    return;
  }
  act1Map.currentNodeId = id;
  console.log(`Traveling to: ${node.title} [${node.type}]`);
}

// --- Draw System + Draw / Field Limits + Discard Penalty ---

const HAND_SIZE = 5;
const MAX_HAND_SIZE = 7;
const MAX_FIELD_SIZE = 5;
const FORCED_DISCARD_BLOOD_DRAIN = 2;

function canPlayCard(card) {
  if (card.type === "summon" && player.field.length >= MAX_FIELD_SIZE) {
    console.log(`Field is full. Cannot summon: ${card.name}`);
    return false;
  }
  if (card.apexLocked && !player.apexUnlocked) {
    console.log(`${card.name} requires Apex unlock (Pain milestone 20).`);
    return false;
  }

  return canAfford(card);
}

function playCard(card) {
  if (!canPlayCard(card)) {
    console.log(`Cannot play: ${card.name}`);
    return false;
  }

  payCost(card);
  applyEffect(card);

  if (card.type === "summon") {
    player.field.push(card);
    console.log(
      `Summoned: ${card.name} | ATK: ${card.attack + player.summonAttackBonus} | DEF: ${card.defense} | Field: ${player.field.length}/${MAX_FIELD_SIZE}`,
    );
  }

  discardCard(card.id);

  return true;
}

function drainBlood(amount) {
  const drained = Math.min(player.blood, amount);
  player.blood -= drained;
  console.log(`Blood drained: ${drained} | Blood: ${player.blood}`);
  return drained;
}

function endTurnDiscardDownToLimit() {
  if (player.hand.length <= MAX_HAND_SIZE) return;

  console.log(
    `Hand exceeds limit (${player.hand.length}/${MAX_HAND_SIZE}). Discarding down to cap...`,
  );

  while (player.hand.length > MAX_HAND_SIZE) {
    const card = player.hand[player.hand.length - 1];
    console.log(`Forced discard: ${card.name}`);
    discardCard(card.id);
    drainBlood(FORCED_DISCARD_BLOOD_DRAIN);
  }
}

function endPlayerTurn() {
  endTurnDiscardDownToLimit();
  enemyTurn();
}

function buildDeck() {
  player.deck = shuffle([...run.collection]);
  player.hand = [];
  player.discard = [];
  console.log(`Deck built. ${player.deck.length} cards.`);
}

function dealOpeningHand() {
  for (let i = 0; i < HAND_SIZE; i++) {
    drawCard();
  }
  console.log(
    `Opening hand dealt: ${player.hand.map((c) => c.name).join(", ")}`,
  );
}

function drawCard() {
  if (player.deck.length === 0) {
    if (player.discard.length === 0) {
      console.log("No cards left to draw.");
      return null;
    }
    reshuffleDeck();
  }

  const card = player.deck.pop();
  player.hand.push(card);
  console.log(`Drew: ${card.name} | Hand: ${player.hand.length}`);
  return card;
}

function reshuffleDeck() {
  player.deck = shuffle([...player.discard]);
  player.discard = [];
  console.log(`Deck reshuffled from discard. ${player.deck.length} cards.`);
}

function discardCard(cardId) {
  const index = player.hand.findIndex((c) => c.id === cardId);
  if (index === -1) {
    console.log("Card not in hand.");
    return;
  }
  const card = player.hand.splice(index, 1)[0];
  player.discard.push(card);
  console.log(`Discarded: ${card.name} | Hand: ${player.hand.length}`);
}

function discardHand() {
  player.discard.push(...player.hand);
  player.hand = [];
  console.log("Full hand discarded.");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// -- Draw System End --

// --- Shop ---

const shop = {
  inventory: [],
  refreshCost: 3,
};

function openShop() {
  shop.inventory = generateShopInventory();
  console.log("--- Shop ---");
  shop.inventory.forEach((item, i) => {
    console.log(
      `[${i}] ${item.card.name} (${item.card.tier} / ${item.card.archetype}) | Cost: ${item.price} Marrow`,
    );
  });
  console.log(`Marrow: ${player.marrow}`);
}

function generateShopInventory() {
  const pool = cards.filter((c) => c.tier === "minion" || c.tier === "warrior");
  return drawRandom(pool, 4).map((card) => ({
    card,
    price: shopPrice(card),
    sold: false,
  }));
}

function shopPrice(card) {
  const base = { minion: 4, warrior: 7, champion: 12, apex: 20 };
  return base[card.tier] ?? 5;
}

function buyCard(index) {
  const item = shop.inventory[index];

  if (!item) {
    console.log("Invalid selection.");
    return false;
  }
  if (item.sold) {
    console.log("Already sold.");
    return false;
  }
  if (!spendMarrow(item.price)) return false;

  item.sold = true;
  run.collection.push(item.card);
  console.log(
    `Purchased: ${item.card.name} | Marrow: ${player.marrow} | Collection: ${run.collection.length}`,
  );
  return true;
}

function refreshShop() {
  if (!spendMarrow(shop.refreshCost)) return;
  shop.inventory = generateShopInventory();
  console.log("Shop refreshed.");
  openShop();
}

// -- Shop End --

// --- Node Resolution ---

function resolveNode(nodeId) {
  const node = getNode(nodeId);
  if (!node) {
    console.log("Node not found.");
    return;
  }
  if (node.locked) {
    console.log(`${node.title} is locked.`);
    return;
  }
  if (node.completed) {
    console.log(`${node.title} already completed.`);
    return;
  }

  switch (node.type) {
    case "ritual":
      resolveRitual(node);
      break;
    case "rest":
      resolveRest(node);
      break;
    case "curse":
      resolveCurse(node);
      break;
    case "mystery":
      resolveMystery(node);
      break;
    case "gatekeeper":
      resolveGatekeeper(node);
      break;
    default:
      console.log(`No resolver for node type: ${node.type}`);
  }
}

function resolveGatekeeper(node) {
  const requiredArtifacts = node.requiredArtifacts || [];

  if (requiredArtifacts.length === 0) {
    console.log(`${node.title}: No artifact requirement. Passing through.`);
    completeNode(node.id);
    return;
  }

  const missing = requiredArtifacts.filter((id) => !run.artifacts.includes(id));

  if (missing.length > 0) {
    console.log(
      `${node.title}: BLOCKED — missing artifact(s): ${missing.join(", ")}`,
    );
    return;
  }

  console.log(`${node.title}: Artifacts verified. Gate opens.`);
  completeNode(node.id);
}

function resolveRitual(node) {
  // Player pays HP for a card reward or Marrow. Two fixed options per the design doc.
  const hpCost = 5;
  if (player.hp - hpCost <= 0) {
    console.log(`${node.title}: Cannot pay ritual cost — would be lethal.`);
    return;
  }

  dealSelfDamage(hpCost);

  // Reward: add a random card from the pool to run.collection
  const pool = cards.filter((c) => c.tier === "minion" || c.tier === "warrior");
  const reward = drawRandom(pool, 1)[0];
  if (reward) {
    run.collection.push(reward);
    console.log(`${node.title}: Ritual complete. Received: ${reward.name}`);
  }

  completeNode(node.id);
}

function resolveRest(node) {
  // Healing restores HP but drains the Pain meter (per game-design.md).
  const healAmount = 8;
  const painDrain = 5;

  const prevHp = player.hp;
  player.hp = Math.min(player.hp + healAmount, player.maxHp);
  const healed = player.hp - prevHp;

  const prevPain = player.pain;
  player.pain = Math.max(player.pain - painDrain, 0);
  const drained = prevPain - player.pain;

  updatePainZone();

  console.log(
    `${node.title}: Rested. HP restored: +${healed} (${player.hp}/${player.maxHp}) | Pain drained: -${drained} (${player.pain})`,
  );

  completeNode(node.id);
}

function resolveCurse(node) {
  // Player accepts a curse; receives a card reward in return.
  // Curses are strings for now — effect resolution is a future task.
  const cursePool = [
    {
      id: "curse_bleeding",
      label: "Bleeding — lose 1 HP at the start of each turn.",
    },
    { id: "curse_slow", label: "Slow — draw 1 fewer card each turn." },
    { id: "curse_brittle", label: "Brittle — your summons have -1 defense." },
  ];

  const curse = drawRandom(cursePool, 1)[0];
  run.curses = run.curses || [];
  run.curses.push(curse);
  console.log(`${node.title}: Curse accepted — ${curse.label}`);

  // Card reward: weighted toward champion tier if it exists in pool
  const rewardPool = cards.filter(
    (c) => c.tier === "warrior" || c.tier === "champion",
  );
  const fallback = cards.filter((c) => c.tier === "warrior");
  const pool = rewardPool.length ? rewardPool : fallback;
  const reward = drawRandom(pool, 1)[0];

  if (reward) {
    run.collection.push(reward);
    console.log(`${node.title}: Received in exchange — ${reward.name}`);
  }

  completeNode(node.id);
}

function resolveMystery(node) {
  // High variance — one of four outcomes, weighted.
  const roll = Math.random();
  let outcome;

  if (roll < 0.3) {
    outcome = "marrow";
  } else if (roll < 0.55) {
    outcome = "card";
  } else if (roll < 0.75) {
    outcome = "damage";
  } else {
    outcome = "curse";
  }

  console.log(`${node.title}: Mystery resolves...`);

  switch (outcome) {
    case "marrow": {
      const amount = rollMarrow(4, 10);
      earnMarrow(amount);
      console.log(`${node.title}: Found forgotten Marrow. (+${amount})`);
      break;
    }
    case "card": {
      const pool = cards.filter(
        (c) => c.tier === "minion" || c.tier === "warrior",
      );
      const reward = drawRandom(pool, 1)[0];
      if (reward) {
        run.collection.push(reward);
        console.log(`${node.title}: A card materializes — ${reward.name}`);
      }
      break;
    }
    case "damage": {
      const amount = rollMarrow(3, 8); // reuse helper for int in range
      dealSelfDamage(amount);
      console.log(`${node.title}: Something unseen cuts you. (-${amount} HP)`);
      break;
    }
    case "curse": {
      // Reuse resolveCurse's pool — no card reward, just the curse
      const cursePool = [
        {
          id: "curse_bleeding",
          label: "Bleeding — lose 1 HP at the start of each turn.",
        },
        { id: "curse_slow", label: "Slow — draw 1 fewer card each turn." },
        {
          id: "curse_brittle",
          label: "Brittle — your summons have -1 defense.",
        },
      ];
      const curse = drawRandom(cursePool, 1)[0];
      run.curses = run.curses || [];
      run.curses.push(curse);
      console.log(`${node.title}: You are marked. — ${curse.label}`);
      break;
    }
  }

  completeNode(node.id);
}

// -- Node Resolution End --

startRun("blood-flesh");
buildDeck();
dealOpeningHand();

console.log(game);
