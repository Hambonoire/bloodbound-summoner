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
    onDeath(self, damageDealt, { encounter }) {
      const index = encounter.enemies.findIndex((e) => e.id === self.id);
      if (index === -1) return;
      for (let i = index + 1; i < encounter.enemies.length; i++) {
        const target = encounter.enemies[i];
        if (target.hp > 0) {
          const prev = target.hp;
          target.hp = Math.min(target.hp + 2, target.maxHp || target.hp + 2);
          const healed = target.hp - prev;
          if (healed > 0)
            console.log(
              `${self.name} death effect: ${target.name} heals ${healed} HP (now ${target.hp}).`,
            );
          return;
        }
      }
      console.log(`${self.name} death effect: no valid target to heal.`);
    },
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
    onDamaged(self, damageDealt) {
      self.attack += 1;
      console.log(
        `${self.name} enrages and gains +1 attack (now ${self.attack}).`,
      );
    },
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
    onAllyDeath(self, deadEnemy) {
      if (deadEnemy.tier === "grunt") {
        self.gruntDiedThisTurn = true;
      }
    },
    onCurse(self, { encounter }) {
      // Find a living Grunt to sacrifice
      const grunt = encounter.enemies.find(
        (e) => e.hp > 0 && e.tier === "grunt" && e.id !== self.id,
      );
      if (!grunt) {
        console.log(`[Bonecaller Adept] No Grunt available to sacrifice.`);
        return;
      }
      grunt.hp = 0;
      console.log(`[Bonecaller Adept] Sacrificed ${grunt.name}.`);
      self.hp = Math.min(self.hp + 5, self.maxHp);
      self.armor += 2;
      console.log(
        `[Bonecaller Adept] Healed to ${self.hp} HP, armor now ${self.armor}.`,
      );
    },
    onAttack(self) {
      if (self.gruntDiedThisTurn) {
        self.attack += 2;
        console.log(
          `[Bonecaller Adept] Grunt died this turn — +2 attack (now ${self.attack}).`,
        );
      }
    },
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
    onDamaged(self) {
      if (!self.thresholdsFired) self.thresholdsFired = new Set();
      const pct = self.hp / self.maxHp;
      for (const t of [
        { key: "50", pct: 0.5 },
        { key: "25", pct: 0.25 },
      ]) {
        if (pct <= t.pct && !self.thresholdsFired.has(t.key)) {
          self.thresholdsFired.add(t.key);
          self.hp = Math.min(self.hp + 6, self.maxHp);
          self.armor += 2;
          console.log(
            `[Grave Tyrant] ${t.key}% threshold: healed to ${self.hp} HP, armor now ${self.armor}.`,
          );
        }
      }
    },
    onSummonKilled(self, { encounter, getEnemyById }) {
      const corpse = getEnemyById("grunt_01");
      if (!corpse) return;
      corpse.id = `grunt_01_spawn_${Date.now()}`;
      corpse.intentIndex = 0;
      encounter.enemies.push(corpse);
      console.log(`[Grave Tyrant] Spawned ${corpse.name} (${corpse.id}).`);
    },
  },
];

function createEnemySystem() {
  function getEnemyById(id) {
    const enemy = enemies.find((e) => e.id === id);
    if (!enemy) {
      console.log(`Unknown enemy ID: ${id}`);
      return null;
    }
    return { ...enemy };
  }

  return {
    enemies,
    getEnemyById,
  };
}

module.exports = { createEnemySystem };
