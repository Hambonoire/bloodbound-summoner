// data/combat.js

function createCombatSystem({ player, encounter, onEndRun }) {
  function endRun(reason) {
    if (onEndRun) onEndRun(reason);
  }

  function attackEnemy(enemyId, attackerCard) {
    const enemy = encounter.enemies.find((e) => e.id === enemyId);
    if (!enemy || enemy.hp <= 0) return;

    const totalAttack = attackerCard.attack + player.summonAttackBonus;
    let damage = totalAttack;

    if (enemy.armor > 0) {
      const absorbed = Math.min(enemy.armor, damage);
      enemy.armor -= absorbed;
      damage -= absorbed;
      console.log(
        `Armor absorbed ${absorbed}. Remaining armor: ${enemy.armor}`,
      );
    }

    enemy.hp -= damage;
    console.log(
      `${attackerCard.name} attacks ${enemy.name} for ${damage}. Enemy HP: ${enemy.hp}`,
    );

    // Damage-triggered effects (e.g., Vein Sentinel rage)
    handleEnemyDamaged(enemy, damage);

    if (enemy.hp <= 0) {
      console.log(`${enemy.name} defeated.`);
      handleEnemyDeath(enemy, damage);
    }
  }

  function enemyAttack(enemy) {
    let damage = enemy.attack;

    // find the highest defense summon on the field
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
        player.hp -= overflow;
        console.log(`Player HP: ${player.hp}`);
      } else {
        console.log(`Attack fully absorbed by ${blocker.name}.`);
      }

      // destroy blocker if attack meets or exceeds its defense
      if (damage >= blocker.defense) {
        player.field = player.field.filter((s) => s.id !== blocker.id);
        console.log(`${blocker.name} destroyed.`);
      }
    } else {
      // no summons — direct damage to player
      player.hp -= damage;
      console.log(
        `${enemy.name} attacks player directly for ${damage}. HP: ${player.hp}`,
      );
    }

    if (player.hp <= 0) endRun("hp-depleted");
  }

  // Fires when an enemy takes damage but is still alive (e.g. Rage triggers).
  function handleEnemyDamaged(enemy, damageDealt) {
    if (!enemy || damageDealt <= 0 || !enemy.effect) return;

    const text = enemy.effect;

    // Vein Sentinel: "Rage: gains +1 attack each time it takes damage."
    if (text.startsWith("Rage: gains +1 attack each time it takes damage")) {
      enemy.attack += 1;
      console.log(
        `${enemy.name} enrages and gains +1 attack (now ${enemy.attack}).`,
      );
    }
  }

  // Fires when an enemy's HP reaches 0 or below.
  function handleEnemyDeath(deadEnemy, damageDealt) {
    if (!deadEnemy || !deadEnemy.effect) return;

    const text = deadEnemy.effect;

    // Hollow Thrall: "On death: heals the next enemy in the encounter for 2 HP."
    if (text.startsWith("On death: heals the next enemy")) {
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

    // Future: additional on-death patterns can be added here.
  }

  return { attackEnemy, enemyAttack, handleEnemyDamaged, handleEnemyDeath };
}

module.exports = { createCombatSystem };
