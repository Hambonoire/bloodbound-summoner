const { createCostSystem } = require("./data/cost");

// Starting deck composition (10 cards each, no support cards by design).
// Blood/Flesh: 3 Minions (5× across 3 IDs) + 2 Warriors (2× each) + 1 high-cost Warrior.
// Undead/Bone: same shape — 3 Minion types + 3 Warrior types.
// Support cards (Ritual, Sacrifice, Relic, Drain) are pack/shop-only rewards.
// This is intentional: the player discovers synergy through the run, not the starting hand.
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

  // --- BLOOD/FLESH — RITUAL SUPPORT ---

  {
    id: "bf_ritual_01",
    name: "Bloodletting Rite",
    archetype: "blood-flesh",
    tier: "minion",
    type: "ritual",
    cost: { hp: 3, blood: 0 },
    effect:
      "Lose 3 HP. Gain 5 Blood. This counts as self-inflicted damage and can trigger Pain milestones.",
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

  // --- SUPPORT CARDS ---

  // --- GENERIC — RELIC SUPPORT ---

  {
    id: "generic_relic_01",
    name: "Bloodbound Sigil",
    archetype: "generic",
    tier: "relic",
    type: "relic",
    cost: { hp: 0, blood: 0, marrow: 5 },
    effect:
      "Passive: Your maximum Blood increases by 2. When you enter a combat with at least 10 Pain, gain 2 Blood.",
  },

  // --- BLOOD/FLESH — DRAIN SUPPORT ---

  {
    id: "bf_drain_01",
    name: "Sanguine Siphon",
    archetype: "blood-flesh",
    tier: "minion",
    type: "drain",
    cost: { hp: 2, blood: 0 },
    effect:
      "Drain 3 HP from target enemy: it loses 3 HP, you heal 3 HP, and gain 1 Blood. This damage counts as self-inflicted for Pain if it would overflow.",
  },

  // --- UNDEAD/BONE — SACRIFICE SUPPORT ---

  {
    id: "ub_sacrifice_01",
    name: "Bone Harvest",
    archetype: "undead-bone",
    tier: "minion",
    type: "sacrifice",
    cost: { sacrifice: 1, marrow: 0 },
    effect:
      "Sacrifice one of your summons. Gain 2 Marrow and summon one Bone Shard from your deck or discard.",
  },
];

const HAND_SIZE = 5;
const MAX_HAND_SIZE = 7;
const MAX_FIELD_SIZE = 5;
const FORCED_DISCARD_BLOOD_DRAIN = 2;

const costSystem = createCostSystem({ player, onEndRun: endRun });

function createDeckSystem({ player, run, cards, effectSystem }) {
  function buildDeck() {
    player.deck = shuffle([...run.collection]);
    player.hand = [];
    player.discard = [];
    console.log(`Deck built. ${player.deck.length} cards.`);
  }
  function reshuffleDeck() {
    player.deck = shuffle([...player.discard]);
    player.discard = [];
    console.log(`Deck reshuffled from discard. ${player.deck.length} cards.`);
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
  function getCardById(id) {
    return cards.find((c) => c.id === id) || null;
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function playCard(card) {
    if (!canPlayCard(card)) {
      console.log(`Cannot play: ${card.name}`);
      return false;
    }

    payCost(card);

    if (effectSystem && effectSystem.applyCardEffect) {
      effectSystem.applyCardEffect(card);
    }

    if (card.type === "summon") {
      player.field.push(card);
      console.log(
        `Summoned: ${card.name} | ATK: ${
          card.attack + player.summonAttackBonus
        } | DEF: ${card.defense} | Field: ${player.field.length}/${MAX_FIELD_SIZE}`,
      );
    }

    discardCard(card.id);

    return true;
  }
  function drawRandom(pool, count) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
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

  return {
    buildDeck,
    reshuffleDeck,
    dealOpeningHand,
    drawCard,
    discardCard,
    discardHand,
    canPlayCard,
    getCardById,
    shuffle,
    playCard,
    drawRandom,
    endTurnDiscardDownToLimit,
  };
}

module.exports = { createDeckSystem, STARTING_DECKS, cards };
