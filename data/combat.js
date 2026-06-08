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
        // Check if any field summon absorbs overflow before it hits the player
        const absorber = player.field.find(
          (s) => s.absorbsOverflow && s.id !== blocker.id,
        );

        if (absorber) {
          console.log(
            `Overflow redirected to ${absorber.name} (absorbsOverflow).`,
          );
          const absorberOverflow = overflow - absorber.defense;
          if (absorberOverflow > 0) {
            player.field = player.field.filter((s) => s.id !== absorber.id);
            console.log(`${absorber.name} destroyed absorbing overflow.`);
            // Remaining overflow after absorber is destroyed hits player
            player.hp -= absorberOverflow;
            console.log(
              `Residual overflow ${absorberOverflow} hits player. HP: ${player.hp}`,
            );
            if (player.hp <= 0) endRun("hp-depleted");
          } else {
            console.log(
              `${absorber.name} fully absorbs overflow. DEF: ${absorber.defense}`,
            );
          }
        } else {
          // Intentional: enemy overflow damage hits player.hp directly.
          // Enemy damage bypasses Pain/Blood by design — only self-inflicted
          // damage (dealSelfDamage) should trigger those systems.
          player.hp -= overflow;
          console.log(
            `Overflow damage: ${overflow} hits player directly. HP: ${player.hp}`,
          );
          if (player.hp <= 0) endRun("hp-depleted");
        }
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
    if (!enemy || damageDealt <= 0) return;
    if (enemy.onDamaged)
      enemy.onDamaged(enemy, damageDealt, { encounter, getEnemyById });
  }

  function handleEnemyDeath(deadEnemy, damageDealt) {
    if (!deadEnemy) return;
    if (deadEnemy.onDeath)
      deadEnemy.onDeath(deadEnemy, damageDealt, { encounter, getEnemyById });

    // Notify surviving enemies that an ally died
    for (const e of encounter.enemies) {
      if (e.hp > 0 && e.id !== deadEnemy.id && e.onAllyDeath) {
        e.onAllyDeath(e, deadEnemy, { encounter });
      }
    }
  }

  function handleSummonKilled(killerEnemy) {
    if (!killerEnemy) return;
    if (killerEnemy.onSummonKilled)
      killerEnemy.onSummonKilled(killerEnemy, { encounter, getEnemyById });
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
