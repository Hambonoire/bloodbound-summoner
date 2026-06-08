const { curses, drawRandomCurses } = require("./curses");

function createMapSystem({
  player,
  run,
  cards,
  costSystem,
  economySystem,
  shopSystem,
  shop,
  startEncounter,
  drawRandom,
  getEnemyById,
}) {
  const act1Map = {
    act: 1,
    currentNodeId: "node_01",
    nodes: [
      // ── Entry ──────────────────────────────────────────────────────────────
      {
        id: "node_01",
        type: "combat",
        title: "The Ashfield",
        enemies: ["grunt_01", "grunt_02"],
        completed: false,
        locked: false,
        connections: ["node_02", "node_03"],
        secret: null,
      },

      // ── Branch A: Ritual / self-damage path ────────────────────────────────
      {
        id: "node_02",
        type: "ritual",
        title: "The Bleeding Stone",
        completed: false,
        locked: true,
        connections: ["node_04"],
        secret: null,
      },

      // ── Branch B: Combat path ──────────────────────────────────────────────
      {
        id: "node_03",
        type: "combat",
        title: "Carrion Pass",
        enemies: ["grunt_02", "grunt_03"],
        completed: false,
        locked: true,
        connections: ["node_04"],
        secret: null,
      },

      // ── Mid-act Shop (both branches merge here) ────────────────────────────
      {
        id: "node_04",
        type: "shop",
        title: "The Marrow Merchant",
        completed: false,
        locked: true,
        connections: ["node_05", "node_06"],
        secret: null,
      },

      // ── Branch C: NPC / scavenger path — hint chain step 1 ─────────────────
      {
        id: "node_05",
        type: "npc",
        title: "The Hollow Crossroads",
        completed: false,
        locked: true,
        connections: ["node_07"],
        secret: null,
        npc: {
          id: "wanderer_01",
          name: "The Ashen Pilgrim",
          dialogue:
            "She traces a symbol in the ash. 'The gate remembers those who bleed for it.'",
          hintId: "hint_02",
          hint: "A name scratched into the wall. You can almost read it.",
          marrowReward: 4,
        },
      },

      // ── Branch D: Combat path (no NPC) ─────────────────────────────────────
      {
        id: "node_06",
        type: "combat",
        title: "The Rot Fields",
        enemies: ["soldier_01", "grunt_01"],
        completed: false,
        locked: true,
        connections: ["node_07"],
        secret: null,
      },

      // ── Curse node (both branches merge here) ──────────────────────────────
      {
        id: "node_07",
        type: "curse",
        title: "The Cursed Altar",
        completed: false,
        locked: true,
        connections: ["node_08"],
        secret: null,
      },

      // ── Rest node ──────────────────────────────────────────────────────────
      {
        id: "node_08",
        type: "rest",
        title: "The Dying Ember",
        completed: false,
        locked: true,
        connections: ["node_09", "node_10"],
        secret: null,
      },

      // ── Branch E: NPC / scavenger path — hint chain step 2 ─────────────────
      {
        id: "node_09",
        type: "npc",
        title: "The Sunken Threshold",
        completed: false,
        locked: true,
        connections: ["node_11", "node_13"],
        secret: null,
        npc: {
          id: "wanderer_02",
          name: "The Bone Cartographer",
          dialogue:
            "'The secret opens for those who ask in the old tongue.' He presses a shard of bone into your palm.",
          hintId: "hint_03",
          hint: "The shard fits something. You don't know what yet.",
          marrowReward: 6,
        },
      },

      // ── Branch F: Combat path (no NPC) ─────────────────────────────────────
      {
        id: "node_10",
        type: "combat",
        title: "The Bonepile",
        enemies: ["soldier_02", "grunt_03"],
        completed: false,
        locked: true,
        connections: ["node_13"],
        secret: null,
      },

      // ── Hidden Secret — locked until hint chain complete ────────────────────
      // Unlocked by checkHintChain() after hint_02 + hint_03 in run.discoveredHints.
      // Only reachable via Branch E (node_09 connection).
      {
        id: "node_11",
        type: "hidden_secret",
        title: "???",
        completed: false,
        locked: true,
        connections: ["node_13"],
        secret: {
          discovered: false,
          hintId: "hint_secret",
          hint: "Behind the wall: something old, something waiting.",
        },
      },

      // ── Act-end Combat Mystery #1 ───────────────────────────────────────────
      {
        id: "node_12",
        type: "combat_mystery",
        title: "The Wailing Dark",
        completed: false,
        locked: true,
        connections: ["node_13"],
        secret: null,
        // enemy composition rolled at resolve time by resolveCombatMystery()
      },

      // ── Gatekeeper — seeds hint chain, checks archetype seal ───────────────
      {
        id: "node_13",
        type: "gatekeeper",
        title: "The Warden's Gate",
        completed: false,
        locked: true,
        // Populated by resolveGatekeeper() based on run.archetype at resolve time.
        // Expects "artifact_blood_seal" (Blood/Flesh) or "artifact_bone_seal" (Undead/Bone).
        requiredArtifacts: [],
        connections: ["node_14"],
        secret: null,
      },

      // ── Act-end Combat Mystery #2 (escalation) ─────────────────────────────
      {
        id: "node_14",
        type: "combat_mystery",
        title: "The Threshold of Teeth",
        completed: false,
        locked: true,
        connections: ["node_15"],
        secret: null,
      },

      // ── Boss ────────────────────────────────────────────────────────────────
      {
        id: "node_15",
        type: "boss",
        title: "The Hollow King's Court",
        enemies: ["boss_01"],
        completed: false,
        locked: true,
        connections: [],
        secret: null,
        isBoss: true,
      },
    ],
  };
  function getNode(id) {
    return act1Map.nodes.find((n) => n.id === id);
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
      case "combat":
        resolveCombatNode(node, { isBoss: !!node.isBoss });
        break;
      case "boss":
        resolveCombatNode(node, { isBoss: true });
        break;
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
      case "shop":
        resolveShop(node);
        break;
      case "npc":
        resolveNPC(node);
        break;
      case "combat_mystery":
        resolveCombatMystery(node);
        break;
      default:
        console.log(`No resolver for node type: ${node.type}`);
    }
  }
  function resolveCombatNode(node, { isBoss = false } = {}) {
    if (!Array.isArray(node.enemies) || node.enemies.length === 0) {
      console.log(`${node.title}: No enemies defined.`);
      return;
    }

    const enemyList = node.enemies
      .map((id) => getEnemyById(id))
      .filter(Boolean);

    if (enemyList.length === 0) {
      console.log(`${node.title}: No valid enemies resolved from IDs.`);
      return;
    }

    if (isBoss) {
      console.log(
        `*** Boss Encounter: ${node.title} — ${enemyList
          .map((e) => e.name)
          .join(", ")} ***`,
      );
    } else {
      console.log(
        `Encounter at ${node.title}: ${enemyList.map((e) => e.name).join(", ")}`,
      );
    }

    startEncounter(enemyList);

    // Mark node as completed handled by checkEncounterEnd() later, once win detected.
    // For now, manually mark it if encounter end logic isn't wired yet:
    // completeNode(node.id);
  }
  function resolveGatekeeper(node) {
    // Determine required seal based on player archetype.
    // Seals are granted by the Act 1 boss kill (Task 54).
    const sealMap = {
      "blood/flesh": "artifact_blood_seal",
      "undead/bone": "artifact_bone_seal",
    };
    const requiredSeal = sealMap[run.archetype?.toLowerCase()];

    if (requiredSeal && !node.requiredArtifacts.includes(requiredSeal)) {
      node.requiredArtifacts = [requiredSeal];
    }

    // Artifact check
    const missing = (node.requiredArtifacts || []).filter(
      (id) => !(run.artifacts || []).includes(id),
    );

    if (missing.length > 0) {
      console.log(
        `${node.title}: BLOCKED — missing artifact(s): ${missing.join(", ")}`,
      );

      // Seed hint_01 even on a blocked attempt — the gate speaks before it
      // refuses. This is the player's cue to seek out the Wanderers.
      run.discoveredHints = run.discoveredHints || [];
      if (!run.discoveredHints.includes("hint_01")) {
        run.discoveredHints.push("hint_01");
        console.log(
          `[The Warden's Gate] The gate hums. Something is carved above the arch:`,
        );
        console.log(
          `  "hint_01 — Two wanderers know the way. Find them before you return."`,
        );
      }
      return;
    }

    // Seal verified — gate opens, seed hint_01 if not already present
    run.discoveredHints = run.discoveredHints || [];
    if (!run.discoveredHints.includes("hint_01")) {
      run.discoveredHints.push("hint_01");
      console.log(
        `[The Warden's Gate] The gate speaks: "Seek the wanderers. They remember what you don't."`,
      );
    }

    console.log(`${node.title}: Seal verified. The gate opens.`);
    completeNode(node.id);
  }
  function resolveShop(node) {
    const act = node.act || 1; // or derive from mapSystem / run if you track act elsewhere

    const inventory = shopSystem.generateShopInventory(act);
    shop.inventory = inventory;

    console.log(
      `${node.title}: Shop opens with ${inventory.length} cards (Act ${act}).`,
    );
  }
  function resolveRitual(node) {
    // Player pays HP for a card reward or Marrow. Two fixed options per the design doc.
    const hpCost = 5;
    if (player.hp - hpCost <= 0) {
      console.log(`${node.title}: Cannot pay ritual cost — would be lethal.`);
      return;
    }

    costSystem.dealSelfDamage(hpCost);

    // Reward: add a random card from the pool to run.collection
    const pool = cards.filter(
      (c) => c.tier === "minion" || c.tier === "warrior",
    );
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

    costSystem.updatePainZone();

    console.log(
      `${node.title}: Rested. HP restored: +${healed} (${player.hp}/${player.maxHp}) | Pain drained: -${drained} (${player.pain})`,
    );

    completeNode(node.id);
  }
  function applyOnAcquireCurseEffect(curseId) {
    if (curseId === "curse_fragile_blood") {
      const reduction = 3;
      player.maxHp = Math.max(1, player.maxHp - reduction);
      // Clamp current HP to new max
      player.hp = Math.min(player.hp, player.maxHp);
      console.log(`[Curse] Fragile Blood: maxHp reduced to ${player.maxHp}.`);
    }
    if (curseId === "curse_brittle_bones") {
      player.maxBlood = Math.max(5, player.maxBlood - 1);
      // Clamp current Blood to new max
      player.blood = Math.min(player.blood, player.maxBlood);
      console.log(
        `[Curse] Brittle Bones: maxBlood reduced to ${player.maxBlood}.`,
      );
    }
    // curse_blood_debt and curse_clotted_pain have no on-acquire stat effect;
    // blood_debt fires in onCombatStart(), clotted_pain is deferred.
  }
  function resolveCurse(node) {
    // Player accepts a curse; receives a card reward in return.
    // Curses are strings for now — effect resolution is a future task.
    const [curse] = drawRandomCurses(1);

    if (!curse) {
      console.log("No curses available in pool.");
      return;
    }

    run.curses = run.curses || [];
    run.curses.push(curse.id);

    applyOnAcquireCurseEffect(curse.id);

    console.log(
      `You are afflicted with a curse: ${curse.name} — ${curse.effect}`,
    );

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

    logRunCurses();

    completeNode(node.id);
  }
  function logRunCurses() {
    if (!run.curses || run.curses.length === 0) {
      console.log("Active curses this run: none.");
      return;
    }

    const active = run.curses
      .map((id) => curses.find((c) => c.id === id))
      .filter(Boolean);

    if (active.length === 0) {
      console.log("Active curses this run: unknown IDs only.");
      return;
    }

    const names = active.map((c) => c.name).join(", ");
    console.log(`Active curses this run: ${names}.`);
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
        economySystem.earnMarrow(amount);
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
        const amount = economySystem.rollMarrow(3, 8); // reuse helper for int in range
        costSystem.dealSelfDamage(amount);
        console.log(
          `${node.title}: Something unseen cuts you. (-${amount} HP)`,
        );
        break;
      }
      case "curse": {
        // Reuse shared curse pool from data/curses.js
        const [curse] = drawRandomCurses(1);

        if (!curse) {
          console.log(
            `${node.title}: The air is heavy, but nothing binds you.`,
          );
          break;
        }

        run.curses = run.curses || [];
        run.curses.push(curse.id);

        console.log(
          `${node.title}: You are marked. — ${curse.name}: ${curse.effect}`,
        );

        logRunCurses();
        break;
      }
    }

    completeNode(node.id);
  }
  function resolveCombatMystery(node) {
    // Act 1 mystery pool — unusual or escalated compositions not found on
    // the standard map path. Rolled at resolve time, never hardcoded on the node.
    const mysteryPools = [
      { enemies: ["elite_01"], weight: 2 },
      { enemies: ["elite_02", "grunt_01"], weight: 2 },
      { enemies: ["soldier_03", "soldier_01"], weight: 3 },
      { enemies: ["soldier_02", "soldier_03"], weight: 2 },
      { enemies: ["grunt_01", "grunt_02", "grunt_03"], weight: 1 },
    ];

    // Weighted random pick
    const totalWeight = mysteryPools.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    let pool = mysteryPools[mysteryPools.length - 1];
    for (const entry of mysteryPools) {
      roll -= entry.weight;
      if (roll <= 0) {
        pool = entry;
        break;
      }
    }

    const enemyList = pool.enemies
      .map((id) => getEnemyById(id))
      .filter(Boolean);

    if (enemyList.length === 0) {
      console.log(
        `${node.title}: No valid enemies rolled. Skipping encounter.`,
      );
      completeNode(node.id);
      return;
    }

    console.log(
      `??? Encounter at ${node.title}: ${enemyList.map((e) => e.name).join(", ")}`,
    );

    // Reuse standard combat flow — victory + node completion handled by
    // checkEncounterEnd() in main.js, same as regular combat nodes.
    // Store the rolled enemy list on the node so checkEncounterEnd() can
    // reference it if needed (mirrors how standard combat nodes work).
    node.enemies = pool.enemies;
    startEncounter(enemyList);
  }
  function discoverSecret(node) {
    node.secret.discovered = true;
    run.discoveredHints = run.discoveredHints || [];
    run.discoveredHints.push(node.secret.hintId);
    console.log(`Secret discovered — ${node.secret.hint}`);
    console.log(`Hints found this run: ${run.discoveredHints.length}`);
  }
  function resolveNPC(node) {
    const npc = node.npc;
    if (!npc) {
      console.log(`${node.title}: No NPC data found.`);
      completeNode(node.id);
      return;
    }

    console.log(`\n[${npc.name}]`);
    console.log(`  ${npc.dialogue}`);

    // Advance hint chain
    run.discoveredHints = run.discoveredHints || [];
    if (!run.discoveredHints.includes(npc.hintId)) {
      run.discoveredHints.push(npc.hintId);
      console.log(`  Hint acquired: "${npc.hint}"`);
      console.log(`  Hints this run: ${run.discoveredHints.length}`);
    } else {
      console.log(`  (Hint already known.)`);
    }

    // Small Marrow reward
    if (npc.marrowReward && npc.marrowReward > 0) {
      economySystem.earnMarrow(npc.marrowReward);
      console.log(
        `  The wanderer leaves something behind. (+${npc.marrowReward} Marrow)`,
      );
    }

    completeNode(node.id);

    // Check if hint chain is now complete — may unlock hidden_secret node
    checkHintChain();
  }
  function checkHintChain() {
    const hints = run.discoveredHints || [];
    // Requires hint_02 (Wanderer 1) and hint_03 (Wanderer 2) to unlock node_11.
    if (hints.includes("hint_02") && hints.includes("hint_03")) {
      const secretNode = getNode("node_11");
      if (secretNode && secretNode.locked) {
        secretNode.locked = false;
        console.log(
          `[Hidden Secret unlocked] The wall opens. Travel to "???" when ready.`,
        );
      }
    }
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
  return {
    act1Map,
    getNode,
    travelToNode,
    completeNode,
    discoverSecret,
    resolveNode,
    checkHintChain,
  };
}

module.exports = { createMapSystem };
