const { MAX_FIELD_SIZE } = require("./cards");

function createEffectSystem({
  player,
  run,
  encounter,
  costSystem,
  combatSystem,
}) {
  function applyCardEffect(card) {
    if (!card || !card.id) return;

    switch (card.id) {
      case "bf_ritual_01":
        return applyBloodlettingRite(card);
      case "ub_sacrifice_01":
        return applyBoneHarvest(card);
      case "bf_drain_01":
        return applySanguineSiphon(card);
      case "generic_relic_01":
        return applyBloodboundSigil(card);
      case "bf_champion_01":
        return applyFleshbinder(card);
      case "bf_champion_02":
        return applyHemorrhageKnight(card);
      case "ub_champion_01":
        return applyBonecageTitan(card);
      case "ub_champion_02":
        return applyWailingRevenant(card);
      case "bf_warrior_02":
        return applyVeinRipper(card);
      case "ub_warrior_02":
        return applyBonelord(card);
      case "bf_apex_01":
        return applyBloodedAscendant(card);
      case "ub_apex_01":
        return applyHollowKing(card);
      default:
        if (card.effect) {
          console.log(`Effect triggered [${card.name}]: ${card.effect}`);
        }
        return;
    }
  }

  function applyBloodlettingRite(card) {
    costSystem.gainBlood(5);
    console.log(`[Effect] ${card.name}: Gained 5 Blood after the ritual.`);
  }

  function applyBoneHarvest(card) {
    player.marrow += 2;
    console.log(
      `[Effect] ${card.name}: Gained 2 Marrow. Marrow: ${player.marrow}`,
    );

    const targetId = "ub_minion_01";

    let index = player.deck.findIndex((c) => c.id === targetId);
    if (index !== -1) {
      const shard = player.deck.splice(index, 1)[0];
      if (player.field.length >= MAX_FIELD_SIZE) {
        console.log(
          `[Effect] ${card.name}: Field is full. ${shard.name} cannot be summoned.`,
        );
        return;
      }
      player.field.push(shard);
      console.log(
        `[Effect] ${card.name}: Summoned ${shard.name} from deck. Field size: ${player.field.length}`,
      );
    }

    index = player.discard.findIndex((c) => c.id === targetId);
    if (index !== -1) {
      const shard = player.discard.splice(index, 1)[0];
      if (player.field.length >= MAX_FIELD_SIZE) {
        console.log(
          `[Effect] ${card.name}: Field is full. ${shard.name} cannot be summoned.`,
        );
        return;
      }
      player.field.push(shard);
      console.log(
        `[Effect] ${card.name}: Summoned ${shard.name} from deck. Field size: ${player.field.length}`,
      );
    }

    console.log(
      `[Effect] ${card.name}: No Bone Shard found in deck or discard to summon.`,
    );
  }

  function applySanguineSiphon(card) {
    const target =
      encounter && encounter.enemies
        ? encounter.enemies.find((e) => e.hp > 0)
        : null;

    if (!target) {
      console.log(`[Effect] ${card.name}: No valid target.`);
      return;
    }

    const dmg = 3;
    // Use combatSystem.damageEnemy so armor is respected and
    // handleEnemyDeath fires correctly if the drain kills the enemy.
    combatSystem.damageEnemy(target, dmg);
    console.log(`[Effect] ${card.name}: Drained ${dmg} from ${target.name}.`);

    // Heal player 3 HP, capped at maxHp
    const prevHp = player.hp;
    player.hp = Math.min(player.hp + dmg, player.maxHp);
    const healed = player.hp - prevHp;
    console.log(
      `[Effect] ${card.name}: Healed ${healed} HP. Player HP: ${player.hp}/${player.maxHp}`,
    );

    // Gain 1 Blood
    costSystem.gainBlood(1);
    console.log(
      `[Effect] ${card.name}: Gained 1 Blood. Blood: ${player.blood}`,
    );

    // TODO: apply overflow (enemy hp < 0 after drain) as self-damage → Pain
  }

  function applyBloodboundSigil(card) {
    // Passive: raise maxBlood by 2 on acquisition
    player.maxBlood += 2;
    console.log(
      `[Effect] ${card.name}: Max Blood increased to ${player.maxBlood}.`,
    );

    // Register the relic so combat-start hook can fire
    if (!player.relics) player.relics = [];
    if (!player.relics.includes(card.id)) {
      player.relics.push(card.id);
      console.log(`[Effect] ${card.name}: Relic registered.`);
    } else {
      console.log(
        `[Effect] ${card.name}: Already equipped — maxBlood boost skipped.`,
      );
    }
  }

  function applyFleshbinder(card) {
    const count = player.field.length; // field before Fleshbinder enters
    if (count === 0) {
      console.log(`[Effect] ${card.name}: No summons on field — no healing.`);
      return;
    }
    const heal = count * 2;
    player.hp = Math.min(player.hp + heal, player.maxHp);
    console.log(
      `[Effect] ${card.name}: Healed ${heal} HP (${count} summon(s) on field). HP: ${player.hp}/${player.maxHp}`,
    );
  }

  function applyBonecageTitan(card) {
    // Flag this summon as an overflow absorber.
    // enemyAttack() in combat.js checks player.field for this flag
    // before routing overflow to the player.
    card.absorbsOverflow = true;
    console.log(`[Effect] ${card.name}: Overflow absorption active.`);
  }

  function applyHemorrhageKnight(card) {
    const target =
      encounter && encounter.enemies
        ? encounter.enemies.find((e) => e.hp > 0)
        : null;

    if (!target) {
      console.log(
        `[Effect] ${card.name}: No valid target for on-summon damage.`,
      );
    } else {
      combatSystem.damageEnemy(target, 3);
      console.log(`[Effect] ${card.name}: Dealt 3 damage to ${target.name}.`);
    }

    costSystem.gainBlood(1);
    console.log(
      `[Effect] ${card.name}: Gained 1 Blood. Blood: ${player.blood}`,
    );
  }

  function applyWailingRevenant(card) {
    if (!encounter || !encounter.enemies) {
      console.log(`[Effect] ${card.name}: No active encounter.`);
      return;
    }

    const living = encounter.enemies.filter((e) => e.hp > 0);
    if (living.length === 0) {
      console.log(`[Effect] ${card.name}: No living enemies to debuff.`);
      return;
    }

    living.forEach((e) => {
      e._attackDebuff = (e._attackDebuff || 0) + 1;
      e.attack = Math.max(0, e.attack - 1);
    });

    console.log(
      `[Effect] ${card.name}: All ${living.length} enemy/enemies lost 1 attack this turn.`,
    );

    // Flag the summon so combat.js can clear debuffs at end of player's next turn
    card.clearsDebuffOnNextTurn = true;
  }

  function applyVeinRipper(card) {
    costSystem.dealSelfDamage(3);
    console.log(`[Effect] ${card.name}: Dealt 3 self-damage on summon.`);

    costSystem.gainBlood(3);
    console.log(
      `[Effect] ${card.name}: Gained 3 Blood. Blood: ${player.blood}`,
    );
  }

  function applyBonelord(card) {
    // The sacrificed summon was removed from field before playCard() calls applyCardEffect.
    // We store the last sacrifice on the card object via costSystem.payCost() — check for it here.
    const sacrificed = card._lastSacrifice || null;

    if (!sacrificed) {
      console.log(
        `[Effect] ${card.name}: No sacrifice data found — skipping bonus damage.`,
      );
      return;
    }

    const target =
      encounter && encounter.enemies
        ? encounter.enemies.find((e) => e.hp > 0)
        : null;

    if (!target) {
      console.log(`[Effect] ${card.name}: No valid enemy target.`);
      return;
    }

    const dmg = sacrificed.attack || 0;
    if (dmg <= 0) {
      console.log(
        `[Effect] ${card.name}: Sacrificed summon had 0 attack — no bonus damage.`,
      );
      return;
    }

    combatSystem.damageEnemy(target, dmg);
    console.log(
      `[Effect] ${card.name}: ${sacrificed.name} dealt ${dmg} damage on sacrifice.`,
    );
  }

  function applyBloodedAscendant(card) {
    costSystem.gainBlood(5);
    console.log(
      `[Effect] ${card.name}: Gained 5 Blood. Blood: ${player.blood}`,
    );

    // Double damage passive: flag the summon so combat.js can check it at attack time
    if (player.pain > 20) {
      card.doubleDamage = true;
      console.log(`[Effect] ${card.name}: Pain > 20 — double damage active.`);
    } else {
      card.doubleDamage = false;
      console.log(
        `[Effect] ${card.name}: Pain ${player.pain} — double damage inactive until Pain > 20.`,
      );
    }
  }

  function applyHollowKing(card) {
    if (!player.discard || player.discard.length === 0) {
      console.log(`[Effect] ${card.name}: No summons in discard to resurrect.`);
      return;
    }

    const deadSummons = player.discard.filter((c) => c.type === "summon");
    if (deadSummons.length === 0) {
      console.log(`[Effect] ${card.name}: No summon cards in discard.`);
      return;
    }

    if (player.field.length >= MAX_FIELD_SIZE) {
      console.log(
        `[Effect] ${card.name}: Field is full — resurrection blocked.`,
      );
      return;
    }

    // Resurrect the most recently discarded summon
    const target = deadSummons[deadSummons.length - 1];
    const idx = player.discard.lastIndexOf(target);
    player.discard.splice(idx, 1);

    const resurrected = {
      ...target,
      defense: Math.floor(target.defense / 2),
      _resurrected: true,
    };

    player.field.push(resurrected);
    console.log(
      `[Effect] ${card.name}: Resurrected ${resurrected.name} at ${resurrected.defense} defense.`,
    );
  }

  return {
    applyCardEffect,
  };
}

module.exports = { createEffectSystem };
