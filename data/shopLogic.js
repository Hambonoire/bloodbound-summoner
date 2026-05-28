function createShopSystem({ player, run, cards }) {
  function openShop() {
    shop.inventory = generateShopInventory();
    console.log("--- Shop ---");
    shop.inventory.forEach((item, i) => {
      console.log(
        `[${i}] ${item.card.name} (${item.card.tier} / ${item.card.archetype}) | Cost: ${item.price} Marrow`,
      );
    });
    console.log(`Marrow: ${player.marrow}`);
  }

  function tierWeightsForAct(act) {
    // Default to Act 1 if act is missing or invalid
    const a = act || 1;

    if (a === 1) {
      return { minion: 3, warrior: 2 }; // no champion/apex yet
    }

    if (a === 2) {
      return { minion: 3, warrior: 3, champion: 1 };
    }

    // Act 3+
    return { minion: 2, warrior: 3, champion: 2, apex: 1 };
  }

  function generateShopInventory() {
    const weights = tierWeightsForAct(act);

    // Build a pool per tier
    const byTier = {
      minion: cards.filter((c) => c.tier === "minion"),
      warrior: cards.filter((c) => c.tier === "warrior"),
      champion: cards.filter((c) => c.tier === "champion"),
      apex: cards.filter((c) => c.tier === "apex"),
    };

    const tiers = Object.keys(weights).filter(
      (tier) => weights[tier] > 0 && byTier[tier].length > 0,
    );

    if (tiers.length === 0) {
      console.log("Shop: no cards available for this act.");
      return [];
    }

    const entries = tiers.map((tier) => [tier, weights[tier]]);
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);

    const inventory = [];

    for (let i = 0; i < size; i++) {
      // pick a tier by weight
      let roll = Math.random() * totalWeight;
      let chosenTier = tiers[0];

      for (const [tier, weight] of entries) {
        roll -= weight;
        if (roll <= 0) {
          chosenTier = tier;
          break;
        }
      }

      const pool = byTier[chosenTier];
      if (!pool || pool.length === 0) continue;

      const card = pool[Math.floor(Math.random() * pool.length)];

      inventory.push(card);
    }

    console.log(
      `Shop inventory generated for Act ${act}: ${inventory
        .map((c) => `${c.name} [${c.tier}]`)
        .join(", ")}`,
    );

    return inventory;
  }

  function shopPrice(card) {
    const base = { minion: 4, warrior: 7, champion: 12, apex: 20 };
    return base[card.tier] ?? 5;
  }

  function buyCard(index) {
    const item = shop.inventory[index];

    if (!item) {
      console.log("Invalid selection.");
      return false;
    }
    if (item.sold) {
      console.log("Already sold.");
      return false;
    }
    if (!spendMarrow(item.price)) return false;

    item.sold = true;
    run.collection.push(item.card);
    console.log(
      `Purchased: ${item.card.name} | Marrow: ${player.marrow} | Collection: ${run.collection.length}`,
    );
    return true;
  }

  function refreshShop() {
    if (!spendMarrow(shop.refreshCost)) return;
    shop.inventory = generateShopInventory();
    console.log("Shop refreshed.");
    openShop();
  }

  return { openShop, generateShopInventory, shopPrice, buyCard, refreshShop };
}

module.exports = { createShopSystem };
