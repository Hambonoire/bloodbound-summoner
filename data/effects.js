const { MAX_FIELD_SIZE } = require("./cards");

function createEffectSystem({ player, run, encounter, costSystem }) {
  function applyCardEffect(card) {
    if (!card || !card.id) return;

    switch (card.id) {
      case "bf_ritual_01":
        return applyBloodlettingRite(card);
      case "ub_sacrifice_01":
        return applyBoneHarvest(card);
      case "bf-drain_01":
        return applySanguineSiphon(card);
      case "generic_relic_01":
        return applyBloodboundSigil(card);
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
    // Target: first living enemy (player-choice deferred)
    const target =
      encounter && encounter.enemies
        ? encounter.enemies.find((e) => e.hp > 0)
        : null;

    if (!target) {
      console.log(`[Effect] ${card.name}: No valid target.`);
      return;
    }

    // Deal 3 damage to target
    const dmg = 3;
    target.hp -= dmg;
    console.log(
      `[Effect] ${card.name}: Drained ${dmg} HP from ${target.name}. Enemy HP: ${target.hp}`,
    );

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

    // TODO: if drain damage would overflow (enemy hp drops below 0), apply overflow as self-damage → Pain
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

  return {
    applyCardEffect,
  };
}

module.exports = { createEffectSystem };
