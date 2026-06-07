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
      player.field.push(shard);
      console.log(
        `[Effect] ${card.name}: Summoned ${shard.name} from deck. Field size: ${player.field.length}`,
      );
      return;
    }

    index = player.discard.findIndex((c) => c.id === targetId);
    if (index !== -1) {
      const shard = player.discard.splice(index, 1)[0];
      player.field.push(shard);
      console.log(
        `[Effect] ${card.name}: Summoned ${shard.name} from discard. Field size: ${player.field.length}`,
      );
      return;
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

  return {
    applyCardEffect,
  };
}

module.exports = { createEffectSystem };
