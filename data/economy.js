function createEconomySystem({ player, run, cards }) {
  function earnMarrow(amount) {
    player.marrow += amount;
    console.log(`Earned ${amount} Marrow | Marrow: ${player.marrow}`);
  }
  function spendMarrow(amount) {
    if (player.marrow < amount) {
      console.log(`Not enough Marrow. Have: ${player.marrow}, need: ${amount}`);
      return false;
    }
    player.marrow -= amount;
    console.log(`Spent ${amount} Marrow | Marrow: ${player.marrow}`);
    return true;
  }
  function rollMarrow(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function calculateMarrowReward(enemies) {
    let total = 0;

    for (const enemy of enemies) {
      if (!enemy.tier) {
        continue;
      }
      switch (enemy.tier) {
        case "grunt":
          total += 1;
          break;
        case "soldier":
          total += 2;
          break;
        case "elite":
          total += 3;
          break;
        case "boss":
          total += 5;
          break;
        default:
          total += 2;
          break;
      }
    }

    // Ensure at least 1 Marrow per win
    return Math.max(total, 1);
  }
  function generatePackBonus(type) {
    if (type === "rogue") {
      // low chance of a rare card drop
      const rareRoll = Math.random();
      if (rareRoll < 0.2) {
        const rarePool = cards.filter(
          (c) => c.tier === "champion" || c.tier === "apex",
        );
        const rare = drawRandom(rarePool, 1);
        if (rare.length) return { type: "rare-card", card: rare[0] };
      }
      return { type: "marrow", amount: rollMarrow(2, 5) };
    }
    return { type: "marrow", amount: rollMarrow(1, 3) };
  }
  function generatePack(type, archetype = null) {
    const pool =
      type === "rogue"
        ? cards.filter((c) => c.tier === "minion" || c.tier === "warrior")
        : cards.filter((c) => c.archetype === archetype);

    const pack = {
      type,
      archetype: archetype || "generic",
      cards: drawRandom(pool, 3),
      bonus: generatePackBonus(type),
    };

    return pack;
  }
  function offerPackRewards(wonEncounterArchetype) {
    const options = [
      generatePack("archetype", wonEncounterArchetype),
      generatePack("archetype", wonEncounterArchetype),
      generatePack("rogue"),
    ];

    console.log("--- Pack Rewards ---");
    options.forEach((pack, i) => {
      const names = pack.cards.map((c) => c.name).join(", ");
      const bonus =
        pack.bonus.type === "rare-card"
          ? `Rare: ${pack.bonus.card.name}`
          : `Marrow: ${pack.bonus.amount}`;
      console.log(
        `[${i}] ${pack.type} (${pack.archetype}) | Cards: ${names} | Bonus: ${bonus}`,
      );
    });

    return options;
  }
  function selectPack(options, index) {
    const chosen = options[index];
    if (!chosen) {
      console.log("Invalid selection.");
      return;
    }

    run.collection.push(...chosen.cards);
    if (chosen.bonus.type === "marrow") earnMarrow(chosen.bonus.amount);

    if (chosen.bonus.type === "rare-card") {
      run.collection.push(chosen.bonus.card);
      console.log(`Rare card added: ${chosen.bonus.card.name}`);
    }

    console.log(
      `Pack selected. Cards added: ${chosen.cards.map((c) => c.name).join(", ")}`,
    );
    console.log(
      `Marrow: ${player.marrow} | Collection size: ${run.collection.length}`,
    );
  }
  return {
    earnMarrow,
    spendMarrow,
    rollMarrow,
    calculateMarrowReward,
    generatePackBonus,
    generatePack,
    offerPackRewards,
    selectPack,
  };
}

module.exports = { createEconomySystem };
