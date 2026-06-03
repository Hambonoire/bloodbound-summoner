function createEffectSystem({ player, run, encounter, costSystem }) {
  function applyCardEffect(card) {
    if (!card || !card.id) return;

    switch (card.id) {
      case "bf_ritual_01":
        return applyBloodlettingRite(card);
      case "ub_sacrifice_01":
        return applyBoneHarvest(card);
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

  return {
    applyCardEffect,
  };
}

module.exports = { createEffectSystem };
