function createCombatSystem({ player, encounter, onEndRun, getEnemyById }) {
  function endRun(reason) {
    if (onEndRun) onEndRun(reason);
  }

  // Shared helper: apply damage to an enemy, respecting armor,
  // and fire handleEnemyDamaged / handleEnemyDeath as appropriate.
  function damageEnemy(enemy, amount) {
    if (!enemy || enemy.hp <= 0) return;

    let damage = amount;

    if (enemy.armor > 0) {
      const absorbed = Math.min(enemy.armor, damage);
      enemy.armor -= absorbed;
      damage -= absorbed;
      console.log(
        `Armor absorbed ${absorbed}. Remaining armor: ${enemy.armor}`,
      );
    }

    enemy.hp -= damage;
    console.log(`${enemy.name} takes ${damage} damage. Enemy HP: ${enemy.hp}`);

    handleEnemyDamaged(enemy, damage);

    if (enemy.hp <= 0) {
      console.log(`${enemy.name} defeated.`);
      handleEnemyDeath(enemy, damage);
    }
  }

  function attackEnemy(enemyId, attackerCard) {
    const enemy = encounter.enemies.find((e) => e.id === enemyId);
    if (!enemy || enemy.hp <= 0) return;

    const totalAttack = attackerCard.attack + player.summonAttackBonus;
    console.log(
      `${attackerCard.name} attacks ${enemy.name} for ${totalAttack}.`,
    );
    damageEnemy(enemy, totalAttack);
  }

  function scaledDamageByMissingHp(enemy) {
    const missingHp = player.maxHp - player.hp;
    const bonus = Math.floor(missingHp / 5);
    return enemy.attack + bonus;
  }

  function enemyAttack(enemy) {
    const scalingEffect =
      "Deals +1 damage for every 5 HP the player is missing";
    let damage =
      enemy.effect && enemy.effect.includes(scalingEffect)
        ? scaledDamageByMissingHp(enemy)
        : enemy.attack;

    if (player.field.length > 0) {
      const blocker = player.field.reduce(
        (best, s) => (s.defense > best.defense ? s : best),
        player.field[0],
      );

      const overflow = damage - blocker.defense;
      console.log(
        `${enemy.name} attacks ${blocker.name} (DEF: ${blocker.defense})`,
      );

      if (overflow > 0) {
        console.log(`Overflow damage: ${overflow} hits player directly.`);
        // Intentional: enemy overflow damage hits player.hp directly.
        // Enemy damage bypasses Pain/Blood by design — only self-inflicted
        // damage (dealSelfDamage) should trigger those systems.
        player.hp -= overflow;
        console.log(`Player HP: ${player.hp}`);
      } else {
        console.log(`Attack fully absorbed by ${blocker.name}.`);
      }

      if (damage >= blocker.defense) {
        player.field = player.field.filter((s) => s.id !== blocker.id);
        console.log(`${blocker.name} destroyed.`);
        // Grave Tyrant: spawn Shambling Corpse on summon kill
        handleSummonKilled(enemy);
      }
    } else {
      // Intentional: same as above — direct player damage bypasses Pain/Blood.
      player.hp -= damage;
      console.log(
        `${enemy.name} attacks player directly for ${damage}. HP: ${player.hp}`,
      );
    }

    if (player.hp <= 0) endRun("hp-depleted");
  }

  function handleEnemyDamaged(enemy, damageDealt) {
    if (!enemy || damageDealt <= 0 || !enemy.effect) return;
    const text = enemy.effect;
    if (text.startsWith("Rage: gains +1 attack each time it takes damage")) {
      enemy.attack += 1;
      console.log(
        `${enemy.name} enrages and gains +1 attack (now ${enemy.attack}).`,
      );
    }
    // Grave Tyrant: heal + armor at 50% and 25% HP thresholds (once per threshold).
    if (
      text.startsWith("Whenever it kills a summon, summons a Shambling Corpse")
    ) {
      if (!enemy.thresholdsFired) enemy.thresholdsFired = new Set();

      const pct = enemy.hp / enemy.maxHp;
      const thresholds = [
        { key: "50", pct: 0.5 },
        { key: "25", pct: 0.25 },
      ];

      for (const t of thresholds) {
        if (pct <= t.pct && !enemy.thresholdsFired.has(t.key)) {
          enemy.thresholdsFired.add(t.key);
          enemy.hp = Math.min(enemy.hp + 6, enemy.maxHp);
          enemy.armor += 2;
          console.log(
            `[Grave Tyrant] ${t.key}% threshold: healed to ${enemy.hp} HP, armor now ${enemy.armor}.`,
          );
        }
      }
    }
  }

  function handleEnemyDeath(deadEnemy, damageDealt) {
    if (!deadEnemy || !deadEnemy.effect) return;
    const text = deadEnemy.effect;
    if (
      text.startsWith(
        "On death: heals the next enemy in the encounter for 2 HP.",
      )
    ) {
      const index = encounter.enemies.findIndex((e) => e.id === deadEnemy.id);
      if (index === -1) return;
      for (let i = index + 1; i < encounter.enemies.length; i++) {
        const target = encounter.enemies[i];
        if (target.hp > 0) {
          const prev = target.hp;
          target.hp = Math.min(target.hp + 2, target.maxHp || target.hp + 2);
          const healed = target.hp - prev;
          if (healed > 0) {
            console.log(
              `${deadEnemy.name} death effect: ${target.name} heals ${healed} HP (now ${target.hp}).`,
            );
          }
          return;
        }
      }
      console.log(`${deadEnemy.name} death effect: no valid target to heal.`);
    }
  }

  function handleSummonKilled(killerEnemy) {
    if (!killerEnemy || !killerEnemy.effect) return;
    if (
      !killerEnemy.effect.startsWith(
        "Whenever it kills a summon, summons a Shambling Corpse",
      )
    )
      return;

    const corpse = getEnemyById("grunt_01");
    if (!corpse) return;

    // Give the spawned enemy a unique instance id so it can be targeted individually
    corpse.id = `grunt_01_spawn_${Date.now()}`;
    corpse.intentIndex = 0;
    encounter.enemies.push(corpse);
    console.log(`[Grave Tyrant] Spawned ${corpse.name} (${corpse.id}).`);
  }

  return {
    attackEnemy,
    enemyAttack,
    handleEnemyDamaged,
    handleEnemyDeath,
    damageEnemy,
  };
}

module.exports = { createCombatSystem };
