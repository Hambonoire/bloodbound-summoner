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
  player.hand = [];
  player.discard = [];

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

const run = {
  collection: [], // all cards the player has acquired this run
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

console.log(game);
