// data/shopLogic.js

function createShopSystem({ player, run, cards, shop }) {
  function openShop(act = 1) {
    shop.inventory = generateShopInventory(act);
    console.log("--- Shop ---");
    shop.inventory.forEach((item, i) => {
      console.log(
        `[${i}] ${item.card.name} (${item.card.tier} / ${item.card.archetype}) | Cost: ${item.price} Marrow`,
      );
    });
    console.log(`Marrow: ${player.marrow}`);
  }

  function tierWeightsForAct(act) {
    const a = act || 1;
    if (a === 1) return { minion: 3, warrior: 2 };
    if (a === 2) return { minion: 3, warrior: 3, champion: 1 };
    return { minion: 2, warrior: 3, champion: 2, apex: 1 };
  }

  function generateShopInventory(act = 1, size = 4) {
    const weights = tierWeightsForAct(act);

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
      const price = shopPrice(card);
      inventory.push({ card, price });
    }

    // Filter any undefined slots (from continue skips)
    const result = inventory.filter((item) => item && item.card);

    console.log(
      `Shop inventory generated for Act ${act}: ${result
        .map((item) => `${item.card.name} [${item.card.tier}]`)
        .join(", ")}`,
    );

    return result;
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
    if (player.marrow < item.price) {
      console.log(
        `Not enough Marrow. Have: ${player.marrow}, need: ${item.price}`,
      );
      return false;
    }

    player.marrow -= item.price;
    item.sold = true;
    run.collection.push(item.card);
    console.log(
      `Purchased: ${item.card.name} | Marrow: ${player.marrow} | Collection: ${run.collection.length}`,
    );
    return true;
  }

  function refreshShop(act = 1) {
    if (player.marrow < shop.refreshCost) {
      console.log(`Not enough Marrow to refresh. Need: ${shop.refreshCost}`);
      return;
    }
    player.marrow -= shop.refreshCost;
    console.log(`Spent ${shop.refreshCost} Marrow to refresh shop.`);
    openShop(act);
  }

  return { openShop, generateShopInventory, shopPrice, buyCard, refreshShop };
}

module.exports = { createShopSystem };
