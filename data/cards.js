const cards = [
  // --- BLOOD/FLESH — MINION ---

  {
    id: "bf_minion_01",
    name: "Flesh Crawler",
    archetype: "blood-flesh",
    tier: "minion",
    type: "summon",
    cost: { hp: 1, blood: 0 },
    attack: 2,
    defense: 1,
    effect: null,
  },
  {
    id: "bf_minion_02",
    name: "Gore Hound",
    archetype: "blood-flesh",
    tier: "minion",
    type: "summon",
    cost: { hp: 0, blood: 2 },
    attack: 1,
    defense: 1,
    effect: "On attack: deal 1 self-damage, gain 1 Blood.",
  },
  {
    id: "bf_minion_03",
    name: "Hemorrhage Spawn",
    archetype: "blood-flesh",
    tier: "minion",
    type: "summon",
    cost: { hp: 2, blood: 0 },
    attack: 3,
    defense: 0,
    effect: "On death: deal 2 self-damage.",
  },

  // --- BLOOD/FLESH — WARRIOR ---

  {
    id: "bf_warrior_01",
    name: "Bloodsoaked Brute",
    archetype: "blood-flesh",
    tier: "warrior",
    type: "summon",
    cost: { hp: 4, blood: 0 },
    attack: 5,
    defense: 2,
    effect: null,
  },
  {
    id: "bf_warrior_02",
    name: "Vein Ripper",
    archetype: "blood-flesh",
    tier: "warrior",
    type: "summon",
    cost: { hp: 0, blood: 5 },
    attack: 4,
    defense: 2,
    effect: "On summon: deal 3 self-damage, gain 3 Blood.",
  },
  {
    id: "bf_warrior_03",
    name: "Flayed Champion",
    archetype: "blood-flesh",
    tier: "warrior",
    type: "summon",
    cost: { hp: 3, blood: 2 },
    attack: 6,
    defense: 1,
    effect: "While Pain meter is in Threshold: +2 attack.",
  },

  // --- UNDEAD/BONE — MINION ---

  {
    id: "ub_minion_01",
    name: "Bone Shard",
    archetype: "undead-bone",
    tier: "minion",
    type: "summon",
    cost: { sacrifice: 0, marrow: 0 },
    attack: 1,
    defense: 2,
    effect: null,
  },
  {
    id: "ub_minion_02",
    name: "Risen Thrall",
    archetype: "undead-bone",
    tier: "minion",
    type: "summon",
    cost: { sacrifice: 0, marrow: 1 },
    attack: 2,
    defense: 1,
    effect: "On death: add 1 Marrow.",
  },
  {
    id: "ub_minion_03",
    name: "Grave Crawler",
    archetype: "undead-bone",
    tier: "minion",
    type: "summon",
    cost: { sacrifice: 0, marrow: 0 },
    attack: 1,
    defense: 1,
    effect: "On death: summon one Bone Shard.",
  },

  // --- UNDEAD/BONE — WARRIOR ---

  {
    id: "ub_warrior_01",
    name: "Ossified Hulk",
    archetype: "undead-bone",
    tier: "warrior",
    type: "summon",
    cost: { sacrifice: 1, marrow: 0 },
    attack: 5,
    defense: 3,
    effect: null,
  },
  {
    id: "ub_warrior_02",
    name: "Bonelord",
    archetype: "undead-bone",
    tier: "warrior",
    type: "summon",
    cost: { sacrifice: 1, marrow: 1 },
    attack: 4,
    defense: 3,
    effect:
      "On summon: the sacrificed summon deals its attack value as damage.",
  },
  {
    id: "ub_warrior_03",
    name: "Death Weaver",
    archetype: "undead-bone",
    tier: "warrior",
    type: "summon",
    cost: { sacrifice: 0, marrow: 2 },
    attack: 3,
    defense: 4,
    effect: "On attack: if a friendly summon died this turn, +3 attack.",
  },

  // --- Champion Tier ---

  // Blood/Flesh Champions
  {
    id: "bf_champion_01",
    name: "Fleshbinder",
    archetype: "blood-flesh",
    tier: "champion",
    type: "summon",
    cost: { hp: 8, blood: 3 },
    attack: 5,
    defense: 4,
    effect: "On summon: heal 2 HP for each summon already on the field.",
  },
  {
    id: "bf_champion_02",
    name: "Hemorrhage Knight",
    archetype: "blood-flesh",
    tier: "champion",
    type: "summon",
    cost: { hp: 6, sacrifice: 1 },
    attack: 7,
    defense: 3,
    effect: "On summon: deal 3 damage to target enemy. Gain 1 Blood.",
  },

  // Undead/Bone Champions
  {
    id: "ub_champion_01",
    name: "Bonecage Titan",
    archetype: "undead-bone",
    tier: "champion",
    type: "summon",
    cost: { marrow: 10 },
    attack: 3,
    defense: 9,
    effect: "Absorbs overflow damage before it reaches the player.",
  },
  {
    id: "ub_champion_02",
    name: "Wailing Revenant",
    archetype: "undead-bone",
    tier: "champion",
    type: "summon",
    cost: { marrow: 7, hp: 4 },
    attack: 6,
    defense: 5,
    effect: "On summon: all enemies lose 1 attack until your next turn.",
  },

  // --- Apex Tier ---

  // Blood/Flesh Apex
  {
    id: "bf_apex_01",
    name: "The Blooded Ascendant",
    archetype: "blood-flesh",
    tier: "apex",
    type: "summon",
    cost: { hp: 15, blood: 5 },
    attack: 10,
    defense: 6,
    apexLocked: true,
    effect:
      "On summon: player gains 5 Blood. Deals double damage while player Pain is above 20.",
  },

  // Undead/Bone Apex
  {
    id: "ub_apex_01",
    name: "The Hollow King",
    archetype: "undead-bone",
    tier: "apex",
    type: "summon",
    cost: { marrow: 18, sacrifice: 2 },
    attack: 9,
    defense: 10,
    apexLocked: true,
    effect:
      "On summon: resurrect one destroyed summon from discard at half its defense.",
  },
];
