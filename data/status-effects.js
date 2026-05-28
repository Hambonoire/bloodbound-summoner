function createCostSystem({ player, onEndRun }) {
  const triggeredMilestones = new Set();

  // Check Cost
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

  // Status / blood

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
  function gainBlood(amount) {
    const rate = player.painZone === "threshold" ? 2 : 1;
    player.blood = Math.min(player.blood + amount * rate, player.maxBlood);
  }
  function drainBlood(amount) {
    const drained = Math.min(player.blood, amount);
    player.blood -= drained;
    console.log(`Blood drained: ${drained} | Blood: ${player.blood}`);
    return drained;
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
  function applyBleedToPlayer(stacks, duration) {
    if (!player.statuses) {
      player.statuses = { bleedStacks: 0, bleedTurnsRemaining: 0 };
    }

    // Add stacks; reset duration to at least the new duration
    player.statuses.bleedStacks += stacks;
    player.statuses.bleedTurnsRemaining = Math.max(
      player.statuses.bleedTurnsRemaining,
      duration,
    );

    console.log(
      `Player afflicted with Bleed: ${player.statuses.bleedStacks} stack(s) for ${player.statuses.bleedTurnsRemaining} turn(s).`,
    );
  }
  function applyEffect(card) {
    if (!card.effect) return;
    // effects are strings for now — log and handle manually until effect system is built
    console.log(`Effect triggered [${card.name}]: ${card.effect}`);
  }

  // Status / pain

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

  function endRun(reason) {
    if (onEndRun) onEndRun(reason);
  }

  return {
    canAfford,
    payCost,
    dealSelfDamage,
    gainBlood,
    spendBlood,
    updatePainZone,
  };
}

module.exports = { createCostSystem };
