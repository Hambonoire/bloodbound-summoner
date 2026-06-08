const enemies = [
  // --- GRUNTS ---

  {
    id: "grunt_01",
    name: "Shambling Corpse",
    tier: "grunt",
    archetype: "undead",
    hp: 6,
    maxHp: 6,
    attack: 2,
    armor: 0,
    intent: "attack", // legacy fallback
    intents: ["attack", "attack", "block"],
    effect: null,
  },
  {
    id: "grunt_02",
    name: "Bloodstarved Hound",
    tier: "grunt",
    archetype: "bloodhunter",
    hp: 5,
    maxHp: 5,
    attack: 3,
    armor: 0,
    intent: "attack",
    effect: "Deals +1 damage for every 5 HP the player is missing.",
  },
  {
    id: "grunt_03",
    name: "Hollow Thrall",
    tier: "grunt",
    archetype: "undead",
    hp: 8,
    maxHp: 8,
    attack: 1,
    armor: 0,
    intent: "attack",
    effect: "On death: heals the next enemy in the encounter for 2 HP.",
  },

  // --- SOLDIERS ---

  {
    id: "soldier_01",
    name: "Boneguard",
    tier: "soldier",
    archetype: "undead",
    hp: 16,
    maxHp: 16,
    attack: 3,
    armor: 2,
    intent: "block",
    effect: null,
  },
  {
    id: "soldier_02",
    name: "Cursebrand Warrior",
    tier: "soldier",
    archetype: "cursebinder",
    hp: 14,
    maxHp: 14,
    attack: 2,
    armor: 1,
    intent: "curse", // legacy fallback
    intentWeights: { attack: 3, curse: 2 },
    effect:
      "On attack: applies Bleed to the player (1 self-damage per turn for 2 turns).",
  },
  {
    id: "soldier_03",
    name: "Vein Sentinel",
    tier: "soldier",
    archetype: "bloodhunter",
    hp: 18,
    maxHp: 18,
    attack: 4,
    armor: 2,
    intent: "attack",
    effect: "Rage: gains +1 attack each time it takes damage.",
  },
  // --- ELITES ---

  {
    id: "elite_01",
    name: "Gore Herald",
    tier: "elite",
    archetype: "bloodhunter",
    hp: 28,
    maxHp: 28,
    attack: 5,
    armor: 2,
    intent: "attack",
    // Mostly attacks, sometimes blocks to stay alive
    intentWeights: { attack: 4, block: 1 },
    effect:
      "Deals +1 damage for every 5 HP the player is missing. When it kills a summon, gain +1 attack this encounter.",
  },

  {
    id: "elite_02",
    name: "Bonecaller Adept",
    tier: "elite",
    archetype: "undead",
    hp: 26,
    maxHp: 26,
    attack: 4,
    armor: 3,
    intent: "curse",
    // Cycles: curse → attack → block → attack
    intents: ["curse", "attack", "block", "attack"],
    effect:
      "Can sacrifice a Grunt in this encounter to heal 5 HP and gain +2 armor. On attack: if a friendly Grunt died this turn, deal +2 damage.",
  },

  // --- BOSSES ---

  {
    id: "boss_01",
    name: "Bloodbound Butcher",
    tier: "boss",
    archetype: "bloodhunter",
    hp: 60,
    maxHp: 60,
    attack: 7,
    armor: 3,
    intent: "attack",
    // Pattern: self-wound buff, attack, attack, block, repeat
    intents: ["curse", "attack", "attack", "block"],
    effect:
      "At the start of its turn, may deal 3 damage to itself to gain +2 attack this encounter. Deals +1 damage for every 5 HP the player is missing.",
  },

  {
    id: "boss_02",
    name: "Grave Tyrant",
    tier: "boss",
    archetype: "undead",
    hp: 65,
    maxHp: 65,
    attack: 6,
    armor: 4,
    intent: "attack",
    // Weighted: mostly attack, sometimes block, rare heal
    intentWeights: { attack: 5, block: 2, heal: 1 },
    effect:
      "Whenever it kills a summon, summons a Shambling Corpse to the encounter. At 50% and 25% HP thresholds, heals 6 HP and gains +2 armor.",
  },
];

function getEnemyById(id) {
  const enemy = enemies.find((e) => e.id === id);
  if (!enemy) {
    console.log(`Unknown enemy ID: ${id}`);
    return null;
  }
  return enemy;
}

module.exports = { enemies, getEnemyById };
